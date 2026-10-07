export type AdSpace = {
  id: string;
  creator: string;
  username: string;
  category: string;
  platform: string;
  objectName: string;
  objectType: string;
  placement: string;
  width: number;
  height: number;
  videos: number;
  averageViews: number;
  price: number;
  recommendedPrice: number;
  image: string;
  imageAlt: string;
  accent: string;
  description: string;
  availability: "Available" | "Selling fast";
};

export const adSpaces: AdSpace[] = [
  {
    id: "skateboard-deck",
    creator: "Alex Rivera",
    username: "alex",
    category: "Skateboarding",
    platform: "TikTok",
    objectName: "Skateboard Deck",
    objectType: "Skateboard",
    placement: "Underside center",
    width: 8,
    height: 3,
    videos: 10,
    averageViews: 150000,
    price: 500,
    recommendedPrice: 460,
    image:
      "https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?auto=format&fit=crop&w=1200&q=85",
    imageAlt:
      "Skateboarder holding a skateboard with the deck visible in warm evening light",
    accent: "#ff6b3d",
    description:
      "A high-motion placement on the underside of my everyday street deck. It is clearly visible in setup shots, tricks, and board close-ups.",
    availability: "Available",
  },
  {
    id: "hoodie-sleeve",
    creator: "Maya Chen",
    username: "maya",
    category: "Fashion",
    platform: "Instagram",
    objectName: "Studio Hoodie",
    objectType: "Hoodie",
    placement: "Left sleeve",
    width: 2,
    height: 5,
    videos: 5,
    averageViews: 85000,
    price: 180,
    recommendedPrice: 165,
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Person wearing a bright hoodie with the left sleeve visible",
    accent: "#7c5cff",
    description:
      "A vertical sleeve placement that stays visible during styling videos and outfit transitions.",
    availability: "Selling fast",
  },
  {
    id: "laptop-lid",
    creator: "Jordan Blake",
    username: "jordan",
    category: "Gaming",
    platform: "YouTube",
    objectName: "Streaming Laptop",
    objectType: "Laptop",
    placement: "Lid, upper right",
    width: 4,
    height: 3,
    videos: 10,
    averageViews: 220000,
    price: 620,
    recommendedPrice: 590,
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Open laptop on a wooden desk in a bright workspace",
    accent: "#18a67e",
    description:
      "A clean laptop-lid placement seen in desk tours, stream intros, and behind-the-scenes clips.",
    availability: "Available",
  },
  {
    id: "bottle-center",
    creator: "Sam Ortiz",
    username: "sam",
    category: "Lifestyle",
    platform: "TikTok",
    objectName: "Daily Water Bottle",
    objectType: "Bottle",
    placement: "Front center",
    width: 3,
    height: 2,
    videos: 5,
    averageViews: 65000,
    price: 125,
    recommendedPrice: 125,
    image:
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Reusable water bottle standing on a light surface",
    accent: "#e8a325",
    description:
      "My always-on-desk bottle, featured naturally in routines, work sessions, and travel prep.",
    availability: "Available",
  },
  {
    id: "hat-front",
    creator: "Alex Rivera",
    username: "alex",
    category: "Skateboarding",
    platform: "TikTok",
    objectName: "Black Skate Cap",
    objectType: "Hat",
    placement: "Front panel",
    width: 3,
    height: 2,
    videos: 5,
    averageViews: 150000,
    price: 150,
    recommendedPrice: 125,
    image:
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Black baseball cap showing the front panel",
    accent: "#2788f5",
    description:
      "Front-and-center cap placement worn in every skate session and talking-to-camera intro.",
    availability: "Available",
  },
  {
    id: "shirt-chest",
    creator: "Maya Chen",
    username: "maya",
    category: "Fashion",
    platform: "Instagram",
    objectName: "Everyday Tee",
    objectType: "Shirt",
    placement: "Left chest",
    width: 3,
    height: 3,
    videos: 5,
    averageViews: 85000,
    price: 200,
    recommendedPrice: 185,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "White t-shirt hanging against a simple wall",
    accent: "#ef4d79",
    description:
      "A classic chest placement for outfit reels and casual styling content.",
    availability: "Available",
  },
];

export const formatViews = (value: number) =>
  value >= 1000 ? `${Math.round(value / 1000)}K` : String(value);

export const getAdSpace = (id: string) =>
  adSpaces.find((space) => space.id === id) ?? adSpaces[0];

export const PLATFORM_FEE_RATE = Number(
  process.env.PLATFORM_FEE_PERCENT ?? 10,
) / 100;

export function calculateRecommendedPrice(input: {
  averageViews: number;
  videoCount: number;
  width: number;
  height: number;
  prominence?: number;
  signSize?: "small" | "medium" | "large";
}) {
  const area = input.width * input.height;
  const prominence = input.prominence ?? 3;
  const signMultiplier =
    input.signSize === "large" ? 1.08 : input.signSize === "medium" ? 1.04 : 1;
  const raw =
    35 +
    (input.averageViews / 1000) * 0.08 * input.videoCount +
    area * 2.5 +
    prominence * 8;
  return Math.max(50, Math.round((raw * signMultiplier) / 5) * 5);
}
