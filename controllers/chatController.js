const { supabase, supabaseAdmin } = require('../config/supabase');
const { callGemini } = require('../services/gemini');

// GET ALL CHAT SESSIONS
exports.getSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { recent, isPinned, isFavourite } = req.query;

    let query = supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId);

    if (isPinned !== undefined) query = query.eq('is_pinned', isPinned === 'true');
    if (isFavourite !== undefined) query = query.eq('is_favourite', isFavourite === 'true');

    if (recent === 'true') {
      query = query.order('updated_at', { ascending: false }).limit(5);
    } else {
      query = query.order('is_pinned', { ascending: false }).order('updated_at', { ascending: false });
    }

    const { data: sessions, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ sessions });
  } catch (err) {
    next(err);
  }
};

// CREATE NEW CHAT SESSION
exports.createSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;

    console.log("===== CREATE SESSION =====");
    console.log("User:", userId);

    const { data: session, error } = await supabaseAdmin
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title: title || 'New Chat Session',
        is_pinned: false,
        is_favourite: false
      })
      .select()
      .single();

    console.log("Session:", session);
    console.log("Supabase Error:", error);

    if (error) {
      return res.status(400).json(error);
    }
    return res.status(201).json({ message: 'Session created successfully', session });
  } catch (err) {
    next(err);
  }
};

// UPDATE SESSION (RENAME, PIN, FAVOURITE)
exports.updateSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, isPinned, isFavourite } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (isPinned !== undefined) updates.is_pinned = isPinned;
    if (isFavourite !== undefined) updates.is_favourite = isFavourite;
    updates.updated_at = new Date();

    const { data: session, error } = await supabaseAdmin
      .from('chat_sessions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ message: 'Session updated successfully', session });
  } catch (err) {
    next(err);
  }
};

// DELETE SESSION
exports.deleteSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('chat_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ message: 'Session deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// GET MESSAGES FOR A SESSION
exports.getMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // Session ID

    // Verify session belongs to user
    const { data: session, error: sessionErr } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (sessionErr || !session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ messages });
  } catch (err) {
    next(err);
  }
};

// SEND MESSAGE & GET AI RESPONSE (Continues Chat)
exports.sendMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // Session ID
    const { content } = req.body;

    console.log("========== SEND MESSAGE ==========");
    console.log("Session ID from URL:", id);
    console.log("User ID from JWT:", userId);
    console.log("Message:", content);
    console.log("Looking for session...");

    if (!content) return res.status(400).json({ error: 'Message content is required' });

    // 1. Verify session belongs to user
    const { data: session, error: sessionErr } = await supabase
      .from('chat_sessions')
      .select('title')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    console.log("Session:", session);
    console.log("Session Error:", sessionErr);
    console.log("req.params =", req.params);
    console.log("req.user =", req.user);

    if (sessionErr || !session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    // 2. Fetch recent conversation history from this session
    const { data: history, error: historyErr } = await supabase
      .from('messages')
      .select('sender, content')
      .eq('session_id', id)
      .order('created_at', { ascending: true })
      .limit(10); // Retrieve last 10 messages for context

    if (historyErr) {
      return res.status(400).json({ error: historyErr.message });
    }

    // 3. Save User Message to DB
    const { data: userMessage, error: userMsgErr } = await supabaseAdmin
      .from('messages')
      .insert({
        session_id: id,
        sender: 'user',
        content
      })
      .select()
      .single();

    if (userMsgErr) return res.status(400).json({ error: userMsgErr.message });

    // 4. Construct AI System context and prompt
    const systemPrompt = `You are StudyGlow AI, an expert, encouraging, and friendly student study assistant.
The student is asking a question about their studies. Maintain educational relevance.`;

    // Format dialogue history for Gemini
    let conversationContext = '';
    if (history && history.length > 0) {
      conversationContext = history
        .map(m => `${m.sender === 'user' ? 'Student' : 'StudyGlow AI'}: ${m.content}`)
        .join('\n') + '\n';
    }
    const finalPrompt = `${conversationContext}Student: ${content}\nStudyGlow AI:`;

    // 5. Call Gemini API
    let aiResponseText = '';
    try {
      aiResponseText = await callGemini(finalPrompt, systemPrompt);
    } catch (aiErr) {
      console.error('Gemini call failed during chat session:', aiErr);
      aiResponseText = 'I apologize, but I encountered an error connecting to my AI service. Please try again in a moment.';
    }

    // 6. Save AI Response to DB
    const { data: aiMessage, error: aiMsgErr } = await supabaseAdmin
      .from('messages')
      .insert({
        session_id: id,
        sender: 'ai',
        content: aiResponseText
      })
      .select()
      .single();

    if (aiMsgErr) return res.status(400).json({ error: aiMsgErr.message });

    // If session title is still default "New Chat Session", rename it dynamically based on user prompt
    if (session.title === 'New Chat Session') {
      const dynamicTitle = content.length > 30 ? `${content.substring(0, 27)}...` : content;
      await supabaseAdmin
        .from('chat_sessions')
        .update({ title: dynamicTitle, updated_at: new Date() })
        .eq('id', id);
    } else {
      // Just touch updated_at
      await supabaseAdmin
        .from('chat_sessions')
        .update({ updated_at: new Date() })
        .eq('id', id);
    }

    // 7. Track AI usage
    const { error: historyInsertError } = await supabaseAdmin
      .from('ai_history')
      .insert({
        user_id: userId,
        feature_type: 'chat',
        prompt: content,
        response: aiResponseText
      });

    if (historyInsertError) {
      console.error("AI History Error:", historyInsertError.message);
    }

    return res.status(200).json({
      userMessage,
      aiMessage
    });
  } catch (err) {
    next(err);
  }
};
