const express = require('express');
const Episode = require('../models/Episode');
const WatchHistory = require('../models/WatchHistory');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get episode
router.get('/:id', async (req, res) => {
  try {
    const episode = await Episode.findByPk(req.params.id);

    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    res.json(episode);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch episode' });
  }
});

// Update watch progress
router.post('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { currentPosition, isCompleted, seriesId } = req.body;

    const [history, created] = await WatchHistory.findOrCreate({
      where: {
        userId: req.user.id,
        episodeId: req.params.id
      },
      defaults: {
        userId: req.user.id,
        episodeId: req.params.id,
        seriesId: seriesId,
        currentPosition,
        isCompleted,
        completedAt: isCompleted ? new Date() : null
      }
    });

    if (!created) {
      await history.update({ 
        currentPosition, 
        isCompleted,
        completedAt: isCompleted ? new Date() : history.completedAt
      });
    }

    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

module.exports = router;
