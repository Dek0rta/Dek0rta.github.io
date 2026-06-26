// ─── single source of truth for the whole site ───
// edit here → everything updates

export const profile = {
  name: "DEK0RTA",
  handle: "dek0rta",
  role: "Developer",
  location: "Bryansk, RU",
  tagline: "I build AI tools I actually use.",
  year: "2093",
};

// languages — value = mastery 0..100 (later: live from WakaTime)
export const languages = [
  { name: "Python",     level: 88, note: "bots · gemini · ocr",   color: "#ffd43b" },
  { name: "TypeScript", level: 72, note: "next.js · supabase",    color: "#3178c6" },
  { name: "SQL",        level: 50, note: "supabase · data",        color: "#e38c00" },
  { name: "Bash",       level: 38, note: "deploy · railway",       color: "#4eaa25" },
];

export const projects = [
  {
    name: "homework-bot",
    desc: "Telegram bot — Gemini LLM + OCR. Reads homework, drops deadlines into Google Calendar, runs its own analytics.",
    tags: ["Python", "Gemini", "OCR"],
    url: "https://github.com/Dek0rta/Homework-bot",
    live: null,
  },
  {
    name: "coninuum-physics",
    desc: "Physics simulations on the web. Built with Next.js + Supabase.",
    tags: ["TypeScript", "Next.js", "Supabase"],
    url: "https://github.com/Dek0rta/Coninuum-Physics",
    live: "https://coninuum-physics.vercel.app",
  },
  {
    name: "sportbaza-ironflow",
    desc: "Sport / training tracker.",
    tags: ["Python"],
    url: "https://github.com/Dek0rta/SPORTBAZA-IronFLow",
    live: null,
  },
];

// fill real handles — placeholders for now
export const socials = [
  { name: "GitHub",   handle: "@Dek0rta",      url: "https://github.com/Dek0rta",                    icon: "github" },
  { name: "Telegram", handle: "@dek0rta",      url: "https://t.me/dek0rta",                          icon: "telegram" },
  { name: "X",        handle: "@dek0rta",      url: "https://x.com/dek0rta",                         icon: "x" },
  { name: "LinkedIn", handle: "in/dek0rta",    url: "https://linkedin.com/in/dek0rta",               icon: "linkedin" },
  { name: "Email",    handle: "levavdoshin.connect@gmail.com", url: "mailto:levavdoshin.connect@gmail.com", icon: "mail" },
];

// placeholder — replaced by live Spotify later
export const nowPlaying = {
  track: "we'r in this bitch",
  artist: "Yeat",
  album: "2093",
  cover: null, // gradient fallback
  progress: 0.42,
  isPlaying: true,
};

// placeholder — replaced by live WakaTime later
export const codeStats = {
  todayLabel: "this week",
  totalHours: "31h 47m",
  byLang: languages.map((l) => ({ name: l.name, color: l.color, pct: l.level })),
};
