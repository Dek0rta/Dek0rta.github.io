import { createContext, useContext, useEffect, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// ─── the issue is printed in two languages ───
// EN is the master edition; RU is the parallel printing. Data fields that
// differ per language are {en, ru} objects — `usePick()` resolves them.
// All UI copy (labels, folios, templates) lives in STR below.

const LangContext = createContext({ lang: "en", setLang: () => {} });

export function LangProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem("issue-lang") || "en",
  );

  useEffect(() => {
    localStorage.setItem("issue-lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.setAttribute("data-lang", lang);
    // copy lengths differ between printings — remeasure everything that
    // pinned itself to the old layout (the thread, scroll reveals).
    const t = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
      ScrollTrigger.refresh();
    }, 60);
    return () => clearTimeout(t);
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);

// resolve a bilingual data value: {en, ru} → string, anything else passes through
export function usePick() {
  const { lang } = useLang();
  return (v) =>
    v && typeof v === "object" && "en" in v ? (v[lang] ?? v.en) : v;
}

// UI strings — t("key")
const STR = {
  en: {
    // topbar
    "topbar.theme": (next) => `Switch to ${next} mode`,
    "topbar.lang": "Переключить на русский",
    "topbar.day": "Day",
    "topbar.night": "Night",

    // hero / cover
    "hero.folio": "Cover",
    "hero.line1": "Self-taught",
    "hero.line2": "software engineer",
    "hero.line3": "building things people",
    "hero.line4": "actually use.",
    "hero.since": (year) => `shipping since ${year}.`,
    "hero.portrait": (name) => `Portrait of ${name}`,

    // the record
    "record.folio": "The Record",
    "record.title": "A year, kept in ink.",
    "record.lede": (first) =>
      `Every mark below is one day of work on ${first}'s public repositories — pulled live from GitHub, the densest stretches charged in red. No streak-farming, no filler. Just the record.`,
    "record.contrib": "contributions · last 12 mo",
    "record.streak": "longest streak",
    "record.repos": "public repositories",
    "record.first": "first commit on record",
    "record.levels": [
      "no commits",
      "a light day",
      "a steady day",
      "a busy day",
      "a heavy day",
    ],
    "record.months": [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ],
    "record.locale": "en-US",

    // projects
    "projects.folio": "What I shipped",
    "projects.open": "Open it",
    "projects.code": "Code",
    "projects.visit": (name) => `${name} — open live site`,

    // the path
    "path.folio": "The path",
    "path.lead":
      "No bootcamp, no CS class. Just five years of shipping — here's the record, in order.",

    // the stack
    "stack.folio": "The stack",
    "stack.lead":
      "No two projects taught me the same thing. The tools just kept stacking up.",

    // colophon
    "colo.folio": "Colophon",
    "colo.cta1": "I'm looking for the place that'll",
    "colo.cta2": " let me build at full size.",
    "colo.note":
      "Set in Fraunces & JetBrains Mono. Built by hand with React, three.js & GSAP.",

    // proof (the editor's red pencil)
    "proof.rev": (n) => `rev. ${n}`,
    "proof.line": (add, struck, last) =>
      ` — ${add} lines set, ${struck}. last pass ${last} `,
    "proof.struck": (n) => `${n} struck`,
    "proof.none": "none struck",
    "proof.ed": "—ed.",
    "proof.src": "from git log · at build",
    "proof.printing": (ord) => `${ord} printing`,
    "proof.total": (first, add, del) =>
      ` since ${first} — ${add} lines set, ${del} struck. `,

    // overture
    "issue.kicker": "The Issue",
    "issue.skip": "tap / scroll to skip",

    // the tear
    "tear.tab.closed": "tear",
    "tear.tab.open": "reprint",
    "tear.aria.closed": "Tear the page corner to reveal this section's source code",
    "tear.aria.open": "Repair the page and hide the source code",
    "tear.caption": (filename) =>
      ` ${filename} — the actual source printing this section. nothing to hide.`,
  },

  ru: {
    // topbar
    "topbar.theme": (next) =>
      `Включить ${next === "night" ? "ночной" : "дневной"} режим`,
    "topbar.lang": "Switch to English",
    "topbar.day": "День",
    "topbar.night": "Ночь",

    // hero / cover
    "hero.folio": "Обложка",
    "hero.line1": "Инженер-",
    "hero.line2": "самоучка,",
    "hero.line3": "делаю то, чем люди",
    "hero.line4": "правда пользуются.",
    "hero.since": (year) => `выпускаю с ${year}.`,
    "hero.portrait": (name) => `Портрет: ${name}`,

    // the record
    "record.folio": "Хроника",
    "record.title": "Год, записанный чернилами.",
    "record.lede": () =>
      "Каждая точка ниже — один день работы в публичных репозиториях Захара: данные прямо из GitHub, самые плотные полосы отмечены красным. Без накруток и наполнителя. Только хроника.",
    "record.contrib": "контрибуций · за 12 мес",
    "record.streak": "самый длинный стрик",
    "record.repos": "публичных репозиториев",
    "record.first": "первый коммит в хронике",
    "record.levels": [
      "без коммитов",
      "лёгкий день",
      "ровный день",
      "насыщенный день",
      "плотный день",
    ],
    "record.months": [
      "янв", "фев", "мар", "апр", "май", "июн",
      "июл", "авг", "сен", "окт", "ноя", "дек",
    ],
    "record.locale": "ru-RU",

    // projects
    "projects.folio": "Что я выпустил",
    "projects.open": "Открыть",
    "projects.code": "Код",
    "projects.visit": (name) => `${name} — открыть живой сайт`,

    // the path
    "path.folio": "Путь",
    "path.lead":
      "Ни буткемпа, ни курса CS. Пять лет выпускаю настоящее — вот запись, по порядку.",

    // the stack
    "stack.folio": "Стек",
    "stack.lead":
      "Ни один проект не учил тому же, что предыдущий. Инструменты просто копились.",

    // colophon
    "colo.folio": "Колофон",
    "colo.cta1": "Я ищу место, которое даст мне",
    "colo.cta2": " строить в полный размер.",
    "colo.note":
      "Набрано Fraunces и JetBrains Mono. Собрано вручную на React, three.js и GSAP.",

    // proof
    "proof.rev": (n) => `ред. ${n}`,
    "proof.line": (add, struck, last) =>
      ` — ${add} строк набрано, ${struck}. последняя правка ${last} `,
    "proof.struck": (n) => `${n} вычеркнуто`,
    "proof.none": "ничего не вычеркнуто",
    "proof.ed": "—ред.",
    "proof.src": "из git log · при сборке",
    "proof.printing": (ord) => `${ord} издание`,
    "proof.total": (first, add, del) =>
      ` с ${first} — ${add} строк набрано, ${del} вычеркнуто. `,

    // overture
    "issue.kicker": "Выпуск",
    "issue.skip": "тап / скролл — пропустить",

    // the tear
    "tear.tab.closed": "оторви",
    "tear.tab.open": "перепечатать",
    "tear.aria.closed": "Оторвать уголок страницы и показать исходный код раздела",
    "tear.aria.open": "Починить страницу и спрятать исходный код",
    "tear.caption": (filename) =>
      ` ${filename} — настоящий исходник, который печатает этот раздел. скрывать нечего.`,
  },
};

export function useT() {
  const { lang } = useLang();
  return (key, ...args) => {
    const v = STR[lang][key] ?? STR.en[key];
    return typeof v === "function" ? v(...args) : v;
  };
}
