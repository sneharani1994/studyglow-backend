const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const notesRoutes = require('./routes/notesRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');
const quizRoutes = require('./routes/quizRoutes');
const plannerRoutes = require('./routes/plannerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const aiRoutes = require('./routes/aiRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const searchRoutes = require('./routes/searchRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ======================
// Security
// ======================
app.use(helmet());

// ======================
// Logging
// ======================
app.use(morgan('dev'));

// ======================
// CORS Configuration
// ======================

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL,

  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    console.log("Incoming Origin:", origin);
    // Allow Postman, curl, mobile apps
    if (!origin) {
      return callback(null, true);
    }
    const isAllowed =
      allowedOrigins.includes(origin) ||

      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:") ||

      /^https:\/\/.*\.lovable\.app$/.test(origin) ||

      /^https:\/\/.*\.lovable\.dev$/.test(origin) ||



      /^https:\/\/.*\.lovableproject\.com$/.test(origin) ||

      /^https:\/\/.*\.vercel\.app$/.test(origin);

    if (isAllowed) {
      return callback(null, true);
    }

    console.log('Blocked Origin:', origin);

    // Do NOT throw an error here

    return callback(null, false);
  },


  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
  ],

  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization'
  ],

  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ======================
// Body Parsers
// ======================
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// ======================
// Rate Limiter
// ======================
app.use(rateLimiter({
  windowMs: 60 * 1000,
  max: 100
}));

// ======================
// Root Endpoint
// ======================
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Welcome to the StudyGlow AI Backend API',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// ======================
// API Routes
// ======================
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/uploads', uploadRoutes);

// ======================
// 404 Handler
// ======================
app.use((req, res) => {
  res.status(404).json({
    error: `Path not found: ${req.originalUrl}`
  });
});

// ======================
// Error Handler
// ======================
app.use(errorHandler);

// ======================
// Start Server
// ======================
app.listen(PORT, () => {
  console.log(`[Server] StudyGlow AI Backend listening on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;