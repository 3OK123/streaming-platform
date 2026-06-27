const express = require('express');
const Series = require('../models/Series');
const Season = require('../models/Season');
const Episode = require('../models/Episode');
const { Op } = require('sequelize');

const router = express.Router();

// Get all series
router.get('/', async (req, res) => {
  try {
    const series = await Series.findAll({
      include: [{
        model: Season,
        attributes: ['id', 'seasonNumber', 'totalEpisodes']
      }],
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    res.json(series);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch series' });
  }
});

// Get single series
router.get('/:id', async (req, res) => {
  try {
    const series = await Series.findByPk(req.params.id, {
      include: [{
        model: Season,
        include: [{
          model: Episode,
          attributes: ['id', 'episodeNumber', 'title', 'thumbnail', 'duration']
        }]
      }]
    });

    if (!series) {
      return res.status(404).json({ error: 'Series not found' });
    }

    res.json(series);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch series' });
  }
});

// Search series
router.get('/search/query', async (req, res) => {
  try {
    const { q, genre } = req.query;

    let where = {};
    if (q) {
      where.title = { [Op.iLike]: `%${q}%` };
    }
    if (genre) {
      where.genre = { [Op.contains]: [genre] };
    }

    const series = await Series.findAll({ 
      where, 
      limit: 20,
      order: [['createdAt', 'DESC']]
    });
    res.json(series);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
