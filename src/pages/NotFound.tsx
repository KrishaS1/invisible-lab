import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="page narrow">
      <h1>That page is not in the lab</h1>
      <Link to="/">Back to the contents</Link>
    </div>
  );
}
