const express = require('express');
const Series = require('../models/Series');
const Season = require('../models/Season');
const Episode = require('../models/Episode');
const User = require('../models/User');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { uploadVideo, uploadImage } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');
const { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } = require('../config/constants');

const router = express.Router();

// Initialize default admin (run once)
router.post('/init-admin', async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    const admin = await User.create({
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD,
      name: 'Administrator',
      role: 'admin'
    });

    res.status(201).json({ 
      message: 'Admin created successfully',
      email: admin.email,
      warning: 'Please change the password immediately!'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// Admin Stats
router.get('/stats', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const totalSeries = await Series.count();
    const totalEpisodes = await Episode.count();
    const totalSeasons = await Season.count();
    
    // Calculate storage usage
    const uploadsDir = path.join(process.env.UPLOAD_DIR || './uploads');
    let storageUsage = 0;
    
    if (fs.existsSync(uploadsDir)) {
      const walkDir = (dir) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            storageUsage += walkDir(filePath);
          } else {
            storageUsage += stat.size;
          }
        });
        return storageUsage;
      };
      walkDir(uploadsDir);
    }

    res.json({
      totalSeries,
      totalEpisodes,
      totalSeasons,
      storageUsage: (storageUsage / (1024 * 1024 * 1024)).toFixed(2) // Convert to GB
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Create series
router.post('/series', authenticateToken, authorizeAdmin, uploadImage, async (req, res) => {
  try {
    const { title, description, genre, releaseYear, type } = req.body;
    
    const series = await Series.create({
      title,
      description,
      genre: Array.isArray(genre) ? genre : [genre],
      releaseYear: parseInt(releaseYear),
      type: type || 'series',
      poster: req.file ? `/uploads/images/${req.file.filename}` : null
    });

    res.status(201).json(series);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create series' });
  }
});

// Update series
router.put('/series/:id', authenticateToken, authorizeAdmin, uploadImage, async (req, res) => {
  try {
    const series = await Series.findByPk(req.params.id);
    if (!series) {
      return res.status(404).json({ error: 'Series not found' });
    }

    const updateData = {
      title: req.body.title || series.title,
      description: req.body.description || series.description,
      releaseYear: req.body.releaseYear ? parseInt(req.body.releaseYear) : series.releaseYear
    };

    if (req.file) {
      updateData.poster = `/uploads/images/${req.file.filename}`;
    }

    await series.update(updateData);
    res.json(series);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update series' });
  }
});

// Delete series
router.delete('/series/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const series = await Series.findByPk(req.params.id);
    if (!series) {
      return res.status(404).json({ error: 'Series not found' });
    }

    await series.destroy();
    res.json({ message: 'Series deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete series' });
  }
});

// Create season
router.post('/seasons', authenticateToken, authorizeAdmin, uploadImage, async (req, res) => {
  try {
    const { seriesId, seasonNumber, title, description, releaseYear } = req.body;

    const season = await Season.create({
      seriesId,
      seasonNumber: parseInt(seasonNumber),
      title,
      description,
      releaseYear: parseInt(releaseYear) || new Date().getFullYear(),
      poster: req.file ? `/uploads/images/${req.file.filename}` : null
    });

    res.status(201).json(season);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create season' });
  }
});

// Update season
router.put('/seasons/:id', authenticateToken, authorizeAdmin, uploadImage, async (req, res) => {
  try {
    const season = await Season.findByPk(req.params.id);
    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }

    const updateData = {
      title: req.body.title || season.title,
      description: req.body.description || season.description
    };

    if (req.file) {
      updateData.poster = `/uploads/images/${req.file.filename}`;
    }

    await season.update(updateData);
    res.json(season);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update season' });
  }
});

// Delete season
router.delete('/seasons/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const season = await Season.findByPk(req.params.id);
    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }

    await season.destroy();
    res.json({ message: 'Season deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete season' });
  }
});

// Create episode
router.post('/episodes', authenticateToken, authorizeAdmin, uploadVideo, async (req, res) => {
  try {
    const { seriesId, seasonId, episodeNumber, title, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    const episode = await Episode.create({
      seriesId,
      seasonId,
      episodeNumber: parseInt(episodeNumber),
      title,
      description,
      videoFile: `/uploads/episodes/${req.file.filename}`
    });

    res.status(201).json(episode);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create episode' });
  }
});

// Update episode
router.put('/episodes/:id', authenticateToken, authorizeAdmin, uploadVideo, async (req, res) => {
  try {
    const episode = await Episode.findByPk(req.params.id);
    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    const updateData = {
      title: req.body.title || episode.title,
      description: req.body.description || episode.description,
      episodeNumber: req.body.episodeNumber ? parseInt(req.body.episodeNumber) : episode.episodeNumber
    };

    if (req.file) {
      updateData.videoFile = `/uploads/episodes/${req.file.filename}`;
    }

    await episode.update(updateData);
    res.json(episode);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update episode' });
  }
});

// Delete episode
router.delete('/episodes/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const episode = await Episode.findByPk(req.params.id);
    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    await episode.destroy();
    res.json({ message: 'Episode deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete episode' });
  }
});

module.exports = router;
