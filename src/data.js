// ─── single source of truth for the whole issue ───
// edit here → everything updates

export const profile = {
  name: "Zakhar Sukhanov",
  first: "Zakhar",
  last: "Sukhanov",
  handle: "dek0rta",
  role: "Self-taught software engineer",
  location: "Bryansk → US",
  tagline: "I build things people actually use.",
  volume: "Vol.01",
  year: "'26",
  shippingSince: "2021",
};

// the one live number — SAT Portal real users
export const headline = {
  liveUsers: 700, // animates 0 → 700 on load
  liveLabel: "people use what I ship",
  product: "SAT Portal",
};

export const stats = [
  { value: "700+", label: "active users on SAT Portal" },
  { value: "Bryansk → US", label: "self-taught, no bootcamp" },
  { value: "since '21", label: "shipping real software" },
];

export const projects = [
  {
    no: "01",
    name: "SAT Portal",
    org: "Global Generation",
    desc: "A full SAT-prep platform used by 700+ students. Practice sets, adaptive scoring, progress tracking — built and shipped with the Global Generation team.",
    tags: ["React", "TypeScript", "Supabase"],
    metric: "700+ users · live",
    url: "https://sat.global-generations-edu.com/",
    live: "https://sat.global-generations-edu.com/",
    featured: true,
  },
  {
    no: "02",
    name: "Continuum",
    org: "Solo",
    desc: "Physics and math simulations that run in the browser — turning textbook equations into things you can drag, tune, and watch evolve.",
    tags: ["TypeScript", "Next.js", "Supabase"],
    metric: "live",
    url: "https://github.com/Dek0rta/Coninuum-Physics",
    live: "https://coninuum-physics.vercel.app",
    featured: false,
  },
  {
    no: "03",
    name: "Homework Bot",
    org: "Solo",
    desc: "A Telegram bot that reads a photo of your homework with Gemini + OCR, finds the deadlines, and drops them straight into Google Calendar. Built it because I needed it.",
    tags: ["Python", "Gemini", "OCR"],
    metric: "in use",
    url: "https://github.com/Dek0rta/Homework-bot",
    live: null,
    featured: false,
  },
];

export const stack = [
  { name: "Python", note: "bots · LLM · OCR · automation", level: 88 },
  { name: "TypeScript", note: "React · Next.js · the web", level: 74 },
  { name: "SQL", note: "Supabase · data modeling", level: 56 },
  { name: "Bash", note: "deploy · servers · glue", level: 40 },
];

export const socials = [
  { name: "GitHub", handle: "@Dek0rta", url: "https://github.com/Dek0rta", icon: "github" },
  { name: "Telegram", handle: "@dek0rta", url: "https://t.me/dek0rta", icon: "telegram" },
  { name: "Email", handle: "Dek0rta@yandex.com", url: "mailto:Dek0rta@yandex.com", icon: "mail" },
];
