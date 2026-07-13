import { stack } from "../data";
import { usePick, useT } from "../i18n.jsx";
import { ProofMark } from "./Proof";
import "./Stack.css";

export default function Stack() {
  const pick = usePick();
  const t = useT();
  return (
    <section className="section stack" id="stack">
      <div className="wrap">
        <div className="folio" data-reveal>
          <span className="folio__no">04</span>
          <span className="folio__rule" />
          <span className="folio__label">{t("stack.folio")}</span>
          <ProofMark k="stack" />
        </div>

        <p className="stack__lead display" data-reveal>
          {t("stack.lead")}
        </p>

        <ul className="stack__list">
          {stack.map((s) => (
            <li className="stack__row" key={s.name} data-reveal>
              <span className="stack__name">{s.name}</span>
              <span className="stack__note">{pick(s.note)}</span>
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
