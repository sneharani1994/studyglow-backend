const { supabase, supabaseAdmin } = require('../config/supabase');

// GET PROFILE
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.status(200).json({ profile });
  } catch (err) {
    next(err);
  }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { username, fullName, avatarUrl, studyStreak, totalStudyHours, level, xp } = req.body;

    const updates = {};
    if (username !== undefined) updates.username = username;
    if (fullName !== undefined) updates.full_name = fullName;
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
    if (studyStreak !== undefined) updates.study_streak = studyStreak;
    if (totalStudyHours !== undefined) updates.total_study_hours = totalStudyHours;
    if (level !== undefined) updates.level = level;
    if (xp !== undefined) updates.xp = xp;

    updates.updated_at = new Date();

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Profile updated successfully', profile });
  } catch (err) {
    next(err);
  }
};

// UPDATE PASSWORD
exports.updatePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    // Since we are authenticated via user token, we can use supabase.auth.updateUser
    // But since the middleware is authenticated, we need to create a client with the user's headers
    // or use the standard supabase client. When using standard supabase client, it works if the session is cached,
    // otherwise we can invoke it via admin.
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
      password: newPassword
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

// DELETE ACCOUNT
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Use admin client to delete the user from auth.users (cascades automatically to all public tables)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
};
