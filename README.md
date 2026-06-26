# StudyGlow AI - Backend API Server

This is the production-ready Node.js & Express.js backend server designed for **StudyGlow AI**, supporting seamless integration with the Lovable frontend, Supabase Database/Auth/Storage, and Google Gemini API.

---

## Features

1.  **AI Services (Google Gemini)**: 13+ APIs for summarization, concepts explanations, homework solving, roadmap generation, study plans, essay/grammar editing, coding assistant, and dynamic MCQ quiz/flashcard building.
2.  **Authentication**: Syncs with Supabase Authentication using secure Bearer JWT verification.
3.  **Database**: Complete Supabase PostgreSQL relational schema with cascaded deletion rules, search optimizations, updated triggers, and user syncing.
4.  **Dashboard Aggregates**: Single-request statistic compiler tracking streak progress, quiz averages, planner tasks, flashcard decks, and AI usage.
5.  **Spaced Repetition Flashcards**: Complete backend Leitner System algorithm computing dynamic review intervals (Box 1-5 schedules).
6.  **Global Search**: Cross-module ILIKE query scanning Notes, Chats, Planners, Flashcards, and Quizzes concurrently.
7.  **File Uploads**: Handles PDF, Image, and Document attachments uploading directly to Supabase Storage.
8.  **Security**: Configured with Helmet headers, Morgan logging, CORS (supporting lovable.app and localhost origins), custom rate-limiters, and global error handling.

---

## Project Structure

```
backend/
├── config/             # Connection configurations (Supabase Client)
├── controllers/        # Logical controllers handling request-response cycles
├── docs/               # API endpoint documentation
├── middleware/         # Auth, Rate Limiter, and central Error Handler middlewares
├── routes/             # API routers mounting endpoints
├── services/           # External service wrappers (Gemini API Callers)
├── sql/                # DB setup schemas and seed statements
├── package.json        # Dependencies list
├── server.js           # Server startup entry point
└── .env.example        # Environment parameters template
```

---

## Environment Setup

1.  Navigate into the backend folder:
    ```bash
    cd backend
    ```
2.  Create a `.env` file from the template:
    ```bash
    cp .env.example .env
    ```
3.  Fill in your specific credentials in the `.env` file:
    *   `SUPABASE_URL`: Your Supabase project URL.
    *   `SUPABASE_ANON_KEY`: Your Supabase anonymous public key.
    *   `SUPABASE_SERVICE_ROLE_KEY`: Service role secret key (required for administrative account deletion/creation actions).
    *   `GEMINI_API_KEY`: Google Gemini API key.
    *   `JWT_SECRET`: Any random security string.

---

## Database Setup

1.  Go to your **Supabase Dashboard** -> **SQL Editor**.
2.  Open the file `sql/schema.sql`, copy its entire content, paste it in the Supabase SQL editor, and click **Run**.
3.  Ensure the triggers and indexes compile successfully. This creates all 16 tables and sets up automatic syncing from `auth.users` to `public.users` & `public.profiles` on user sign-up.

---

## Running the Server

### Installation
Install the necessary package dependencies:
```bash
npm install
```

### Run in Development Mode
Starts the server with `nodemon` for hot-reloads:
```bash
npm run dev
```

### Run in Production Mode
Starts the server using standard node execution:
```bash
npm start
```
The API server will default to listening on `http://localhost:5000`.

---

## Verification & API Documentation

*   To verify the server status, send a `GET` request to `http://localhost:5000/`. You should receive an online status report.
*   For details on payload structures, request formats, and response patterns, refer to the [API Documentation](file:///c:/Users/SNEHA%20RANI/OneDrive/exam/project/backend/docs/API_DOCUMENTATION.md).
