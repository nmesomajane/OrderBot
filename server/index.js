require('dotenv').config();

const express = require('express');
const cors = require('cors');

const deviceIdMiddleware = require('./middleware/deviceId');
const chatRoutes = require('./routes/chat');
const paymentRoutes = require('./routes/payment');
const paystackWebhookHandler = require('./routes/webhook');

const app = express();

app.use(cors({ origin: process.env.CLIENT_BASE_URL, credentials: true }));


app.post(
  '/api/payment/webhook',
  express.raw({ type: 'application/json' }),
  paystackWebhookHandler
);

// Every other route can safely use normal parsed JSON bodies.
app.use(express.json());
app.use(deviceIdMiddleware);

app.use('/api/chat', chatRoutes);
app.use('/api/payment', paymentRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ChopChat server running on port ${PORT}`));