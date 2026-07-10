const express = require('express');
const { handleMessage } = require('../state-machine/handlers');

const router = express.Router();


router.post('/', async (req, res) => {
  try {
    const { input } = req.body;
    if (input === undefined || input === null || input === '') {
      return res.status(400).json({ error: 'input is required' });
    }

    const result = await handleMessage(req.deviceId, input);
    return res.json(result);
  } catch (err) {
    console.error('Chat handler error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;