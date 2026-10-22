import { Link, useLocation } from "react-router-dom";
import { labs } from "../labs/registry";
import { LearnMore } from "./LearnMore";
export function LessonEnd() {
 const {pathname}=useLocation();
 const lab=labs.find(l=>l.status==="ready" && pathname.startsWith(`/${l.id}`));
 const index=lab?.experiments.findIndex(e=>e.href===pathname || pathname===`/${lab.id}`) ?? -1;
 if(!lab || index<0) return null;
 const next=lab.experiments[index+1];
 return <><div className="next-mission"><div><p className="kicker">YOUR NEXT DISCOVERY</p><h2>{next ? next.title : lab.id==="brain" ? "Follow the heartbeat." : "Put a signal to work."}</h2><p>{next ? "Keep exploring at your own pace." : "Take what you learned into a new lab."}</p></div><Link className="btn primary" to={next?.href ?? (lab.id==="brain" ? "/heart/rate" : "/action")}>{next ? "Next mission" : "Explore next lab"} →</Link></div><LearnMore topic={lab.id as "brain"|"heart"}/></>;
}
