# StudyGlow AI Backend API Documentation

This backend is built on Express.js, integrating Supabase Auth, PostgreSQL database, and Google Gemini AI.

## Authentication & Headers

All protected endpoints expect a Bearer Token in the `Authorization` header:

```http
Authorization: Bearer <SUPABASE_JWT_ACCESS_TOKEN>
```

---

## 1. Authentication (`/api/auth`)

### Sign Up (`POST /api/auth/signup`)
Registers a new user inside Supabase Auth.
*   **Request Body**:
    ```json
    {
      "email": "student@example.com",
      "password": "securepassword123",
      "fullName": "Jane Doe"
    }
    ```
*   **Response (201)**:
    ```json
    {
      "message": "Signup successful. Check your email for verification link.",
      "user": { "id": "uuid-here", "email": "student@example.com" }
    }
    ```

### Login (`POST /api/auth/login`)
*   **Request Body**:
    ```json
    {
      "email": "student@example.com",
      "password": "securepassword123"
    }
    ```
*   **Response (200)**:
    ```json
    {
      "message": "Login successful",
      "session": { "access_token": "jwt...", "refresh_token": "ref..." },
      "user": { "id": "uuid-here", "email": "student@example.com" }
    }
    ```

---

## 2. User Profile (`/api/profile`) - *Protected*

### Get Profile (`GET /api/profile`)
*   **Response (200)**:
    ```json
    {
      "profile": {
        "id": "uuid-here",
        "username": "student",
        "full_name": "Jane Doe",
        "avatar_url": "url",
        "study_streak": 3,
        "total_study_hours": 12.5,
        "level": 2,
        "xp": 340
      }
    }
    ```

### Update Profile (`PUT /api/profile`)
*   **Request Body**:
    ```json
    {
      "fullName": "Jane M. Doe",
      "username": "janedoe_new"
    }
    ```
*   **Response (200)**:
    ```json
    {
      "message": "Profile updated successfully",
      "profile": { ... }
    }
    ```

---

## 3. Notes Module (`/api/notes`) - *Protected*

### Get Notes (`GET /api/notes`)
*   **Query Parameters**:
    *   `subjectId`: filter by subject (UUID)
    *   `folderId`: filter by folder (UUID)
    *   `isPinned`: `true` / `false`
    *   `isFavourite`: `true` / `false`
    *   `recent`: `true` (returns 5 most recent notes)
    *   `search`: text queries matching title or content
*   **Response (200)**:
    ```json
    {
      "notes": [
        {
          "id": "uuid-note",
          "title": "Asymptotic Notation",
          "content": "Big O describes algorithm upper bounds...",
          "summary": "Big O is an upper bound definition.",
          "tags": ["algorithms", "basics"],
          "is_pinned": true,
          "is_favourite": true
        }
      ]
    }
    ```

### Create Note (`POST /api/notes`)
*   **Request Body**:
    ```json
    {
      "title": "New Topic",
      "content": "Notes content details...",
      "subjectId": "uuid-subject",
      "tags": ["science"]
    }
    ```
*   **Response (201)**:
    ```json
    {
      "message": "Note created successfully",
      "note": { ... }
    }
    ```

---

## 4. Flashcards Module (`/api/flashcards`) - *Protected*

### Get Flashcards (`GET /api/flashcards`)
*   **Query Parameters**:
    *   `needsReview`: `true` (Leitner reviews where `next_review <= NOW()`)
*   **Response (200)**:
    ```json
    {
      "flashcards": [
        {
          "id": "uuid-card",
          "front": "What is encapsulation?",
          "back": "Hiding data details inside objects.",
          "box": 1,
          "next_review": "2026-06-24T20:00:00Z"
        }
      ]
    }
    ```

### Submit Review (`POST /api/flashcards/:id/review`)
Adjusts Leitner spaced repetition statistics based on correct answer input.
*   **Request Body**:
    ```json
    {
      "isCorrect": true
    }
    ```
