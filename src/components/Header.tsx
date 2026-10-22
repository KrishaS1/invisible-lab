import { ScienceIcon } from "./ScienceIcon";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
const links = [["/", "Explore"], ["/brain/eyes", "Brain Lab"], ["/heart/rate", "Heart Lab"], ["/physics/interference", "Physics"], ["/earth/arrivals", "Earth"], ["/action", "Science in Action"], ["/learn", "Learn more"], ["/demo", "▷ Quick tour"]];
export function Header() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  return <header className="site-header"><NavLink to="/" className="wordmark" onClick={()=>setOpen(false)}><span className="brand-symbol" aria-hidden="true"><ScienceIcon kind="wave"/></span> invisible<span className="brand-light">lab</span><span className="brand-dot">.</span></NavLink><button type="button" className="menu-button btn" aria-controls="primary-navigation" aria-expanded={open} onClick={()=>setOpen(!open)}>{open ? "Close ✕" : "Menu ☰"}</button><nav id="primary-navigation" className={open ? "site-nav open" : "site-nav"} aria-label="Primary">{links.map(([href,label])=><NavLink key={href} to={href} end={href === "/"} className={({isActive})=>isActive || (href.startsWith("/brain") && pathname.startsWith("/brain")) || (href.startsWith("/heart") && pathname.startsWith("/heart")) ? "active" : ""} onClick={()=>setOpen(false)}>{label}</NavLink>)}</nav></header>;
}
