const { supabase } = require('../config/supabase');

// GET ALL FLASHCARDS
exports.getFlashcards = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subjectId, isFavourite, needsReview } = req.query;

    let query = supabase
      .from('flashcards')
      .select('*, subjects(name)')
      .eq('user_id', userId);

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }
    if (isFavourite !== undefined) {
      query = query.eq('is_favourite', isFavourite === 'true');
    }
    if (needsReview === 'true') {
      // Return flashcards where next_review <= current time
      query = query.lte('next_review', new Date().toISOString());
    }

    const { data: flashcards, error } = await query.order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ flashcards });
  } catch (err) {
    next(err);
  }
};

// CREATE FLASHCARD
exports.createFlashcard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { front, back, subjectId, isFavourite } = req.body;

    if (!front || !back) {
      return res.status(400).json({ error: 'Front and back content are required' });
    }

    const { data: flashcard, error } = await supabase
      .from('flashcards')
      .insert({
        user_id: userId,
        front,
        back,
        subject_id: subjectId || null,
        box: 1,
        next_review: new Date().toISOString(),
        is_favourite: isFavourite || false
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ message: 'Flashcard created successfully', flashcard });
  } catch (err) {
    next(err);
  }
};

// UPDATE FLASHCARD
exports.updateFlashcard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { front, back, subjectId, isFavourite, box, nextReview } = req.body;

    const updates = {};
    if (front !== undefined) updates.front = front;
    if (back !== undefined) updates.back = back;
    if (subjectId !== undefined) updates.subject_id = subjectId;
    if (isFavourite !== undefined) updates.is_favourite = isFavourite;
    if (box !== undefined) updates.box = box;
    if (nextReview !== undefined) updates.next_review = nextReview;

    updates.updated_at = new Date();

    const { data: flashcard, error } = await supabase
      .from('flashcards')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ message: 'Flashcard updated successfully', flashcard });
  } catch (err) {
    next(err);
  }
};

// DELETE FLASHCARD
exports.deleteFlashcard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ message: 'Flashcard deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// REVIEW FLASHCARD (Spaced Repetition / Leitner System Algorithm)
exports.reviewFlashcard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { isCorrect } = req.body; // boolean

    if (isCorrect === undefined) {
      return res.status(400).json({ error: 'isCorrect is required (boolean)' });
    }

    // Fetch existing card to see current box
    const { data: card, error: fetchError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !card) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    let newBox = card.box;
    let daysToAdd = 1;

    if (isCorrect) {
      // Progress to next box (capped at 5)
      newBox = Math.min(newBox + 1, 5);
    } else {
      // Reset back to box 1 on mistake
      newBox = 1;
    }

    // Assign interval in days based on Leitner boxes:
    // Box 1: 1 day, Box 2: 3 days, Box 3: 7 days, Box 4: 14 days, Box 5: 30 days
    switch (newBox) {
      case 1: daysToAdd = 1; break;
      case 2: daysToAdd = 3; break;
      case 3: daysToAdd = 7; break;
      case 4: daysToAdd = 14; break;
      case 5: daysToAdd = 30; break;
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);

    const { data: updatedCard, error: updateError } = await supabase
      .from('flashcards')
      .update({
        box: newBox,
        next_review: nextReviewDate.toISOString(),
        updated_at: new Date()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    return res.status(200).json({
      message: 'Review recorded successfully',
      flashcard: updatedCard,
      boxProgress: {
        previousBox: card.box,
        newBox: updatedCard.box,
        nextReviewInDays: daysToAdd
      }
    });
  } catch (err) {
    next(err);
  }
};
