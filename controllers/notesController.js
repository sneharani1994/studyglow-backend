const { supabase } = require('../config/supabase');

// ==========================================
// NOTES CRUD
// ==========================================

// GET ALL NOTES
exports.getNotes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subjectId, folderId, isPinned, isFavourite, isArchived, tag, search, recent } = req.query;

    let query = supabase
      .from('notes')
      .select('*, subjects(name, color), folders(name)')
      .eq('user_id', userId);

    if (subjectId) query = query.eq('subject_id', subjectId);
    if (folderId) query = query.eq('folder_id', folderId);
    if (isPinned !== undefined) query = query.eq('is_pinned', isPinned === 'true');
    if (isFavourite !== undefined) query = query.eq('is_favourite', isFavourite === 'true');
    
    // Default to show unarchived unless requested
    if (isArchived !== undefined) {
      query = query.eq('is_archived', isArchived === 'true');
    } else {
      query = query.eq('is_archived', false);
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    if (recent === 'true') {
      query = query.order('updated_at', { ascending: false }).limit(5);
    } else {
      query = query.order('is_pinned', { ascending: false }).order('updated_at', { ascending: false });
    }

    const { data: notes, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ notes });
  } catch (err) {
    next(err);
  }
};

// GET SINGLE NOTE
exports.getNote = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: note, error } = await supabase
      .from('notes')
      .select('*, subjects(name, color), folders(name)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    return res.status(200).json({ note });
  } catch (err) {
    next(err);
  }
};

// CREATE NOTE
exports.createNote = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, content, summary, subjectId, folderId, isPinned, isFavourite, tags } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Note title is required' });
    }

    const insertData = {
      user_id: userId,
      title,
      content: content || '',
      summary: summary || '',
      subject_id: subjectId || null,
      folder_id: folderId || null,
      is_pinned: isPinned || false,
      is_favourite: isFavourite || false,
      tags: tags || []
    };

    const { data: note, error } = await supabase
      .from('notes')
      .insert(insertData)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({ message: 'Note created successfully', note });
  } catch (err) {
    next(err);
  }
};

// UPDATE NOTE
exports.updateNote = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, content, summary, subjectId, folderId, isPinned, isFavourite, isArchived, tags } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (summary !== undefined) updates.summary = summary;
    if (subjectId !== undefined) updates.subject_id = subjectId;
    if (folderId !== undefined) updates.folder_id = folderId;
    if (isPinned !== undefined) updates.is_pinned = isPinned;
    if (isFavourite !== undefined) updates.is_favourite = isFavourite;
    if (isArchived !== undefined) updates.is_archived = isArchived;
    if (tags !== undefined) updates.tags = tags;
    
    updates.updated_at = new Date();

    const { data: note, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ message: 'Note updated successfully', note });
  } catch (err) {
    next(err);
  }
};

// DELETE NOTE
exports.deleteNote = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ message: 'Note deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// SUBJECTS
// ==========================================

// GET ALL SUBJECTS
exports.getSubjects = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ subjects });
  } catch (err) {
    next(err);
  }
};

// CREATE SUBJECT
exports.createSubject = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, color } = req.body;

    if (!name) return res.status(400).json({ error: 'Subject name is required' });

    const { data: subject, error } = await supabase
      .from('subjects')
      .insert({ user_id: userId, name, color: color || '#4F46E5' })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ message: 'Subject created successfully', subject });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// FOLDERS
// ==========================================

// GET ALL FOLDERS
exports.getFolders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subjectId } = req.query;

    let query = supabase
      .from('folders')
      .select('*, subjects(name)')
      .eq('user_id', userId);

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    const { data: folders, error } = await query.order('name', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ folders });
  } catch (err) {
    next(err);
  }
};

// CREATE FOLDER
exports.createFolder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, subjectId } = req.body;

    if (!name) return res.status(400).json({ error: 'Folder name is required' });

    const { data: folder, error } = await supabase
      .from('folders')
      .insert({ user_id: userId, name, subject_id: subjectId || null })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ message: 'Folder created successfully', folder });
  } catch (err) {
    next(err);
  }
};

// GET UNIQUE TAGS LIST
exports.getTags = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Grab all notes tags
    const { data: notes, error } = await supabase
      .from('notes')
      .select('tags')
      .eq('user_id', userId);

    if (error) return res.status(400).json({ error: error.message });

    const tagSet = new Set();
    notes.forEach(note => {
      if (Array.isArray(note.tags)) {
        note.tags.forEach(t => tagSet.add(t));
      }
    });

    return res.status(200).json({ tags: Array.from(tagSet) });
  } catch (err) {
    next(err);
  }
};
