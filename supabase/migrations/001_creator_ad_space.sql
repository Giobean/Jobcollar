create extension if not exists "pgcrypto";

create type profile_type as enum ('creator', 'advertiser');
create type ad_space_status as enum ('available', 'pending', 'sold', 'paused');
create type request_status as enum ('pending', 'accepted', 'declined', 'active', 'completed', 'cancelled');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded', 'disputed');
create type earning_status as enum ('pending', 'available', 'paid');

create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  type profile_type not null,
  username text unique not null check (username ~ '^[a-z0-9_]{3,30}$'),
  name text not null,
  bio text,
  avatar_url text,
  average_views integer not null default 0 check (average_views >= 0),
  followers integer not null default 0 check (followers >= 0),
  typical_videos_per_month integer check (typical_videos_per_month >= 0),
  content_category text,
  primary_platform text,
  stripe_account_id text unique,
  stripe_onboarding_complete boolean not null default false,
  payouts_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table videos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles(id) on delete cascade,
  title text not null, platform text not null, thumbnail_url text,
  views integer not null default 0 check (views >= 0),
  likes integer not null default 0 check (likes >= 0),
  comments integer not null default 0 check (comments >= 0),
  url text, created_at timestamptz not null default now()
);

create table ad_spaces (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles(id) on delete cascade,
  object_type text not null, object_name text not null, placement_location text not null,
  photo_url text not null, width_inches numeric(7,2) not null check (width_inches > 0),
  height_inches numeric(7,2) not null check (height_inches > 0),
  video_count integer not null check (video_count in (1,5,10,20,30)),
  creator_price numeric(12,2) not null check (creator_price > 0),
  recommended_price numeric(12,2) not null check (recommended_price > 0),
  placement_prominence smallint check (placement_prominence between 1 and 5),
  sign_size text check (sign_size in ('small','medium','large')),
  description text, status ad_space_status not null default 'available',
  created_at timestamptz not null default now()
);

create table ad_requests (
  id uuid primary key default gen_random_uuid(),
  ad_space_id uuid not null references ad_spaces(id),
  advertiser_id uuid not null references profiles(id),
  image_url text not null, website_url text, message text,
  price numeric(12,2) not null check (price > 0),
  status request_status not null default 'pending',
  payment_status payment_status not null default 'pending',
  stripe_checkout_session_id text unique, stripe_payment_intent_id text unique,
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  ad_request_id uuid unique not null references ad_requests(id),
  advertiser_id uuid not null references profiles(id), creator_id uuid not null references profiles(id),
  amount numeric(12,2) not null, platform_fee numeric(12,2) not null,
  creator_amount numeric(12,2) not null, currency text not null default 'usd',
  stripe_payment_intent_id text unique, stripe_checkout_session_id text unique,
  status payment_status not null default 'pending', paid_at timestamptz,
  created_at timestamptz not null default now(),
  check (amount = platform_fee + creator_amount)
);

create table placements (
  id uuid primary key default gen_random_uuid(),
  ad_request_id uuid unique not null references ad_requests(id),
  ad_space_id uuid not null references ad_spaces(id),
  videos_required integer not null check (videos_required > 0),
  videos_completed integer not null default 0 check (videos_completed >= 0 and videos_completed <= videos_required),
  payout_status earning_status not null default 'pending',
  status request_status not null default 'active',
  completed_at timestamptz, created_at timestamptz not null default now()
);

create table placement_proofs (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null references placements(id) on delete cascade,
  video_id uuid references videos(id), title text not null, platform text not null,
  url text, views integer check (views >= 0), proof_image_url text, proof_video_url text,
  completion_status text not null default 'submitted' check (completion_status in ('submitted','approved','rejected')),
  created_at timestamptz not null default now(),
  check (proof_image_url is not null or proof_video_url is not null)
);

create table webhook_events (
  stripe_event_id text primary key, event_type text not null,
  processed_at timestamptz, created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table videos enable row level security;
alter table ad_spaces enable row level security;
alter table ad_requests enable row level security;
alter table payments enable row level security;
alter table placements enable row level security;
alter table placement_proofs enable row level security;
alter table webhook_events enable row level security;

create policy "Public creator profiles are readable" on profiles for select using (type = 'creator');
create policy "Users manage own profile" on profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Available spaces are public" on ad_spaces for select using (status = 'available');
create policy "Creators manage own spaces" on ad_spaces for all
  using (creator_id in (select id from profiles where user_id = auth.uid()))
  with check (creator_id in (select id from profiles where user_id = auth.uid()));
create policy "Creators manage own videos" on videos for all
  using (creator_id in (select id from profiles where user_id = auth.uid()))
  with check (creator_id in (select id from profiles where user_id = auth.uid()));
create policy "Request participants can read" on ad_requests for select using (
  advertiser_id in (select id from profiles where user_id = auth.uid()) or
  ad_space_id in (select a.id from ad_spaces a join profiles p on p.id = a.creator_id where p.user_id = auth.uid())
);
create policy "Advertisers create requests" on ad_requests for insert
  with check (advertiser_id in (select id from profiles where user_id = auth.uid()));
create policy "Request participants can update" on ad_requests for update using (
  advertiser_id in (select id from profiles where user_id = auth.uid()) or
  ad_space_id in (select a.id from ad_spaces a join profiles p on p.id = a.creator_id where p.user_id = auth.uid())
);
create policy "Payment participants can read" on payments for select using (
  advertiser_id in (select id from profiles where user_id = auth.uid()) or
  creator_id in (select id from profiles where user_id = auth.uid())
);
create policy "Placement participants can read" on placements for select using (
  ad_request_id in (select r.id from ad_requests r where r.advertiser_id in (select id from profiles where user_id = auth.uid())) or
  ad_space_id in (select a.id from ad_spaces a join profiles p on p.id = a.creator_id where p.user_id = auth.uid())
);
create policy "Creator manages placement proofs" on placement_proofs for all using (
  placement_id in (select pl.id from placements pl join ad_spaces a on a.id = pl.ad_space_id join profiles p on p.id = a.creator_id where p.user_id = auth.uid())
) with check (
  placement_id in (select pl.id from placements pl join ad_spaces a on a.id = pl.ad_space_id join profiles p on p.id = a.creator_id where p.user_id = auth.uid())
);
create policy "Advertiser reads placement proofs" on placement_proofs for select using (
  placement_id in (select pl.id from placements pl join ad_requests r on r.id = pl.ad_request_id join profiles p on p.id = r.advertiser_id where p.user_id = auth.uid())
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('objects', 'objects', true, 10485760, array['image/jpeg','image/png','image/webp']),
  ('campaign-assets', 'campaign-assets', false, 104857600, array['image/jpeg','image/png','image/webp','video/mp4','video/webm','application/pdf'])
on conflict (id) do nothing;
