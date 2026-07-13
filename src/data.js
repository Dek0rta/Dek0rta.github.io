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

// plates — screenshots tipped into the issue like printed figures.
// src files live in assets/plates; captions are set in mono under each plate.
import satApp from "./assets/plates/sat-app.webp";
import satTest from "./assets/plates/sat-test.webp";
import satAi from "./assets/plates/sat-ai.webp";
import continuumHero from "./assets/plates/continuum-hero.webp";
import saymoreApp from "./assets/plates/saymore-app.webp";
import saymoreTutor from "./assets/plates/saymore-tutor.webp";

export const projects = [
  {
    no: "01",
    name: "SAT Portal",
    org: "Global Generation",
    desc: "A full SAT-prep platform used by 700+ students. Practice sets, adaptive scoring, progress tracking — built and shipped with the Global Generation team.",
    facts: [
      "1,200+ questions in Bluebook format",
      "full adaptive Digital SAT mock — 2h 14m, scored 400–1600",
      "AI tutor with five teaching modes",
      "interface in Russian — built for students across the CIS",
    ],
    plates: [
      {
        src: satApp,
        w: 1600,
        h: 781,
        alt: "SAT Portal app — practice modes screen with AI level assessment, smart practice and full-test options",
        caption: "practice modes — AI diagnostics, adaptive drills, full mocks",
        wide: true,
      },
      {
        src: satTest,
        w: 1200,
        h: 888,
        alt: "SAT Portal exam simulation — Reading and Writing module in Bluebook-style interface with passage and answer choices",
        caption: "exam simulation, faithful to the real Bluebook test",
      },
      {
        src: satAi,
        w: 1200,
        h: 819,
        alt: "SAT Portal AI tutor chat solving a quadratic equation step by step",
        caption: "the AI tutor, mid-explanation",
      },
    ],
    tags: ["React", "TypeScript", "Supabase"],
    metric: "700+ users · live",
    url: "https://sat.global-generations-edu.com/",
    live: "https://sat.global-generations-edu.com/",
    featured: true,
  },
  {
    no: "02",
    name: "Continuum Math",
    org: "Solo",
    desc: "A math exam-prep platform for the SAT and ЕГЭ — adaptive problem sets that track your level, theory right next to the practice, and an AI tutor. Designed, built and shipped solo.",
    plates: [
      {
        src: continuumHero,
        w: 1600,
        h: 1000,
        fig: "04",
        alt: "Continuum Math landing — «Подготовься к экзамену. Умнее. Быстрее.» with adaptive practice, theory and AI tutor",
        caption: "the front door — adaptive drills, theory in place, an AI tutor",
        wide: true,
      },
    ],
    tags: ["TypeScript", "Next.js", "Supabase"],
    metric: "live",
    url: null,
    live: "https://continuum-math.vercel.app",
    featured: false,
  },
  {
    no: "03",
    name: "SayMore",
    org: "Solo",
    desc: "A Telegram Mini App for tutoring — students get homework with deadlines, submit text, photos and files, and keep a learning streak; the tutor grades from a review queue while the bot handles every reminder. Little seal, big voice.",
    facts: [
      "full homework loop — assign, submit, grade, redo",
      "bot nudges: new task, graded, 24h before deadline",
      "streaks, progress and grades to keep students moving",
      "runs inside Telegram — nothing to install",
    ],
    plates: [
      {
        src: saymoreApp,
        w: 1600,
        h: 820,
        fig: "05", // figures run through the whole section: SAT 01–03, Continuum 04
        alt: "SayMore student cabinet — assignments list, home screen with seal mascot and learning streak, graded homework with tutor's comment",
        caption: "the student side — tasks, streaks, and a graded essay",
        wide: true,
      },
      {
        src: saymoreTutor,
        w: 1200,
        h: 880,
        fig: "06",
        alt: "SayMore tutor view — review queue with submitted essays, and a student progress screen with streak and grade stats",
        caption: "the tutor's review queue · a student's progress",
      },
    ],
    tags: ["React", "Node.js", "Telegram"],
    metric: "in use",
    url: null,
    live: null,
    featured: false,
  },
];

// THE PATH — the self-taught chronicle, printed year by year. There's no
// diploma to scan, so the issue runs the record instead. Facts are Zakhar's
// story — edit the years/entries freely, the layout adapts to any count.
export const path = [
  {
    year: "2021",
    title: "The first line",
    body: "Python, self-taught from a bedroom in Bryansk. No course, no mentor — official docs, broken scripts, and enough stubbornness to keep going.",
    artifact: '>>> print("hello, world")',
  },
  {
    year: "2023",
    title: "Code starts doing chores",
    body: "Telegram bots take over real errands — parsing schedules, chasing deadlines. The first time something I wrote ran all night without me.",
    artifact: "/start → bot online · 24/7",
  },
  {
    year: "2025",
    title: "Global Generation",
    body: "Joined the team and took the SAT platform from idea to production: practice sets, adaptive scoring, progress tracking for real students.",
    artifact: "git push origin main · sat.global-generations-edu.com",
  },
  {
    year: "2026",
    title: "700 people show up",
    body: "SAT Portal passes 700 active students. Continuum Math serves adaptive exam prep with an AI tutor. SayMore runs the whole homework loop for tutoring students inside Telegram.",
    artifact: "◆ 700+ users · live",
    live: true,
  },
  {
    year: "next",
    title: "Bryansk → US",
    body: "Applying to CS programs in the States — looking for the place that'll let me build at full size.",
    artifact: "Vol.02 — in preparation",
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
