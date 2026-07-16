// In-memory store for session quizzes (fallback for RLS or offline persistence)
const sessionQuizzes = new Map();

/**
 * Save quiz in session cache
 * @param {string} quizId 
 * @param {{ quiz: any, questions: any[] }} quizData 
 */
function saveSessionQuiz(quizId, quizData) {
  if (!quizId) return;
  sessionQuizzes.set(quizId, quizData);
  console.log(`[QuizStore] Saved quiz ${quizId} in session cache.`);
}

/**
 * Retrieve quiz from session cache
 * @param {string} quizId 
 * @returns {{ quiz: any, questions: any[] } | undefined}
 */
function getSessionQuiz(quizId) {
  if (!quizId) return undefined;
  const data = sessionQuizzes.get(quizId);
  if (data) {
    console.log(`[QuizStore] Retrieved quiz ${quizId} from session cache.`);
  }
  return data;
}

module.exports = {
  saveSessionQuiz,
  getSessionQuiz
};
