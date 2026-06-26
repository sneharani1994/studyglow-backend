const { supabase } = require('../config/supabase');

exports.globalSearch = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query parameter (q) is required' });
    }

    const searchTerm = `%${q}%`;

    // 1. Search Notes
    const notesQuery = supabase
      .from('notes')
      .select('id, title, content, updated_at')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
      .limit(10);

    // 2. Search Chat Sessions
    const chatsQuery = supabase
      .from('chat_sessions')
      .select('id, title, updated_at')
      .eq('user_id', userId)
      .ilike('title', searchTerm)
      .limit(10);

    // 3. Search Planner Tasks
    const plannerQuery = supabase
      .from('planner_tasks')
      .select('id, title, description, due_date, status')
      .eq('user_id', userId)
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(10);

    // 4. Search Flashcards
    const flashcardsQuery = supabase
      .from('flashcards')
      .select('id, front, back')
      .eq('user_id', userId)
      .or(`front.ilike.${searchTerm},back.ilike.${searchTerm}`)
      .limit(10);

    // 5. Search Quizzes
    const quizzesQuery = supabase
      .from('quizzes')
      .select('id, title, description, difficulty')
      .eq('user_id', userId)
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(10);

    // Run queries concurrently
    const [
      { data: notes },
      { data: chats },
      { data: planner },
      { data: flashcards },
      { data: quizzes }
    ] = await Promise.all([
      notesQuery,
      chatsQuery,
      plannerQuery,
      flashcardsQuery,
      quizzesQuery
    ]);

    return res.status(200).json({
      results: {
        notes: notes || [],
        chats: chats || [],
        planner: planner || [],
        flashcards: flashcards || [],
        quizzes: quizzes || []
      }
    });
  } catch (err) {
    next(err);
  }
};
