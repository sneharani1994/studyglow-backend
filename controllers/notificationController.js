const { supabase } = require('../config/supabase');

// GET USER NOTIFICATIONS
exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, isRead } = req.query;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);

    if (type) query = query.eq('type', type);
    if (isRead !== undefined) query = query.eq('is_read', isRead === 'true');

    const { data: notifications, error } = await query.order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ notifications });
  } catch (err) {
    next(err);
  }
};

// MARK AS READ
exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (err) {
    next(err);
  }
};

// CREATE NOTIFICATION (Admin or system internal trigger)
exports.createNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, message, type } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type: type || 'system'
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ message: 'Notification created successfully', notification });
  } catch (err) {
    next(err);
  }
};
