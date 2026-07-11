

import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'chopchat_device_id';

export function getDeviceId() {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function setDeviceId(id) {
  localStorage.setItem(STORAGE_KEY, id);
}