import "../components/ScienceMap.css";
import { ScienceIcon } from "../components/ScienceIcon";
import { Link } from "react-router-dom";
import { labs } from "../labs/registry";
import { progressCounts, quizFor } from "../progress/progress";

const missions = [
  { id: "eyes", number: "01", type: "brain", name: "Brain Lab", title: "Eyes closed. Brain on?", text: "Predict what changes when your eyes close. Put your guess to the test with real brain recordings.", detail: "5 experiments · Start with a prediction", href: "/brain/eyes", icon: "brain" },
  { id: "heart-rate", number: "02", type: "heart", name: "Heart Lab", title: "Crack the heartbeat code.", text: "Spot the spikes. Measure the gap. Work out how fast a real heart is beating.", detail: "3 experiments · Try a calculation", href: "/heart/rate", icon: "heart" },
  { id: "blink-limit", number: "03", type: "action", name: "Science in Action", title: "One switch. Big possibilities.", text: "Try a scanning communication board and explore how signals can help someone control a computer.", detail: "Manual demo · No headset needed", href: "/action", icon: "action" },
];

export function HomePage() {
  const counts = progressCounts();
  return <div className="page home-page">
    <section className="hero">
      <div className="hero-copy">
        <p className="kicker"><span className="status-dot" /> YOUR CURIOSITY IS THE ONLY EQUIPMENT YOU NEED</p>
        <h1>Big discoveries.<br /><span>Invisible signals.</span></h1>
        <p className="hero-description">From brain signals to sound and earthquakes,<br />turn the science you can’t see into discoveries you can make.</p>
        <div className="choice-row"><Link className="btn primary" to="/brain/eyes">Start your first mission <span aria-hidden="true">→</span></Link><Link className="btn" to="/demo">▷ Take the 3-minute tour</Link></div>
        <p className="hero-trust">Real recordings <span>·</span> Free to explore <span>·</span> No headset required</p>
      </div>
      <div className="science-map" role="img" aria-label="Explore invisible science: Brain, Heart, Sound, Earth, and Technology. Decorative subject map, not recorded data.">
        <svg className="science-connections" viewBox="0 0 480 400" aria-hidden="true"><ellipse cx="240" cy="200" rx="180" ry="145"/><path d="M86 80 240 200 394 80M422 232 240 200 240 352M58 232 240 200"/><circle cx="240" cy="200" r="88"/></svg>
        <div className="science-map-core"><span>EXPLORE</span><strong>Invisible<br />science.</strong><small>Five ways in.</small></div>
        {([['brain','BRAIN','brain'],['heart','HEART','heart'],['sound','SOUND','wave'],['earth','EARTH','earth'],['technology','TECHNOLOGY','action']] as const).map(([id,label,icon])=><div className={`science-node science-node-${id}`} key={id}><ScienceIcon kind={icon}/><span>{label}</span></div>)}
      </div>
    </section>
    <section className="discovery-strip" aria-label="Your progress"><div><span className="strip-icon"><ScienceIcon kind="wave"/></span><span><strong>{counts.answered ? `${counts.answered} knowledge checks explored` : "Your next discovery starts here"}</strong><small>{counts.answered ? `${counts.correct} correct · Progress saved on this browser` : "Make a prediction. Try it out. See what the data says."}</small></span></div><a href="#missions">Choose a mission ↓</a></section>
    <section id="missions"><div className="section-heading"><div><p className="kicker">THE EXPLORATION DECK</p><h2>What will you discover today?</h2></div><span className="quiet">3 ways to get hands-on</span></div>
      <div className="mission-grid">{missions.map(m => <Link className={`mission-card mission-${m.type}`} to={m.href} key={m.id}><div className="mission-top"><span className="mission-icon" aria-hidden="true"><ScienceIcon kind={m.icon as "brain"|"heart"|"action"}/></span><span className="mission-tag">{quizFor(m.id) ? "CHECK EXPLORED ✓" : m.number === "01" ? "START HERE" : `MISSION ${m.number}`}</span></div><p className="kicker">{m.name}</p><h3>{m.title}</h3><p>{m.text}</p><small>{m.detail}</small><span className="mission-launch">{quizFor(m.id) ? "Explore again" : "Launch mission"} <span aria-hidden="true">→</span></span></Link>)}</div>
    </section>
    <section className="new-worlds"><div className="section-heading"><div><p className="kicker">NEW WORLDS TO EXPLORE</p><h2>From sound waves to seismic waves.</h2></div><span className="quiet">Two new guided experiments</span></div><div className="new-world-grid"><Link to="/physics/interference" className="mission-card mission-physics"><div className="mission-top"><span className="mission-icon"><ScienceIcon kind="wave"/></span><span className="mission-tag">SIMULATION</span></div><p className="kicker">Physics Lab</p><h3>Can two sounds make silence?</h3><p>Slide one wave out of step. See and hear why two tones can cancel.</p><small>Interactive model · Sound optional</small><span className="mission-launch">Open Physics Lab <span>→</span></span></Link><Link to="/earth/arrivals" className="mission-card mission-earth"><div className="mission-top"><span className="mission-icon"><ScienceIcon kind="earth"/></span><span className="mission-tag">REAL RECORDINGS</span></div><p className="kicker">Earth Lab</p><h3>One quake. Which wave wins?</h3><p>Explore real seismograms. Mark the arrivals, then compare with published P- and S-wave labels.</p><small>2 STEAD recordings · No equipment required</small><span className="mission-launch">Open Earth Lab <span>→</span></span></Link></div></section>
    <section className="journey"><div><p className="kicker">THINK LIKE A SCIENTIST</p><h2>Start with<br />“what if?”</h2></div><ol>{[["01", "Predict", "Make your best guess."], ["02", "Experiment", "Explore a real recording."], ["03", "Observe", "See what actually changed."], ["04", "Explain", "Connect the dots."]].map(([n,t,d]) => <li key={n}><span>{n}</span><strong>{t}</strong><p>{d}</p></li>)}</ol></section>
    <section><div className="section-heading"><div><p className="kicker">THE NEXT FRONTIER</p><h2>More worlds to unlock.</h2></div><span className="quiet">Future labs · Not yet available</span></div><div className="future-grid">{labs.filter(l=>l.status === "soon").map(l=><Link key={l.id} to={l.href}><span className={`dot accent-${l.accent}`} /><strong>{l.name}</strong><small>{l.category} · Coming soon</small></Link>)}</div></section>
    <div className="resource-banner"><div><p className="kicker">FEED YOUR CURIOSITY</p><h2>One question leads to another.</h2><p>Go behind the signals with trusted reads, a video, and the original datasets.</p></div><Link className="btn" to="/learn">Explore the knowledge base →</Link></div>
    <div className="home-bottom"><span>Have your own OpenBCI recording?</span><Link to="/brain/upload">Explore your data →</Link><Link to="/measure">How do we measure these signals?</Link></div>
  </div>;
}
