import { useState } from "react";
import { quizFor, saveQuiz } from "../progress/progress";
export function Quiz({ lessonId, prompt, options, answer, explanation }: { lessonId: string; prompt: string; options: {id:string;label:string}[]; answer:string; explanation:string; }) {
 const saved=quizFor(lessonId);
 const [choice,setChoice]=useState<string|null>(saved?.choice ?? null);
 function submit(id:string) {setChoice(id);saveQuiz(lessonId,{choice:id,correct:id===answer});}
 return <fieldset className="quiz"><legend>Test your discovery</legend><p>{prompt}</p><div className="choice-row">{options.map(o=><button key={o.id} type="button" className={choice===o.id ? "btn selected" : "btn"} aria-pressed={choice===o.id} onClick={()=>submit(o.id)}>{o.label}</button>)}</div>{choice && <p role="status" className={choice===answer ? "result-note good" : "result-note"}>{choice===answer ? "You’ve got it! " : "Not quite. "}{explanation}</p>}</fieldset>;
}
