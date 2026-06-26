const rateLimits = new Map();

/**
 * Custom memory-based rate limiter middleware.
 * @param {object} options - Configuration options
 * @param {number} options.windowMs - Time frame window in milliseconds (default: 1 minute)
 * @param {number} options.max - Max number of requests per window (default: 60)
 * @param {string} options.message - Error message to return (default: Too many requests)
 */
const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute
  const max = options.max || 60;
  const message = options.message || 'Too many requests from this IP, please try again later.';

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!rateLimits.has(ip)) {
      rateLimits.set(ip, {
        resetTime: now + windowMs,
        count: 1
      });
      return next();
    }

    const rateData = rateLimits.get(ip);

    if (now > rateData.resetTime) {
      // Reset window
      rateData.resetTime = now + windowMs;
      rateData.count = 1;
      rateLimits.set(ip, rateData);
      return next();
    }

    rateData.count += 1;
    rateLimits.set(ip, rateData);

    if (rateData.count > max) {
      return res.status(429).json({ error: message });
    }

    next();
  };
};

module.exports = rateLimiter;
