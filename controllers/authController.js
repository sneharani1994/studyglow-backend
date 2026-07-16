const { supabase, supabaseAdmin } = require('../config/supabase');

// SIGN UP
exports.signup = async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0]
        }
      }
    });

    if (error) {
      console.error("Supabase Login Error:", error);

      return res.status(400).json({
        error: error.message,
        code: error.code,
        status: error.status
      });
    }

    return res.status(201).json({
      message: 'Signup successful. Check your email for verification link.',
      user: data.user,
      session: data.session
    });
  } catch (err) {
    next(err);
  }
};

// LOGIN
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({
      message: 'Login successful',
      session: data.session,
      user: data.user
    });
  } catch (err) {
    next(err);
  }
};

// LOGOUT
exports.logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(400).json({ error: 'No authorization token provided' });
    }
    const token = authHeader.split(' ')[1];

    // For Supabase, we can sign out using the client (with the user's token or standard signOut)
    // Supabase JS client handles session invalidation.
    const { error } = await supabase.auth.signOut();
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ message: 'Logout successful' });
  } catch (err) {
    next(err);
  }
};

// FORGOT PASSWORD
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email, redirectTo } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${frontendUrl}/reset-password`
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (err) {
    next(err);
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'New password is required' });
    }

    // This updates the currently logged in user's password.
    // The user must be authenticated (auth token sent in headers).
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized: Reset token missing' });
    }
    const token = authHeader.split(' ')[1];

    // Set active session context using the reset token
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: token // reset token is often access token
    });

    if (sessionError) {
      // If setting session fails, try directly with admin client or return unauthorized
      return res.status(400).json({ error: 'Invalid or expired reset token session' });
    }

    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

// REFRESH SESSION TOKEN
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({
      session: data.session,
      user: data.user
    });
  } catch (err) {
    next(err);
  }
};

// GET CURRENT SESSION / PROFILE
exports.getSession = async (req, res, next) => {
  try {
    // If the authMiddleware has passed, req.user holds verified details
    return res.status(200).json({
      user: req.user
    });
  } catch (err) {
    next(err);
  }
};

// GOOGLE OAUTH URL GENERATOR
// GOOGLE OAUTH URL GENERATOR
exports.googleLogin = async (req, res, next) => {
  try {
    const redirectTo =
      req.query.redirect_to ||
      `${process.env.CORS_ORIGIN}/app/dashboard`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ url: data.url });
  } catch (err) {
    next(err);
  }
};

exports.githubLogin = async (req, res, next) => {
  try {
    const redirectTo =
      req.query.redirect_to ||
      `${process.env.CORS_ORIGIN}/app/dashboard`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ url: data.url });
  } catch (err) {
    next(err);
  }
};
