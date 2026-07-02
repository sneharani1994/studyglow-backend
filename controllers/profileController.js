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
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log("===== UPDATE PROFILE =====");
    console.log("User ID:", userId);
    console.log("Body:", req.body);

    const updates = {
      full_name: req.body.fullName,
      updated_at: new Date().toISOString(),
    };

    console.log("Updates:", updates);

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select("*");

    console.log("Data:", data);
    console.log("Error:", error);

    if (error) {
      return res.status(400).json(error);
    }

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
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
