import { Link } from "react-router-dom";
import { learningResources, type ResourceTopic } from "../content/resources";
export function LearnMore({topic}:{topic:ResourceTopic}) {
 const resources = learningResources.filter(r=>r.topic===topic).slice(0,2);
 return <section className="learn-more"><div className="section-heading"><div><p className="kicker">KEEP THE CURIOSITY GOING</p><h2>Go beyond the experiment.</h2></div><Link to={`/learn?topic=${topic}`}>All resources →</Link></div><div className="resource-grid">{resources.map(r=><a key={r.id} className="resource-card" href={r.url} target="_blank" rel="noopener noreferrer"><span className="resource-type">{r.kind} · {r.level}</span><h3>{r.title} <span aria-hidden="true">↗</span></h3><p>{r.description}</p><small>{r.publisher} · Opens a new tab</small></a>)}</div></section>;
}
