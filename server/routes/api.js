const express = require('express');
const router = express.Router();
const PlatformState = require('../managers/PlatformState');

router.post('/games/config', (req, res) => {
  PlatformState.updateConfig(req.body);
  res.json({ success: true, config: PlatformState.globalGameConfig });
});

router.get('/games/config', (req, res) => {
  res.json(PlatformState.globalGameConfig);
});

router.get('/analytics', (req, res) => {
  res.json(PlatformState.globalAnalytics);
});

// We can keep this for internal manual recording if needed, 
// though GameEngine will call PlatformState.recordGameResult directly
router.post('/analytics/record_game', (req, res) => {
    PlatformState.recordGameResult(req.body);
    res.json({ success: true });
});

module.exports = router;
