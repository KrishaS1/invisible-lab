import { LessonEnd } from "../components/LessonEnd";
import { NavLink, Outlet } from "react-router-dom";

const links = [
  ["/heart/rate", "1 · Heart rate"],
  ["/heart/beat", "2 · One beat"],
  ["/heart/listen", "3 · Listen"],
];

export function HeartLayout() {
  return (
    <div className="lab-shell">
      <nav className="lab-nav" aria-label="Heart lab">
        <p className="kicker kicker-ecg">Heart lab</p>
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
