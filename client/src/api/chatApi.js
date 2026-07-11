import axios from 'axios';
import { getDeviceId, setDeviceId } from '../utils/deviceId';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const client = axios.create({ baseURL: BASE_URL });

// Attach the device ID to every outgoing request.
client.interceptors.request.use((config) => {
  config.headers['X-Device-Id'] = getDeviceId();
  return config;
});


client.interceptors.response.use((response) => {
  const newId = response.headers['x-new-device-id'];
  if (newId) setDeviceId(newId);
  return response;
});

export async function sendChatInput(input) {
  const { data } = await client.post('/api/chat', { input });
  return data; // { state, messages, options }
}


export async function initPayment(email) {
  const { data } = await client.post('/api/payment/init', { email });
  return data; // { authorizationUrl }
}


export async function getOrderStatus(orderId) {
  const { data } = await client.get(`/api/payment/order/${orderId}/status`);
  return data; 
}