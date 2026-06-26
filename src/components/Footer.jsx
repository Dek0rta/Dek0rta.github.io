import { profile } from "../data";
import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <span className="footer-handle">@{profile.handle}</span>
        <span className="footer-built">built with three.js + gsap</span>
        <span className="footer-year">© {year}</span>
      </div>
    </footer>
  );
}
