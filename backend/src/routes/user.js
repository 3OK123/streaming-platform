const express = require('express');
const Favorite = require('../models/Favorite');
const WatchHistory = require('../models/WatchHistory');
const Series = require('../models/Series');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get favorites
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const favorites = await Favorite.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Series,
        attributes: ['id', 'title', 'poster', 'type', 'description']
      }],
      order: [['addedAt', 'DESC']]
    });
    res.json(favorites);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Add to favorites
router.post('/favorites/:seriesId', authenticateToken, async (req, res) => {
  try {
    const [favorite, created] = await Favorite.findOrCreate({
      where: {
        userId: req.user.id,
        seriesId: req.params.seriesId
      }
    });

    if (!created) {
      return res.status(400).json({ error: 'Already in favorites' });
    }

    res.status(201).json(favorite);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add to favorites' });
  }
});

// Remove from favorites
router.delete('/favorites/:seriesId', authenticateToken, async (req, res) => {
  try {
    await Favorite.destroy({
      where: {
        userId: req.user.id,
        seriesId: req.params.seriesId
      }
    });
    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove from favorites' });
  }
});

// Get watch history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const history = await WatchHistory.findAll({
      where: { userId: req.user.id },
      limit: 50,
      order: [['watchedAt', 'DESC']]
    });
    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
