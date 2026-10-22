import { glossary } from "../content/glossary";

export function GlossaryPage() {
  return (
    <div className="page narrow">
      <h1>Glossary</h1>
      <p className="lede">Short definitions for the words the lessons use. Hovering a dotted word in a lesson shows the short form.</p>
      <dl className="glossary">
        {glossary.map((entry) => (
          <div key={entry.id}>
            <dt>{entry.term}</dt>
            <dd>{entry.long}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
