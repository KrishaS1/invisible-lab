import { LessonEnd } from "../components/LessonEnd";
import { NavLink, Outlet } from "react-router-dom";

const links = [
  ["/brain/eyes", "1 · Eyes"],
  ["/brain/bands", "2 · Brain waves"],
  ["/brain/movement", "3 · Movement"],
  ["/brain/artifacts", "4 · Noise"],
  ["/brain/listen", "5 · Listen"],
  ["/brain/upload", "Your file"],
  ["/brain/live", "Live headset"],
];

export function BrainLayout() {
  return (
    <div className="lab-shell">
      <nav className="lab-nav" aria-label="Brain lab">
        <p className="kicker kicker-eeg">Brain lab</p>
        <p className="quiet">Your mission map</p>
        {links.map(([href, label]) => (
          <NavLink key={href} to={href} className={({ isActive }) => (isActive ? "lab-link active" : "lab-link")}>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="lab-main">
        <Outlet />
        <LessonEnd />
      </div>
    </div>
  );
}
