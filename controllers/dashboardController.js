const { supabaseAdmin } = require('../config/supabase');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Fetch user profile (includes streak, XP, level, study hours)
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileErr) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // 2. Fetch recent notes (limit 5)
    const { data: recentNotes } = await supabaseAdmin
      .from('notes')
      .select('id, title, updated_at, subject_id, subjects(name, color)')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(5);

    // 3. Fetch recent chats (limit 5)
    const { data: recentChats } = await supabaseAdmin
      .from('chat_sessions')
      .select('id, title, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(5);

    // 4. Fetch planner task statistics
    const { data: plannerTasks } = await supabaseAdmin
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
    const { count: flashcardsCount } = await supabaseAdmin
      .from('flashcards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 6. Fetch quiz statistics
    const { data: quizAttempts } = await supabaseAdmin
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
    const { count: aiUsageCount } = await supabaseAdmin
      .from('ai_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 8. Fetch uploads count (documents)
    const { count: uploadsCount } = await supabaseAdmin
      .from('uploads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 9. Calculate learning streak from activity
    // Check activity across quiz_attempts, ai_history, notes, uploads
    let studyStreak = profile.study_streak || 0;
    
    // If streak is 0, compute from recent activity
    if (studyStreak === 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let streak = 0;
      
      for (let daysBack = 0; daysBack < 30; daysBack++) {
        const dayStart = new Date(today);
        dayStart.setDate(dayStart.getDate() - daysBack);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        
        const { count: activityCount } = await supabaseAdmin
          .from('ai_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', dayStart.toISOString())
          .lt('created_at', dayEnd.toISOString());
        
        if (activityCount && activityCount > 0) {
          streak++;
        } else if (daysBack > 0) {
          break; // Streak broken
        }
      }
      studyStreak = streak;
    }

    // 10. Estimate study hours from activity if profile shows 0
    let totalStudyHours = parseFloat(profile.total_study_hours) || 0;
    if (totalStudyHours === 0) {
      // Estimate: each AI session ~5 min, each quiz attempt ~3 min, each flashcard review ~1 min
      const estimatedMinutes =
        ((aiUsageCount || 0) * 5) +
        (totalQuizAttempts * 3) +
        ((flashcardsCount || 0) * 1);
      totalStudyHours = Math.round((estimatedMinutes / 60) * 10) / 10;
    }

    // Return aggregated payload
    return res.status(200).json({
      profile: {
        username: profile.username,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url,
        level: profile.level,
        xp: profile.xp,
        studyStreak,
        totalStudyHours
      },
      recentNotes: recentNotes || [],
      recentChats: recentChats || [],
      flashcardsCount: flashcardsCount || 0,
      uploadsCount: uploadsCount || 0,
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
      weeklyGoalHours: 10,
      weeklyActualHours: totalStudyHours
    });
  } catch (err) {
    next(err);
  }
};
