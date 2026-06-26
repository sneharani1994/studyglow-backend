const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Application Error:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An internal server error occurred';

  res.status(statusCode).json({
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
