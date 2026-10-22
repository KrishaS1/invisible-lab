import { Link, Navigate, useParams } from "react-router-dom";
import { labById } from "../labs/registry";

export function SoonPage() {
  const { labId } = useParams();
  const lab = labId ? labById(labId) : undefined;
  if (lab?.status === "ready") return <Navigate to={lab.href} replace />;
  if (!lab || lab.status !== "soon") {
    return (
      <div className="page narrow">
        <h1>That lab is not on the list</h1>
        <Link to="/">Back to the contents</Link>
      </div>
    );
  }
  return (
    <div className="page narrow">
      <p className={`kicker kicker-${lab.accent}`}>{lab.category}</p>
      <h1>{lab.name} is not built</h1>
      <p>{lab.later}</p>
      <p>There is no chart on this page, and there is no sample data pretending to be a recording.</p>
      <Link className="btn" to="/">Back to the contents</Link>
    </div>
  );
}
