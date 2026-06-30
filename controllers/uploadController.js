const { supabase, supabaseAdmin } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const fileExtension = req.file.originalname.split('.').pop();
    const uniqueFilename = `${userId}/${uuidv4()}.${fileExtension}`;
    const bucketName = 'studyglow-assets';

    // Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(uniqueFilename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    let fileUrl = '';

    if (storageError) {
      console.error("Supabase Storage Error:", storageError);

      return res.status(400).json({
        error: storageError.message
      });
    }

    const { data } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(uniqueFilename);

    fileUrl = data.publicUrl;

    // Insert record into 'uploads' table
    const { data: uploadRecord, error: dbError } = await supabaseAdmin
      .from('uploads')
      .insert({
        user_id: userId,
        filename: req.file.originalname,
        file_url: fileUrl,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        note_id: req.body.noteId || null
      })
      .select()
      .single();

    if (dbError) {
      return res.status(400).json({ error: `DB Save Error: ${dbError.message}` });
    }

    return res.status(201).json({
      message: 'File uploaded successfully',
      file: uploadRecord
    });
  } catch (err) {
    next(err);
  }
};

// GET USER UPLOADS
exports.getUploads = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { noteId } = req.query;

    let query = supabaseAdmin
      .from('uploads')
      .select('*')
      .eq('user_id', userId);

    if (noteId) {
      query = query.eq('note_id', noteId);
    }

    const { data: uploads, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ uploads });
  } catch (err) {
    next(err);
  }
};
