import { stack } from "../data";
import "./Stack.css";

export default function Stack() {
  return (
    <section className="section stack" id="stack">
      <div className="wrap">
        <div className="folio" data-reveal>
          <span className="folio__no">02</span>
          <span className="folio__rule" />
          <span className="folio__label">The stack</span>
        </div>

        <p className="stack__lead display" data-reveal>
          No two projects taught me the same thing. The tools just kept stacking up.
        </p>

        <ul className="stack__list">
          {stack.map((s) => (
            <li className="stack__row" key={s.name} data-reveal>
              <span className="stack__name">{s.name}</span>
              <span className="stack__note">{s.note}</span>
              <span className="stack__bar" aria-hidden="true">
                <span className="stack__fill" style={{ "--lvl": `${s.level}%` }} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