*   **Response (200)**:
    ```json
    {
      "message": "Review recorded successfully",
      "flashcard": { "box": 2, "next_review": "2026-06-26T20:00:00Z" },
      "boxProgress": { "previousBox": 1, "newBox": 2, "nextReviewInDays": 3 }
    }
    ```

---

## 5. Quiz Module (`/api/quizzes`) - *Protected*

### Get Quizzes (`GET /api/quizzes`)
*   **Response (200)**:
    ```json
    {
      "quizzes": [
        {
          "id": "uuid-quiz",
          "title": "Big O Quiz",
          "difficulty": "medium"
        }
      ]
    }
    ```

### Attempt Quiz (`POST /api/quizzes/:id/attempt`)
Autoevaluates student answers and updates study XP.
*   **Request Body**:
    ```json
    {
      "answers": {
        "question-uuid-1": 1,
        "question-uuid-2": 3
      }
    }
    ```
*   **Response (201)**:
    ```json
    {
      "message": "Quiz attempt evaluated and recorded",
      "score": 2,
      "totalQuestions": 2,
      "percentage": 100,
      "xpEarned": 30
    }
    ```

---

## 6. AI Features (`/api/ai`) - *Protected*

### Summarize Notes (`POST /api/ai/summarize`)
*   **Request Body**:
    ```json
    {
      "text": "Insert raw note text here...",
      "length": "medium"
    }
    ```
*   **Response (200)**:
    ```json
    {
      "summary": "### Executive Summary\n- Bullet A\n- Bullet B"
    }
    ```

### Generate Quiz Questions (`POST /api/ai/generate-quiz`)
Returns structured JSON arrays generated by Gemini.
*   **Request Body**:
    ```json
    {
      "topic": "Newton's laws of motion",
      "questionCount": 3,
      "difficulty": "medium"
    }
    ```
*   **Response (200)**:
    ```json
    {
      "questions": [
        {
          "question_text": "What is force equal to according to Newton's Second Law?",
          "options": ["Mass / Acceleration", "Mass * Acceleration", "Velocity * Mass", "Distance / Time"],
          "correct_option_index": 1,
          "explanation": "F = ma."
        }
      ]
    }
    ```

---

## 7. AI Chat (`/api/chat`) - *Protected*

### Send Chat Message (`POST /api/chat/sessions/:id/messages`)
Converses with Gemini incorporating previous session history automatically.
*   **Request Body**:
    ```json
    {
      "content": "Explain binary searches."
    }
    ```
*   **Response (200)**:
    ```json
    {
      "userMessage": { "sender": "user", "content": "Explain binary searches." },
      "aiMessage": { "sender": "ai", "content": "A binary search works by..." }
    }
    ```

---

## 8. Dashboard Analytics (`/api/dashboard`) - *Protected*

### Get Dashboard Stats (`GET /api/dashboard`)
Retrieves comprehensive study status aggregates.
*   **Response (200)**:
    ```json
    {
      "profile": { "username": "student", "studyStreak": 3, "level": 2, "xp": 340, "totalStudyHours": 12.5 },
      "recentNotes": [ ... ],
      "recentChats": [ ... ],
      "flashcardsCount": 8,
      "plannerProgress": { "totalTasks": 5, "completedTasks": 3, "pendingTasks": 2, "completionPercentage": 60 },
      "quizStatistics": { "totalAttempts": 4, "averageScorePercentage": 78 },
      "aiUsageCount": 14
    }
    ```

---

## 9. Global Search (`/api/search`) - *Protected*

### Global Search (`GET /api/search?q=algorithms`)
*   **Response (200)**:
    ```json
    {
      "results": {
        "notes": [ ... ],
        "chats": [ ... ],
        "planner": [ ... ],
        "flashcards": [ ... ],
        "quizzes": [ ... ]
      }
    }
    ```
