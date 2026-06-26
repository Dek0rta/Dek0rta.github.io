import { nowPlaying } from "../data";
import "./NowPlaying.css";

export default function NowPlaying() {
  const { track, artist, album, cover, progress, isPlaying } = nowPlaying;
  const pct = Math.round(progress * 100);
  const bars = [0.6, 0.85, 0.45, 1, 0.55, 0.8, 0.4];

  return (
    <section id="now" className="np-section">
      <div className="wrap">
        <p className="eyebrow" data-reveal>Now Playing</p>

        <div className="np-card panel" data-reveal data-cursor>
          <div className="np-cover">
            {cover ? (
              <img src={cover} alt={`${album} cover`} />
            ) : (
              <div className="np-cover-mesh" aria-hidden="true" />
            )}
          </div>

          <div className="np-body">
            <div className="np-head">
              <span className="np-pill" data-cursor>
                <span className="np-pill-dot" /> live soon
              </span>
            </div>

            <h3 className="np-track">{track}</h3>
            <p className="np-meta">
              <span className="np-artist">{artist}</span>
              <span className="np-sep">·</span>
              <span className="np-album">{album}</span>
            </p>

            <div className={`np-eq ${isPlaying ? "is-playing" : ""}`} aria-hidden="true">
              {bars.map((h, i) => (
                <span key={i} style={{ "--h": h, "--i": i }} />
              ))}
            </div>

            <div className="np-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="np-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
