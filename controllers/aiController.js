const { supabase, supabaseAdmin } = require('../config/supabase');
const { callGemini } = require('../services/gemini');
const { saveSessionQuiz } = require('../services/quizStore');

// Helper to track AI history
const trackAiUsage = async (userId, type, prompt, response) => {
  try {
    await supabaseAdmin.from('ai_history').insert({
      user_id: userId,
      feature_type: type,
      prompt: prompt.substring(0, 1000), // Cap to prevent massive column inserts
      response: response.substring(0, 5000)
    });
  } catch (err) {
    console.error('Failed to log AI History:', err.message);
  }
};

// 1. SUMMARIZE NOTES
exports.summarizeNotes = async (req, res, next) => {
  try {
    const { text, length } = req.body; // length: 'short', 'medium', 'long'
    if (!text) return res.status(400).json({ error: 'Text content is required' });

    const systemInstruction = `You are an expert summarizer. Compress the provided textbook text or notes into a structured, highly legible markdown summary. Style: ${length || 'medium'}. Use bold headers, clean bullet points, and highlight key terms.`;
    const summary = await callGemini(text, systemInstruction);

    await trackAiUsage(req.user.id, 'summarize', text, summary);
    return res.status(200).json({ summary });
  } catch (err) {
    return res.status(503).json({
      error: err.message || "AI service is temporarily unavailable."
    });
  }
};

// 2. EXPLAIN TOPIC
exports.explainTopic = async (req, res, next) => {
  try {
    const { topic, level } = req.body; // level: 'beginner', 'intermediate', 'advanced'
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const systemInstruction = `You are a world-class educational tutor. Explain the following topic at a level suitable for an ${level || 'intermediate'} student. Include a summary definition, a real-world analogy, 3 core concepts, and a quick self-test question at the end. Format in clean markdown.`;
    const explanation = await callGemini(topic, systemInstruction);

    await trackAiUsage(req.user.id, 'explain', topic, explanation);
    return res.status(200).json({ explanation });
  } catch (err) {
    next(err);
  }
};

// 3. GENERATE QUIZ
exports.generateQuiz = async (req, res, next) => {
  try {
    const { topic, questionCount, difficulty } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic or notes content is required' });

    const systemInstruction = `You are an AI exam generator. Create a multiple choice quiz based on the user's input.
Return a raw JSON array of objects. Do not include markdown codeblock tags.
Format of each question object:
{
  "question_text": "Question goes here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_option_index": 0,
  "explanation": "Brief explanation of why Option A is correct."
}`;
    const prompt = `Generate a ${difficulty || 'medium'} difficulty quiz with ${questionCount || 5} questions about the following topic/notes: "${topic}"`;
    const responseJson = await callGemini(prompt, systemInstruction, true);

    let questions;
    try {
      questions = JSON.parse(responseJson);
    } catch (e) {
      // If parsing fails, fall back to parsing out code blocks
      const cleanJson = responseJson.replace(/```json/g, '').replace(/```/g, '').trim();
      questions = JSON.parse(cleanJson);
    }

    await trackAiUsage(req.user.id, 'generate_quiz', topic, responseJson);

    // Persist questions in session cache with a temporary UUID
    const crypto = require('crypto');
    const tempQuizId = crypto.randomUUID ? crypto.randomUUID() : 'temp-generated-quiz-id';
    
    // Assign temp UUIDs to questions for in-memory persistence
    const questionsWithIds = questions.map((q, idx) => ({
      id: q.id || (crypto.randomUUID ? crypto.randomUUID() : `temp-q-id-${idx}`),
      quiz_id: tempQuizId,
      question_text: q.question_text,
      options: q.options,
      correct_option_index: q.correct_option_index,
      explanation: q.explanation || ''
    }));

    saveSessionQuiz(tempQuizId, {
      quiz: {
        id: tempQuizId,
        user_id: req.user.id,
        title: topic,
        difficulty: difficulty || 'medium',
        created_at: new Date().toISOString()
      },
      questions: questionsWithIds
    });

    return res.status(200).json({ questions: questionsWithIds });
  } catch (err) {
    next(err);
  }
};

