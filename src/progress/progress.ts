const KEY = "invisible-lab.progress.v1";

export type QuizResult = {
  choice: string;
  correct: boolean;
};

type Progress = {
  predictions: Record<string, string>;
  quizzes: Record<string, QuizResult>;
};

const empty: Progress = { predictions: {}, quizzes: {} };

function read(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...empty, predictions: {}, quizzes: {} };
    const parsed = JSON.parse(raw) as Progress;
    return {
      predictions: parsed.predictions ?? {},
      quizzes: parsed.quizzes ?? {},
    };
  } catch {
    return { predictions: {}, quizzes: {} };
  }
}

function write(progress: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
    window.dispatchEvent(new Event("lab-progress"));
  } catch {
    // Lessons still work when this browser blocks local storage.
  }
}

export function savePrediction(lessonId: string, choice: string) {
  const progress = read();
  progress.predictions[lessonId] = choice;
  write(progress);
}

export function predictionFor(lessonId: string): string | null {
  return read().predictions[lessonId] ?? null;
}

export function saveQuiz(lessonId: string, result: QuizResult) {
  const progress = read();
  progress.quizzes[lessonId] = result;
  write(progress);
}

export function quizFor(lessonId: string): QuizResult | null {
  return read().quizzes[lessonId] ?? null;
}

export function progressCounts(): { answered: number; correct: number } {
  const quizzes = Object.values(read().quizzes);
  return {
    answered: quizzes.length,
    correct: quizzes.filter((quiz) => quiz.correct).length,
  };
}
