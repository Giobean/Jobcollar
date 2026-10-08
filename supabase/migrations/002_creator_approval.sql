-- Lightweight creator approval and moderation controls.
-- Existing creators are approved during migration so live inventory remains visible.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'creator_approval_status') then
    create type creator_approval_status as enum ('pending', 'approved', 'rejected', 'suspended');
  end if;
end $$;

alter table profiles
  add column if not exists approval_status creator_approval_status not null default 'pending',
  add column if not exists approval_submitted_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists suspended_at timestamptz,
  add column if not exists approval_reason text;

-- This statement only affects rows that predate this migration. New creators
-- retain the pending default.
update profiles
set approval_status = 'approved',
    approved_at = coalesce(approved_at, now())
where type = 'creator'
  and approval_status = 'pending'
  and approval_submitted_at is null;

create index if not exists profiles_approval_queue_idx
  on profiles (approval_status, approval_submitted_at)
  where type = 'creator';

create index if not exists ad_spaces_public_inventory_idx
  on ad_spaces (creator_id, status)
  where status = 'available';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.protect_profile_moderation_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.approval_status := 'pending';
    new.approval_submitted_at := null;
    new.approved_at := null;
    new.rejected_at := null;
    new.suspended_at := null;
    new.approval_reason := null;
    return new;
  end if;

  if new.approval_status is distinct from old.approval_status
    or new.approval_submitted_at is distinct from old.approval_submitted_at
    or new.approved_at is distinct from old.approved_at
    or new.rejected_at is distinct from old.rejected_at
    or new.suspended_at is distinct from old.suspended_at
    or new.approval_reason is distinct from old.approval_reason then
    if new.approval_status = 'pending'
      and old.approval_status in ('pending', 'rejected')
      and new.approval_submitted_at is not null
      and new.approved_at is null
      and new.rejected_at is null
      and new.suspended_at is null
      and new.approval_reason is null
      and nullif(trim(new.name), '') is not null
      and nullif(trim(new.username), '') is not null
      and nullif(trim(new.avatar_url), '') is not null
      and nullif(trim(new.bio), '') is not null
      and nullif(trim(new.content_category), '') is not null
      and nullif(trim(new.primary_platform), '') is not null
      and new.average_views > 0
      and new.followers > 0 then
      return new;
    end if;
    raise exception 'Creator approval fields may only be changed by an administrator';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_moderation_fields on profiles;
create trigger protect_profile_moderation_fields
before insert or update on profiles
for each row execute function public.protect_profile_moderation_fields();

drop policy if exists "Public creator profiles are readable" on profiles;
drop policy if exists "Users manage own profile" on profiles;

create policy "Approved creators are public" on profiles for select using (
  (type = 'creator' and approval_status = 'approved')
  or user_id = auth.uid()
  or public.is_admin()
);
create policy "Users create own pending profile" on profiles for insert with check (
  user_id = auth.uid()
  and (type <> 'creator' or approval_status = 'pending')
);
create policy "Users update own profile" on profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "Admins manage profiles" on profiles for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Available spaces are public" on ad_spaces;
drop policy if exists "Creators manage own spaces" on ad_spaces;

create policy "Approved creator inventory is public" on ad_spaces for select using (
  (
    status = 'available'
    and exists (
      select 1 from profiles p
      where p.id = ad_spaces.creator_id
        and p.type = 'creator'
        and p.approval_status = 'approved'
    )
  )
  or creator_id in (select id from profiles where user_id = auth.uid())
  or public.is_admin()
);
create policy "Creators create own inventory" on ad_spaces for insert with check (
  creator_id in (select id from profiles where user_id = auth.uid() and type = 'creator')
);
create policy "Creators update own inventory" on ad_spaces for update
  using (creator_id in (select id from profiles where user_id = auth.uid() and type = 'creator'))
  with check (creator_id in (select id from profiles where user_id = auth.uid() and type = 'creator'));
create policy "Creators delete own inventory" on ad_spaces for delete using (
  creator_id in (select id from profiles where user_id = auth.uid() and type = 'creator')
);
create policy "Admins manage creator inventory" on ad_spaces for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Advertisers create requests" on ad_requests;
create policy "Advertisers request approved available inventory" on ad_requests
for insert with check (
  advertiser_id in (
    select id from profiles
    where user_id = auth.uid() and type = 'advertiser'
  )
  and exists (
    select 1
    from ad_spaces a
    join profiles creator on creator.id = a.creator_id
    where a.id = ad_requests.ad_space_id
      and a.status = 'available'
      and creator.type = 'creator'
      and creator.approval_status = 'approved'
  )
);

-- Only a creator can submit their own complete profile. Keeping this operation
-- in the database prevents spoofed status or timestamp values from clients.
create or replace function public.submit_creator_for_review()
returns table (approval_status creator_approval_status, approval_submitted_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  creator public.profiles;
begin
  select * into creator
  from public.profiles
  where user_id = auth.uid() and type = 'creator'
  for update;

  if creator.id is null then
    raise exception 'Creator profile not found';
  end if;
  if creator.approval_status = 'pending' and creator.approval_submitted_at is not null then
    raise exception 'Creator profile is already under review';
  end if;
  if creator.approval_status in ('approved', 'suspended') then
    raise exception 'Creator profile cannot be submitted in its current state';
  end if;
  if nullif(trim(creator.name), '') is null
    or nullif(trim(creator.username), '') is null
    or nullif(trim(creator.avatar_url), '') is null
    or nullif(trim(creator.bio), '') is null
    or nullif(trim(creator.content_category), '') is null
    or nullif(trim(creator.primary_platform), '') is null
    or creator.average_views <= 0
    or creator.followers <= 0 then
    raise exception 'Complete all required profile fields before submitting';
  end if;

  update public.profiles
  set approval_status = 'pending',
      approval_submitted_at = now(),
      approved_at = null,
      rejected_at = null,
      suspended_at = null,
      approval_reason = null
  where id = creator.id
  returning profiles.approval_status, profiles.approval_submitted_at
  into approval_status, approval_submitted_at;
  return next;
end;
$$;

revoke all on function public.submit_creator_for_review() from public;
grant execute on function public.submit_creator_for_review() to authenticated;
