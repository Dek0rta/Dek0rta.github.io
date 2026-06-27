import { useEffect, useState } from "react";
import { profile } from "../data";
import "./Topbar.css";

export default function Topbar() {
  const [theme, setTheme] = useState("day");

  useEffect(() => {
    const saved = localStorage.getItem("issue-theme") || "day";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggle = () => {
    const next = theme === "day" ? "night" : "day";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("issue-theme", next);
  };

  return (
    <header className="topbar">
      <div className="topbar__inner wrap">
        <a href="#cover" className="topbar__name" data-cursor>
          {profile.name}
        </a>

        <div className="topbar__right">
          <span className="topbar__vol">
            {profile.volume} <span className="topbar__sep">·</span> {profile.year}
          </span>
          <button
            className="topbar__toggle"
            onClick={toggle}
            data-cursor
            aria-label={`Switch to ${theme === "day" ? "night" : "day"} mode`}
          >
            <span className={theme === "day" ? "is-on" : ""}>Day</span>
            <span className="topbar__slash">/</span>
            <span className={theme === "night" ? "is-on" : ""}>Night</span>
          </button>
        </div>
      </div>
    </header>
  );
}
