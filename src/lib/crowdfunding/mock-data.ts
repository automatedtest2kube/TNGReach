/**
 * Campaign cover photos (Unsplash, stable URLs) — same intent as reach-heart-bloom / crawdfunding reference.
 * Local JPGs are optional; these load real imagery in the app shell.
 */
const campaignImg = {
  stall:
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
  medical:
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
  food: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
  business:
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
  behavior:
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80",
  roof: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80",
} as const;

export type Category = "Medical" | "Food" | "Business" | "Behavior";
export type Urgency = "High" | "Medium" | "Low";

export interface StoryUpdate {
  date: string;
  text: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  raised: number;
  goal: number;
  supporters: number;
  verified: boolean;
  image: string;
  urgency: Urgency;
  category: Category;
  cause: string;
  usage: string;
  location: { lat: number; lng: number; place: string };
  updates: StoryUpdate[];
}

export const CAMPAIGNS: Campaign[] = [
  {
    id: "c1",
    name: "Uncle Ah Seng",
    description: "Repairing his food stall roof so he can keep cooking for the neighbourhood.",
    raised: 320,
    goal: 800,
    supporters: 47,
    verified: true,
    image: campaignImg.stall,
    urgency: "High",
    category: "Business",
    cause: "Stall roof collapsed after heavy rain. Needs zinc sheets and labour.",
    usage: "RM120 used for materials, RM200 reserved for labour.",
    location: { lat: 30, lng: 38, place: "Pudu, KL" },
    updates: [
      { date: "Today", text: "Roof repair started 🛠️" },
      { date: "2 days ago", text: "Materials purchased" },
    ],
  },
  {
    id: "c2",
    name: "Aishah's Treatment",
    description: "Helping a young mother access urgent medical care for her son.",
    raised: 1450,
    goal: 2000,
    supporters: 132,
    verified: true,
    image: campaignImg.medical,
    urgency: "High",
    category: "Medical",
    cause: "Specialist consultation and follow-up medication.",
    usage: "RM800 used for consultation. RM650 reserved for medicine.",
    location: { lat: 55, lng: 22, place: "Subang Jaya" },
    updates: [
      { date: "Yesterday", text: "Medical appointment scheduled 🏥" },
      { date: "3 days ago", text: "Reached 50% funded — milestone!" },
    ],
  },
  {
    id: "c3",
    name: "Rice for 30 Families",
    description: "Weekly rice and essentials for low-income families in Klang.",
    raised: 540,
    goal: 1200,
    supporters: 89,
    verified: true,
    image: campaignImg.food,
    urgency: "Medium",
    category: "Food",
    cause: "Monthly food packs of rice, oil, eggs and vegetables.",
    usage: "RM540 used to pack 18 of 30 family bundles.",
    location: { lat: 70, lng: 60, place: "Klang" },
    updates: [
      { date: "Today", text: "Supplies purchased 🛒" },
      { date: "1 week ago", text: "20 new supporters joined" },
    ],
  },
  {
    id: "c4",
    name: "Mei Ling's Tailor Shop",
    description: "A single mother starting a small batik tailoring business.",
    raised: 980,
    goal: 1500,
    supporters: 64,
    verified: true,
    image: campaignImg.business,
    urgency: "Medium",
    category: "Business",
    cause: "Sewing machine, fabric stock, and 3 months rent for a tiny shoplot.",
    usage: "RM700 used for sewing machine. RM280 for first batch of fabric.",
    location: { lat: 40, lng: 70, place: "Cheras" },
    updates: [{ date: "2 days ago", text: "Sewing machine delivered 🧵" }],
  },
  {
    id: "c5",
    name: "After-School Reading Club",
    description: "Mentors and books for kids in a kampung community centre.",
    raised: 210,
    goal: 600,
    supporters: 28,
    verified: false,
    image: campaignImg.behavior,
    urgency: "Low",
    category: "Behavior",
    cause: "Books, stationery and small mentor stipend for weekly sessions.",
    usage: "RM210 used for first set of storybooks.",
    location: { lat: 25, lng: 65, place: "Hulu Langat" },
    updates: [{ date: "5 days ago", text: "First reading session held 📚" }],
  },
  {
    id: "c6",
    name: "Mak Cik Salmah",
    description: "Repairing the roof of an elderly woman's kampung home.",
    raised: 750,
    goal: 900,
    supporters: 96,
    verified: true,
    image: campaignImg.roof,
    urgency: "High",
    category: "Business",
    cause: "Roof leaks during monsoon — urgent repair before next rain.",
    usage: "RM500 used for zinc and wood. RM250 for contractor.",
    location: { lat: 60, lng: 35, place: "Kuala Selangor" },
    updates: [
      { date: "Today", text: "Almost there — 83% funded! 🎉" },
      { date: "4 days ago", text: "Contractor confirmed" },
    ],
  },
];

export const CATEGORIES: Array<"All" | Category> = [
  "All",
  "Medical",
  "Food",
  "Business",
  "Behavior",
];