// 4. GENERATE FLASHCARDS
exports.generateFlashcards = async (req, res, next) => {
  try {
    const { topic, cardCount } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic or content is required' });

    const systemInstruction = `You are an AI flashcard deck builder. Generate key study flashcards based on the user's topic or notes.
Return a raw JSON array of objects. Do not include markdown codeblock tags.
Format:
[
  { "front": "Question/Term", "back": "Short answer/Definition" }
]`;
    const prompt = `Generate ${cardCount || 8} flashcards for: "${topic}"`;
    const responseJson = await callGemini(prompt, systemInstruction, true);

    let flashcards;
    try {
      flashcards = JSON.parse(responseJson);
    } catch (e) {
      const cleanJson = responseJson.replace(/```json/g, '').replace(/```/g, '').trim();
      flashcards = JSON.parse(cleanJson);
    }

    await trackAiUsage(req.user.id, 'generate_flashcards', topic, responseJson);
    return res.status(200).json({ flashcards });
  } catch (err) {
    next(err);
  }
};

// 5. GENERATE STUDY NOTES
exports.generateStudyNotes = async (req, res, next) => {
  try {
    const { topic, depth } = req.body; // depth: 'standard', 'deep dive'
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const systemInstruction = `You are a master academic note-taker. Generate structured, thorough, and highly organized study notes for the given topic. Use clear heading hierarchies, bullet lists, bold text, quick takeaways, and illustrative examples. Mode: ${depth || 'standard'}.`;
    const studyNotes = await callGemini(topic, systemInstruction);

    await trackAiUsage(req.user.id, 'study_notes', topic, studyNotes);
    return res.status(200).json({ studyNotes });
  } catch (err) {
    next(err);
  }
};

// 6. HOMEWORK SOLVER
exports.homeworkSolver = async (req, res, next) => {
  try {
    const { problem, subject } = req.body;
    if (!problem) return res.status(400).json({ error: 'Problem statement is required' });

    const systemInstruction = `You are an expert Homework Solver. Solve the student's problem step-by-step.
Format in markdown:
- **Problem Summary**: Clarify the question.
- **Formulas/Concepts Used**: Outline parameters.
- **Step-by-Step Working**: Detail the process.
- **Final Answer**: Clearly state the solution boxed or bolded.
- **Key Takeaway**: Short advice on similar questions.
Subject context: ${subject || 'general'}`;

    const solution = await callGemini(problem, systemInstruction);

    await trackAiUsage(req.user.id, 'homework_solver', problem, solution);
    return res.status(200).json({ solution });
  } catch (err) {
    next(err);
  }
};

// 7. DOUBT SOLVER
exports.doubtSolver = async (req, res, next) => {
  try {
    const { doubt, context } = req.body;
    if (!doubt) return res.status(400).json({ error: 'Doubt statement is required' });

    const systemInstruction = `You are an academic Doubt Solver. Resolve the student's specific doubt. If context notes are provided, refer to them. Explain why the student might have gotten confused and provide absolute clarity.`;
    const prompt = `Doubt: ${doubt}\nContext: ${context || 'None'}`;
    const resolution = await callGemini(prompt, systemInstruction);

    await trackAiUsage(req.user.id, 'doubt_solver', prompt, resolution);
    return res.status(200).json({ resolution });
  } catch (err) {
    next(err);
  }
};

// 8. ROADMAP GENERATOR
exports.roadmapGenerator = async (req, res, next) => {
  try {
    const { goal, timeframeWeeks } = req.body;
    if (!goal) return res.status(400).json({ error: 'Goal description is required' });

    const systemInstruction = `You are an expert curriculum developer. Generate a sequential learning roadmap to achieve a study goal.
Return a raw JSON object. Do not include markdown codeblock tags.
Format:
{
  "title": "Roadmap Title",
  "description": "Short explanation",
  "steps": [
    { "phase": "Week 1: Core Fundamentals", "topics": ["Topic A", "Topic B", "Practice C"] }
  ]
}`;
    const prompt = `Create a learning roadmap to master "${goal}" over a period of ${timeframeWeeks || 4} weeks.`;
    const responseJson = await callGemini(prompt, systemInstruction, true);

    let roadmap;
    try {
      roadmap = JSON.parse(responseJson);
    } catch (e) {
      const cleanJson = responseJson.replace(/```json/g, '').replace(/```/g, '').trim();
      roadmap = JSON.parse(cleanJson);
    }

    await trackAiUsage(req.user.id, 'roadmap', prompt, responseJson);
    return res.status(200).json({ roadmap });
  } catch (err) {
    next(err);
  }
};

