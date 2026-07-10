const express = require('express');
const prisma = require('../db/prisma');
const { initializeTransaction, verifyTransaction } = require('../services/paystack');

const router = express.Router();

router.post('/init', async (req, res) => {
  try {
    const deviceId = req.deviceId;
    const { email } = req.body; // Paystack requires an email even with no accounts

    const order = await prisma.order.findFirst({
      where: { deviceId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    if (!order) {
      return res.status(404).json({ error: 'No pending order to pay for.' });
    }


    const reference = `chopchat_${order.id}_${Date.now()}`;

    const paystackData = await initializeTransaction({
      email: email || 'guest@chopchat.test',
      amount: order.total, // already in kobo
      reference,
      callbackUrl: `${process.env.APP_BASE_URL}/api/payment/callback`,
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        reference,
        amount: order.total,
        status: 'INITIALIZED',
      },
    });

    return res.json({ authorizationUrl: paystackData.authorization_url });
  } catch (err) {
    console.error('Payment init error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Could not start payment.' });
  }
});

router.get('/callback', async (req, res) => {
  const { reference } = req.query;
  const frontendUrl = process.env.CLIENT_BASE_URL;

  if (!reference) {
    return res.redirect(`${frontendUrl}?payment=error`);
  }

  try {
    const verification = await verifyTransaction(reference);
    const success = verification.status === 'success';

    const payment = await prisma.payment.update({
      where: { reference },
      data: { status: success ? 'SUCCESS' : 'FAILED', raw: verification },
    });

    if (success) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'PAID' },
      });
    }

    return res.redirect(
      `${frontendUrl}?payment=${success ? 'success' : 'failed'}&orderId=${payment.orderId}`
    );
  } catch (err) {
    console.error('Payment callback error:', err.response?.data || err.message);
    return res.redirect(`${frontendUrl}?payment=error`);
  }
});

router.get('/order/:id/status', async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  return res.json({ status: order.status });
});

module.exports = router;