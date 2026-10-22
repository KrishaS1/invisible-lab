import { useState } from "react";
import { predictionFor, savePrediction } from "../progress/progress";

export function Prediction({
  lessonId,
  prompt,
  options,
  onChoose,
}: {
  lessonId: string;
  prompt: string;
  options: { id: string; label: string }[];
  onChoose?: (id: string) => void;
}) {
  const [choice, setChoice] = useState<string | null>(() => predictionFor(lessonId));

  function choose(id: string) {
    setChoice(id);
    savePrediction(lessonId, id);
    onChoose?.(id);
  }

  return (
    <fieldset className="prediction">
      <legend>{prompt}</legend>
      <div className="choice-row">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={choice === option.id ? "btn selected" : "btn"}
            aria-pressed={choice === option.id}
            onClick={() => choose(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {choice ? <p className="quiet">Saved in this browser. You can change it.</p> : <p className="quiet">Pick one before you read the result. There is no penalty for a miss.</p>}
    </fieldset>
  );
}
