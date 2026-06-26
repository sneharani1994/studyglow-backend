-- Seed file containing sample database queries and manual insert instructions.
-- Since UUIDs depend on the auth.users table, run these queries inside your Supabase SQL editor replacing 'YOUR_USER_UUID' with an actual user's UUID.

/*
-- 1. ADD SAMPLE SUBJECTS
INSERT INTO public.subjects (user_id, name, color) VALUES
('YOUR_USER_UUID', 'Computer Science', '#3B82F6'),
('YOUR_USER_UUID', 'Mathematics', '#10B981'),
('YOUR_USER_UUID', 'Physics', '#EF4444'),
('YOUR_USER_UUID', 'Chemistry', '#F59E0B'),
('YOUR_USER_UUID', 'Biology', '#EC4899');

-- 2. ADD SAMPLE FOLDERS (Using subject IDs returned above)
-- Let's assume you get 'SUBJECT_UUID' from subjects
INSERT INTO public.folders (user_id, name, subject_id) VALUES
('YOUR_USER_UUID', 'Algorithms', 'SUBJECT_CS_UUID'),
('YOUR_USER_UUID', 'Linear Algebra', 'SUBJECT_MATH_UUID');

-- 3. ADD SAMPLE NOTES
INSERT INTO public.notes (user_id, title, content, summary, subject_id, folder_id, is_pinned, is_favourite, tags) VALUES
('YOUR_USER_UUID', 'Asymptotic Notation', 'Big O notation is used in Computer Science to describe the performance or complexity of an algorithm...', 'Big O notation describes performance upper bounds for algorithms.', 'SUBJECT_CS_UUID', 'FOLDER_ALG_UUID', true, true, ARRAY['algorithms', 'basics']),
('YOUR_USER_UUID', 'Matrix Multiplication', 'Multiplying two matrices involves calculating dot products of rows and columns...', 'Guide on matrix multiplication rules.', 'SUBJECT_MATH_UUID', 'FOLDER_LA_UUID', false, false, ARRAY['math', 'algebra']);

-- 4. ADD SAMPLE QUIZ
INSERT INTO public.quizzes (id, user_id, title, description, subject_id, difficulty) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'YOUR_USER_UUID', 'Big O Quiz', 'Test your knowledge of time complexities and algorithm runtimes.', 'SUBJECT_CS_UUID', 'medium');

-- 5. ADD SAMPLE QUIZ QUESTIONS
INSERT INTO public.quiz_questions (quiz_id, question_text, options, correct_option_index, explanation) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'What is the time complexity of searching in a balanced Binary Search Tree?', '["O(1)", "O(log n)", "O(n)", "O(n log n)"]', 1, 'In a balanced BST, the height of the tree is log n, which represents the maximum number of comparison operations required to search for an item.'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'What is the worst-case time complexity of Quick Sort?', '["O(log n)", "O(n)", "O(n log n)", "O(n^2)"]', 3, 'In the worst case (e.g., when the pivot is consistently the smallest or largest element), Quick Sort exhibits O(n^2) complexity.');

-- 6. ADD SAMPLE FLASHCARDS
INSERT INTO public.flashcards (user_id, front, back, subject_id, box, next_review) VALUES
('YOUR_USER_UUID', 'What is O(1) time complexity?', 'Constant time. The execution time of the task is independent of the input size.', 'SUBJECT_CS_UUID', 1, NOW()),
('YOUR_USER_UUID', 'What is the transpose of a matrix?', 'An operation that flips a matrix over its diagonal, switching its row and column indices.', 'SUBJECT_MATH_UUID', 2, NOW() + INTERVAL '1 day');

-- 7. ADD PLANNER TASKS
INSERT INTO public.planner_tasks (user_id, title, description, due_date, status, priority, recurrence) VALUES
('YOUR_USER_UUID', 'Revise Big O complexity chart', 'Read notes and take the Big O practice quiz.', NOW() + INTERVAL '1 day', 'todo', 'high', 'none'),
('YOUR_USER_UUID', 'Daily flashcards review', 'Go through the review pile for spaced repetition.', NOW(), 'todo', 'medium', 'daily');
*/
