import { useEffect, useState } from "react";
import { profile } from "../data";
import { burnTheme } from "../burn";
import { useLang, usePick, useT } from "../i18n.jsx";
import "./Topbar.css";

export default function Topbar() {
  const [theme, setTheme] = useState("day");
  const { lang, setLang } = useLang();
  const pick = usePick();
  const t = useT();

  useEffect(() => {
    const saved = localStorage.getItem("issue-theme") || "day";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggle = (e) => {
    const next = theme === "day" ? "night" : "day";
    const flip = () => {
      setTheme(next);
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("issue-theme", next);
    };
    // the switch is a match — the fire starts where you struck it
    const r = e.currentTarget.getBoundingClientRect();
    burnTheme(r.left + r.width / 2, r.top + r.height / 2, flip);
  };

  return (
    <header className="topbar">
      <div className="topbar__inner wrap">
        <a href="#cover" className="topbar__name" data-cursor>
          {pick(profile.name)}
        </a>

        <div className="topbar__right">
          <span className="topbar__vol">
            {profile.volume} <span className="topbar__sep">·</span> {profile.year}
          </span>
          <button
            className="topbar__toggle"
            onClick={() => setLang(lang === "en" ? "ru" : "en")}
            data-cursor
            aria-label={t("topbar.lang")}
          >
            <span className={lang === "en" ? "is-on" : ""}>EN</span>
            <span className="topbar__slash">/</span>
            <span className={lang === "ru" ? "is-on" : ""}>RU</span>
          </button>
          <button
            className="topbar__toggle"
            onClick={toggle}
            data-cursor
            aria-label={t("topbar.theme", theme === "day" ? "night" : "day")}
          >
            <span className={theme === "day" ? "is-on" : ""}>{t("topbar.day")}</span>
            <span className="topbar__slash">/</span>
            <span className={theme === "night" ? "is-on" : ""}>{t("topbar.night")}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
