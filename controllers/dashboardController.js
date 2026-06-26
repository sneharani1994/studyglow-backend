const { supabase } = require('../config/supabase');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Fetch user profile (includes streak, XP, level, study hours)
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileErr) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // 2. Fetch recent notes (limit 5)
    const { data: recentNotes } = await supabase
      .from('notes')
      .select('id, title, updated_at, subject_id, subjects(name, color)')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(5);

    // 3. Fetch recent chats (limit 5)
    const { data: recentChats } = await supabase
      .from('chat_sessions')
      .select('id, title, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(5);

    // 4. Fetch planner task statistics
    const { data: plannerTasks } = await supabase
      .from('planner_tasks')
      .select('status, due_date')
      .eq('user_id', userId);

    let totalTasks = 0;
    let completedTasks = 0;
    let pendingTasks = 0;

    if (plannerTasks) {
      totalTasks = plannerTasks.length;
      completedTasks = plannerTasks.filter(t => t.status === 'completed').length;
      pendingTasks = totalTasks - completedTasks;
    }

    // 5. Fetch flashcards count
    const { count: flashcardsCount } = await supabase
      .from('flashcards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 6. Fetch quiz statistics
    const { data: quizAttempts } = await supabase
      .from('quiz_attempts')
      .select('score, total_questions')
      .eq('user_id', userId);

    let totalQuizAttempts = 0;
    let averageQuizScore = 0;

    if (quizAttempts && quizAttempts.length > 0) {
      totalQuizAttempts = quizAttempts.length;
      const totalScorePercent = quizAttempts.reduce((acc, curr) => {
        const percent = curr.total_questions > 0 ? (curr.score / curr.total_questions) * 100 : 0;
        return acc + percent;
      }, 0);
      averageQuizScore = Math.round(totalScorePercent / totalQuizAttempts);
    }

    // 7. Fetch AI Usage count
    const { count: aiUsageCount } = await supabase
      .from('ai_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Return aggregated payload
    return res.status(200).json({
      profile: {
        username: profile.username,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url,
        level: profile.level,
        xp: profile.xp,
        studyStreak: profile.study_streak,
        totalStudyHours: parseFloat(profile.total_study_hours)
      },
      recentNotes: recentNotes || [],
      recentChats: recentChats || [],
      flashcardsCount: flashcardsCount || 0,
      plannerProgress: {
        totalTasks,
        completedTasks,
        pendingTasks,
        completionPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      quizStatistics: {
        totalAttempts: totalQuizAttempts,
        averageScorePercentage: averageQuizScore
      },
      aiUsageCount: aiUsageCount || 0,
      weeklyGoalHours: 10, // hardcoded target standard for Lovable widgets
      weeklyActualHours: parseFloat(profile.total_study_hours) // fallback or mock representation
    });
  } catch (err) {
    next(err);
  }
};
