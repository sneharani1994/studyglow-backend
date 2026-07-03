const { supabase, supabaseAdmin } = require('../config/supabase');

// GET PLANNER TASKS
exports.getTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { timeFrame, status, priority, recurrence } = req.query; // daily, weekly, monthly

    let query = supabaseAdmin
      .from('planner_tasks')
      .select('*')
      .eq('user_id', userId);

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (recurrence) query = query.eq('recurrence', recurrence);

    // Apply Time Frame Filters
    const now = new Date();
    if (timeFrame === 'daily') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(now.setHours(23, 59, 59, 999)).toISOString();
      query = query.gte('due_date', startOfDay).lte('due_date', endOfDay);
    } else if (timeFrame === 'weekly') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
      const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6)).toISOString();
      query = query.gte('due_date', startOfWeek).lte('due_date', endOfWeek);
    } else if (timeFrame === 'monthly') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
      query = query.gte('due_date', startOfMonth).lte('due_date', endOfMonth);
    }

    const { data: tasks, error } = await query.order('due_date', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ tasks });
  } catch (err) {
    next(err);
  }
};

// CREATE PLANNER TASK
exports.createTask = async (req, res, next) => {
  console.log("✅ Planner createTask called");
  console.log(req.body);
  try {
    const userId = req.user.id;
    const { title, description, dueDate, status, priority, recurrence } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const { data: task, error } = await supabaseAdmin
      .from('planner_tasks')
      .insert({
        user_id: userId,
        title,
        description: description || '',
        due_date: dueDate || null,
        status: status || 'todo',
        priority: priority || 'medium',
        recurrence: recurrence || 'none'
      })
      .select()
      .single();

    console.log("Task:", task);
    console.log("Error:", error);

    if (error) return res.status(400).json({ error: error.message });

    // Check if task needs immediate system reminder (trigger notification for due dates)
    if (dueDate) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'New Planner Task Created',
          message: `Task "${title}" has been scheduled for ${new Date(dueDate).toLocaleString()}`,
          type: 'planner'
        });
    }

    return res.status(201).json({ message: 'Task created successfully', task });
  } catch (err) {
    next(err);
  }
};

// UPDATE PLANNER TASK
exports.updateTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, dueDate, status, priority, recurrence } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (dueDate !== undefined) updates.due_date = dueDate;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (recurrence !== undefined) updates.recurrence = recurrence;

    updates.updated_at = new Date();

    const { data: task, error } = await supabaseAdmin
      .from('planner_tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // If marked completed, trigger notification
    if (status === 'completed') {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'Task Completed!',
          message: `Congratulations! You finished the task: "${task.title}". Keep up the momentum!`,
          type: 'study'
        });
    }

    return res.status(200).json({ message: 'Task updated successfully', task });
  } catch (err) {
    next(err);
  }
};

// DELETE PLANNER TASK
exports.deleteTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('planner_tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
};
