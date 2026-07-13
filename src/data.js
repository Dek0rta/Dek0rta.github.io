// ─── single source of truth for the whole issue ───
// edit here → everything updates
// fields that differ between the EN and RU printings are {en, ru} objects —
// components resolve them with usePick() from i18n.jsx.

export const profile = {
  name: { en: "Zakhar Sukhanov", ru: "Захар Суханов" },
  first: { en: "Zakhar", ru: "Захар" },
  last: { en: "Sukhanov", ru: "Суханов" },
  handle: "dek0rta",
  role: "Self-taught software engineer",
  location: { en: "Bryansk → US", ru: "Брянск → США" },
  tagline: "I build things people actually use.",
  volume: "Vol.01",
  year: "'26",
  shippingSince: "2021",
};

// the one live number — SAT Portal real users
export const headline = {
  liveUsers: 700, // animates 0 → 700 on load
  liveLabel: {
    en: "people use what I ship",
    ru: "человек пользуются тем, что я делаю",
  },
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
    desc: {
      en: "A full SAT-prep platform used by 700+ students. Practice sets, adaptive scoring, progress tracking — built and shipped with the Global Generation team.",
      ru: "Полноценная платформа подготовки к SAT, которой пользуются 700+ учеников. Тренировочные наборы, адаптивный скоринг, трекинг прогресса — сделано и выпущено вместе с командой Global Generation.",
    },
    facts: [
      {
        en: "1,200+ questions in Bluebook format",
        ru: "1200+ заданий в формате Bluebook",
      },
      {
        en: "full adaptive Digital SAT mock — 2h 14m, scored 400–1600",
        ru: "полный адаптивный мок Digital SAT — 2 ч 14 мин, шкала 400–1600",
      },
      {
        en: "AI tutor with five teaching modes",
        ru: "AI-тьютор с пятью режимами объяснения",
      },
      {
        en: "interface in Russian — built for students across the CIS",
        ru: "интерфейс на русском — для учеников по всему СНГ",
      },
    ],
    plates: [
      {
        src: satApp,
        w: 1600,
        h: 781,
        alt: {
          en: "SAT Portal app — practice modes screen with AI level assessment, smart practice and full-test options",
          ru: "Приложение SAT Portal — экран режимов практики с AI-оценкой уровня, умной практикой и полными тестами",
        },
        caption: {
          en: "practice modes — AI diagnostics, adaptive drills, full mocks",
          ru: "режимы практики — AI-диагностика, адаптивные дриллы, полные моки",
        },
        wide: true,
      },
      {
        src: satTest,
        w: 1200,
        h: 888,
        alt: {
          en: "SAT Portal exam simulation — Reading and Writing module in Bluebook-style interface with passage and answer choices",
          ru: "Симуляция экзамена SAT Portal — модуль Reading and Writing в интерфейсе в стиле Bluebook",
        },
        caption: {
          en: "exam simulation, faithful to the real Bluebook test",
          ru: "симуляция экзамена — точная копия настоящего Bluebook",
        },
      },
      {
        src: satAi,
        w: 1200,
        h: 819,
        alt: {
          en: "SAT Portal AI tutor chat solving a quadratic equation step by step",
          ru: "Чат AI-тьютора SAT Portal, шаг за шагом решающий квадратное уравнение",
        },
        caption: {
          en: "the AI tutor, mid-explanation",
          ru: "AI-тьютор посреди объяснения",
        },
      },
    ],
    tags: ["React", "TypeScript", "Supabase"],
    metric: { en: "700+ users · live", ru: "700+ пользователей · live" },
    url: "https://sat.global-generations-edu.com/",
    live: "https://sat.global-generations-edu.com/",
    featured: true,
  },
  {
    no: "02",
    name: "Continuum Math",
    org: { en: "Solo", ru: "Соло" },
    desc: {
      en: "A math exam-prep platform for the SAT and ЕГЭ — adaptive problem sets that track your level, theory right next to the practice, and an AI tutor. Designed, built and shipped solo.",
      ru: "Платформа подготовки по математике к SAT и ЕГЭ — адаптивные задачи, которые следят за твоим уровнем, теория рядом с практикой и AI-тьютор. Спроектирована, собрана и выпущена в одиночку.",
    },
    plates: [
      {
        src: continuumHero,
        w: 1600,
        h: 1000,
        fig: "04",
        alt: {
          en: "Continuum Math landing — «Подготовься к экзамену. Умнее. Быстрее.» with adaptive practice, theory and AI tutor",
          ru: "Лендинг Continuum Math — «Подготовься к экзамену. Умнее. Быстрее.» с адаптивной практикой, теорией и AI-тьютором",
        },
        caption: {
          en: "the front door — adaptive drills, theory in place, an AI tutor",
          ru: "входная дверь — адаптивные дриллы, теория на месте, AI-тьютор",
        },
        wide: true,
      },
    ],
    tags: ["TypeScript", "Next.js", "Supabase"],
    metric: { en: "live", ru: "live" },
    url: null,
    live: "https://continuum-math.vercel.app",
    featured: false,
  },
  {
    no: "03",
    name: "SayMore",
    org: { en: "Solo", ru: "Соло" },
    desc: {
      en: "A Telegram Mini App for tutoring — students get homework with deadlines, submit text, photos and files, and keep a learning streak; the tutor grades from a review queue while the bot handles every reminder. Little seal, big voice.",
      ru: "Telegram Mini App для репетиторства — ученики получают домашку с дедлайнами, сдают текст, фото и файлы и держат стрик; репетитор проверяет из очереди, а бот берёт напоминания на себя. Little seal, big voice.",
    },
    facts: [
      {
        en: "full homework loop — assign, submit, grade, redo",
        ru: "полный цикл домашки — выдать, сдать, проверить, пересдать",
      },
      {
        en: "bot nudges: new task, graded, 24h before deadline",
        ru: "бот напоминает: новое задание, проверено, за 24 ч до дедлайна",
      },
      {
        en: "streaks, progress and grades to keep students moving",
        ru: "стрики, прогресс и оценки, чтобы ученики не буксовали",
      },
      {
        en: "runs inside Telegram — nothing to install",
        ru: "живёт внутри Telegram — ничего не надо ставить",
      },
    ],
    plates: [
      {
        src: saymoreApp,
        w: 1600,
        h: 820,
        fig: "05", // figures run through the whole section: SAT 01–03, Continuum 04
        alt: {
          en: "SayMore student cabinet — assignments list, home screen with seal mascot and learning streak, graded homework with tutor's comment",
          ru: "Кабинет ученика SayMore — список заданий, главный экран с тюленем-маскотом и стриком, проверенная домашка с комментарием репетитора",
        },
        caption: {
          en: "the student side — tasks, streaks, and a graded essay",
          ru: "сторона ученика — задания, стрики и проверенное эссе",
        },
        wide: true,
      },
      {
        src: saymoreTutor,
        w: 1200,
        h: 880,
        fig: "06",
        alt: {
          en: "SayMore tutor view — review queue with submitted essays, and a student progress screen with streak and grade stats",
          ru: "Вид репетитора SayMore — очередь проверки со сданными эссе и экран прогресса ученика со стриком и оценками",
        },
        caption: {
          en: "the tutor's review queue · a student's progress",
          ru: "очередь проверки репетитора · прогресс ученика",
        },
      },
    ],
    tags: ["React", "Node.js", "Telegram"],
    metric: { en: "in use", ru: "в работе" },
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
    title: { en: "The first line", ru: "Первая строка" },
    body: {
      en: "Python, self-taught from a bedroom in Bryansk. No course, no mentor — official docs, broken scripts, and enough stubbornness to keep going.",
      ru: "Python, выученный самостоятельно из спальни в Брянске. Ни курсов, ни менторов — официальная документация, сломанные скрипты и достаточно упрямства, чтобы не бросить.",
    },
    artifact: '>>> print("hello, world")',
  },
  {
    year: "2023",
    title: { en: "Code starts doing chores", ru: "Код берёт на себя рутину" },
    body: {
      en: "Telegram bots take over real errands — parsing schedules, chasing deadlines. The first time something I wrote ran all night without me.",
      ru: "Telegram-боты забирают настоящие дела — парсят расписания, следят за дедлайнами. Первый раз, когда написанное мной работало всю ночь без меня.",
    },
    artifact: "/start → bot online · 24/7",
  },
  {
    year: "2025",
    title: { en: "Global Generation", ru: "Global Generation" },
    body: {
      en: "Joined the team and took the SAT platform from idea to production: practice sets, adaptive scoring, progress tracking for real students.",
      ru: "Присоединился к команде и довёл SAT-платформу от идеи до продакшена: тренировочные наборы, адаптивный скоринг, трекинг прогресса для настоящих учеников.",
    },
    artifact: "git push origin main · sat.global-generations-edu.com",
  },
  {
    year: "2026",
    title: { en: "700 people show up", ru: "Приходят 700 человек" },
    body: {
      en: "SAT Portal passes 700 active students. Continuum Math serves adaptive exam prep with an AI tutor. SayMore runs the whole homework loop for tutoring students inside Telegram.",
      ru: "SAT Portal переваливает за 700 активных учеников. Continuum Math даёт адаптивную подготовку к экзаменам с AI-тьютором. SayMore ведёт весь цикл домашки для учеников репетитора прямо в Telegram.",
    },
    artifact: {
      en: "◆ 700+ users · live",
      ru: "◆ 700+ пользователей · live",
    },
    live: true,
  },
  {
    year: { en: "next", ru: "дальше" },
    title: { en: "Bryansk → US", ru: "Брянск → США" },
    body: {
      en: "Applying to CS programs in the States — looking for the place that'll let me build at full size.",
      ru: "Подаюсь на CS-программы в Штатах — ищу место, которое даст строить в полный размер.",
    },
    artifact: {
      en: "Vol.02 — in preparation",
      ru: "Vol.02 — готовится",
    },
  },
];

export const stack = [
  {
    name: "Python",
    note: {
      en: "bots · LLM · OCR · automation",
      ru: "боты · LLM · OCR · автоматизация",
    },
    level: 88,
  },
  {
    name: "TypeScript",
    note: { en: "React · Next.js · the web", ru: "React · Next.js · веб" },
    level: 74,
  },
  {
    name: "SQL",
    note: {
      en: "Supabase · data modeling",
      ru: "Supabase · моделирование данных",
    },
    level: 56,
  },
  {
    name: "Bash",
    note: { en: "deploy · servers · glue", ru: "деплой · серверы · склейка" },
    level: 40,
  },
];

export const socials = [
  { name: "GitHub", handle: "@Dek0rta", url: "https://github.com/Dek0rta", icon: "github" },
  { name: "Telegram", handle: "@dek0rta", url: "https://t.me/dek0rta", icon: "telegram" },
  {
    name: { en: "Email", ru: "Почта" },
    handle: "Dek0rta@yandex.com",
    url: "mailto:Dek0rta@yandex.com",
    icon: "mail",
  },
];