// 9. STUDY PLANNER GENERATOR
exports.plannerGenerator = async (req, res, next) => {
  try {
    const { focusArea, studyHoursPerDay } = req.body;
    if (!focusArea) return res.status(400).json({ error: 'Focus area is required' });

    const systemInstruction = `You are an expert study planner. Create a daily schedule of action items based on the user's available time and goals.
Return a raw JSON array of task objects. Do not include markdown codeblock tags.
Format:
[
  { "title": "Read Chapter 1", "description": "Focus on main headers and bolded definitions.", "duration_minutes": 45, "priority": "high" }
]`;
    const prompt = `Create a daily task plan to study "${focusArea}" allocation: ${studyHoursPerDay || 2} hours.`;
    const responseJson = await callGemini(prompt, systemInstruction, true);

    let plannerTasks;
    try {
      plannerTasks = JSON.parse(responseJson);
    } catch (e) {
      const cleanJson = responseJson.replace(/```json/g, '').replace(/```/g, '').trim();
      plannerTasks = JSON.parse(cleanJson);
    }

    await trackAiUsage(req.user.id, 'planner_gen', prompt, responseJson);
    return res.status(200).json({ plannerTasks });
  } catch (err) {
    next(err);
  }
};

// 10. ESSAY GENERATOR
exports.essayGenerator = async (req, res, next) => {
  try {
    const { promptText, tone, lengthWords } = req.body;
    if (!promptText) return res.status(400).json({ error: 'Essay topic/prompt is required' });

    const systemInstruction = `You are an academic essay generator. Produce a structured essay response based on the topic. Tone: ${tone || 'academic'}. Target length: ${lengthWords || 500} words. Include an Introduction, Body paragraphs with structured arguments, and a Conclusion.`;
    const essay = await callGemini(promptText, systemInstruction);

    await trackAiUsage(req.user.id, 'essay', promptText, essay);
    return res.status(200).json({ essay });
  } catch (err) {
    next(err);
  }
};

// 11. GRAMMAR CHECKER
exports.grammarChecker = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text content is required' });

    const systemInstruction = `You are a professional editor. Analyze the following text for grammar, punctuation, vocabulary styling, and flow.
Provide:
1. **Corrected Version**: The complete text with errors resolved.
2. **Corrections Log**: List specific mistakes and why they were changed.
3. **Writing Score**: Assign a score from 1-10 with standard feedback.`;

    const feedback = await callGemini(text, systemInstruction);

    await trackAiUsage(req.user.id, 'grammar', text, feedback);
    return res.status(200).json({ feedback });
  } catch (err) {
    next(err);
  }
};

// 12. CODE EXPLANATION
exports.codeExplanation = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: 'Code content is required' });

    const systemInstruction = `You are an senior software engineer. Explain this code snippet in language context: ${language || 'any'}.
Break down:
1. **High-Level Purpose**: What does this function do?
2. **Line-by-Line Breakdown**: Explain the mechanisms.
3. **Time/Space Complexity**: Big O analysis.
4. **Optimization Tips**: Suggestions for improving standard execution.`;

    const explanation = await callGemini(code, systemInstruction);

    await trackAiUsage(req.user.id, 'code_explain', code, explanation);
    return res.status(200).json({ explanation });
  } catch (err) {
    next(err);
  }
};

// 13. CODING ASSISTANT
exports.codingAssistant = async (req, res, next) => {
  try {
    const { prompt, language, currentCode } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Coding prompt/instruction is required' });

    const systemInstruction = `You are an AI coding pair programmer. Help the student write, debug, or refactor code.
Provide the corrected or completed code inside a standard markdown codeblock with language: ${language || 'javascript'}. After the code block, explain what changes were made.`;

    const fullPrompt = `Instruction: ${prompt}\nLanguage: ${language || 'general'}\n${currentCode ? `Current Code:\n${currentCode}` : ''}`;
    const assistance = await callGemini(fullPrompt, systemInstruction);

    await trackAiUsage(req.user.id, 'coding_assistant', fullPrompt, assistance);
    return res.status(200).json({ assistance });
  } catch (err) {
    next(err);
  }
};

// GET AI HISTORY LOG
exports.getHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { data: history, error } = await supabase
      .from('ai_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ history });
  } catch (err) {
    next(err);
  }
};

exports.examPredictor = async (req, res) => {
  try {
    const { subject, syllabus } = req.body;

    if (!subject) {
      return res.status(400).json({
        error: "Subject is required"
      });
    }

    const prompt = `
Subject: ${subject}

Syllabus:
${syllabus || "Not provided"}

Predict the 10 most important exam questions.
Rank them from highest to lowest probability.
Explain why each question is important.
Return the result in markdown.
`;

    const result = await callGemini(
      prompt,
      "You are an experienced university professor and exam paper setter."
    );

    res.json({
      prediction: result
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};
