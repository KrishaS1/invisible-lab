import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { labs } from "../labs/registry";
import { quizFor } from "../progress/progress";
export function LessonGuide() {
  const { pathname } = useLocation();
  const [, refresh] = useState(0);
  useEffect(()=>{
    const update = () => refresh(value => value + 1);
    window.addEventListener("lab-progress", update);
    return () => window.removeEventListener("lab-progress", update);
  }, []);
  useEffect(()=>{ window.scrollTo(0,0); },[pathname]);
  const lab = labs.find(l=>l.status === "ready" && pathname.startsWith(`/${l.id}`));
  const index = lab?.experiments.findIndex(e=>e.href === pathname || pathname === `/${lab.id}`) ?? -1;
  if (!lab || index < 0 || !["brain", "heart"].includes(lab.id)) return null;
  const lesson = lab.experiments[index];
  const progressId = (id: string) => lab.id === "heart" ? `heart-${id}` : id;
  return <div className={`lesson-guide guide-${lab.id}`}><div><Link to="/">Exploration deck</Link><span> / {lab.name}</span></div><div className="lesson-guide-main"><span className="mission-tag">MISSION {String(index + 1).padStart(2,"0")} / {String(lab.experiments.length).padStart(2,"0")}</span><span>{quizFor(progressId(lesson.id)) ? "✓ Knowledge check explored" : "Predict → Experiment → Observe → Explain"}</span></div><div className="lesson-dots" aria-label={`Lesson ${index+1} of ${lab.experiments.length}`}>{lab.experiments.map((e,i)=><Link key={e.id} to={e.href} title={e.title} aria-label={e.title} aria-current={i===index ? "step" : undefined} className={i===index ? "current" : quizFor(progressId(e.id)) ? "done" : ""} />)}</div></div>;
}
