const { supabase, supabaseAdmin } = require('../config/supabase');
const { callGemini } = require('../services/gemini');

// GET ALL QUIZZES
exports.getQuizzes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subjectId, difficulty } = req.query;

    let query = supabase
      .from('quizzes')
      .select('*, subjects(name)')
      .eq('user_id', userId);

    if (subjectId) query = query.eq('subject_id', subjectId);
    if (difficulty) query = query.eq('difficulty', difficulty);

    const { data: quizzes, error } = await query.order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ quizzes });
  } catch (err) {
    next(err);
  }
};

// GET SINGLE QUIZ WITH QUESTIONS
exports.getQuizDetails = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Fetch quiz metadata
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .select('*, subjects(name)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Fetch questions
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', id);

    if (questionsError) {
      return res.status(400).json({ error: questionsError.message });
    }

    return res.status(200).json({
      quiz,
      questions
    });
  } catch (err) {
    next(err);
  }
};

// CREATE MANUALLY
exports.createQuiz = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, description, subjectId, difficulty, questions } = req.body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Title and questions are required' });
    }

    // Create quiz record
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        user_id: userId,
        title,
        description: description || '',
        subject_id: subjectId || null,
        difficulty: difficulty || 'medium'
      })
      .select()
      .single();

    if (quizError) return res.status(400).json({ error: quizError.message });

    // Format questions
    const questionsToInsert = questions.map(q => ({
      quiz_id: quiz.id,
      question_text: q.questionText,
      options: q.options,
      correct_option_index: q.correctOptionIndex,
      explanation: q.explanation || ''
    }));

    const { data: insertedQuestions, error: questionsError } = await supabaseAdmin
      .from('quiz_questions')
      .insert(questionsToInsert)
      .select();

    if (questionsError) {
      // Clean up quiz if question insertion fails
      await supabaseAdmin
        .from('quizzes')
        .delete()
        .eq('id', quiz.id);
      return res.status(400).json({ error: `Questions Insertion Failed: ${questionsError.message}` });
    }

    return res.status(201).json({
      message: 'Quiz created successfully',
      quiz,
      questions: insertedQuestions
    });
  } catch (err) {
    next(err);
  }
};

// ATTEMPT QUIZ & EVALUATE
exports.attemptQuiz = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // Quiz ID
    const { answers } = req.body; // JSON Object matching question_id to selected_index: { "q_uuid_1": 2, "q_uuid_2": 0 }

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Answers object is required' });
    }

    // Fetch quiz questions to check correct answers
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', id);

    if (questionsError || !questions || questions.length === 0) {
      return res.status(404).json({ error: 'Quiz questions not found' });
    }

    let score = 0;
    const totalQuestions = questions.length;
    const evaluationDetails = [];

    // Evaluate answers
    questions.forEach(q => {
      const userChoice = answers[q.id];
      const isCorrect = userChoice !== undefined && parseInt(userChoice) === q.correct_option_index;

      if (isCorrect) {
        score += 1;
      }

      evaluationDetails.push({
        questionId: q.id,
        questionText: q.question_text,
        userChoice: userChoice !== undefined ? parseInt(userChoice) : null,
        correctChoice: q.correct_option_index,
        isCorrect,
        explanation: q.explanation
      });
    });

    // Save attempt to database
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: userId,
        quiz_id: id,
        score,
        total_questions: totalQuestions,
        answers: answers
      })
      .select()
      .single();

    if (attemptError) {
      return res.status(400).json({ error: attemptError.message });
    }

    // Reward user with XP for completing quiz: 10 XP base + 10 XP per correct answer
    const earnedXp = 10 + (score * 10);
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, level')
      .eq('id', userId)
      .single();

    if (profile) {
      const currentXp = profile.xp + earnedXp;
      // Simple leveling logic: level up every 200 XP
      const newLevel = Math.floor(currentXp / 200) + 1;

      await supabase
        .from('profiles')
        .update({ xp: currentXp, level: newLevel, updated_at: new Date() })
        .eq('id', userId);
    }

    return res.status(201).json({
      message: 'Quiz attempt evaluated and recorded',
      attempt,
      score,
      totalQuestions,
      percentage: Math.round((score / totalQuestions) * 100),
      evaluationDetails,
      xpEarned: earnedXp
    });
  } catch (err) {
    next(err);
  }
};

// GET ATTEMPTS HISTORY
exports.getAttempts = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: attempts, error } = await supabase
      .from('quiz_attempts')
      .select('*, quizzes(title, difficulty, subjects(name))')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ attempts });
  } catch (err) {
    next(err);
  }
};

// GET LEADERBOARD
exports.getLeaderboard = async (req, res, next) => {
  try {
    // Return top 20 users ranked by XP, sharing full_name, level, and streak
    const { data: leaderboard, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, level, xp, study_streak')
      .order('xp', { ascending: false })
      .limit(20);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ leaderboard });
  } catch (err) {
    next(err);
  }
};
