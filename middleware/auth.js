const { supabase } = require('../config/supabase');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Call Supabase API to fetch user info for this JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }

    // Attach user object to request
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    return res.status(401).json({ error: 'Unauthorized: Authentication process failed' });
  }
};

module.exports = authMiddleware;
