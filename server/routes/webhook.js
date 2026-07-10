

const crypto = require('crypto');
const prisma = require('../db/prisma');

async function paystackWebhookHandler(req, res) {
  const signature = req.headers['x-paystack-signature'];
  const expected = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(req.body) // req.body is a raw Buffer here, not parsed JSON
    .digest('hex');

  if (signature !== expected) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body.toString('utf8'));

  if (event.event === 'charge.success') {
    const { reference } = event.data;
    const payment = await prisma.payment.findUnique({ where: { reference } });

    // Idempotency check: Paystack may send this event more than once.
    // Only act if we haven't already marked it successful.
    if (payment && payment.status !== 'SUCCESS') {
      await prisma.payment.update({
        where: { reference },
        data: { status: 'SUCCESS', raw: event.data },
      });
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'PAID' },
      });
    }
  }


  return res.sendStatus(200);
}

module.exports = paystackWebhookHandler;