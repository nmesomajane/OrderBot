
const axios = require('axios');

const paystackClient = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});


async function initializeTransaction({ email, amount, reference, callbackUrl }) {
  const { data } = await paystackClient.post('/transaction/initialize', {
    email,
    amount,
    reference,
    callback_url: callbackUrl,
  });
  return data.data; // { authorization_url, access_code, reference }
}


async function verifyTransaction(reference) {
  const { data } = await paystackClient.get(
    `/transaction/verify/${encodeURIComponent(reference)}`
  );
  return data.data;
}

module.exports = { initializeTransaction, verifyTransaction };