import Notification from '../models/Notification.js';

export async function createNotification({ userId, type, title, message, link }) {
  return Notification.create({ userId, type, title, message, link });
}

export async function createNotifications(entries) {
  if (!entries.length) return [];
  return Notification.insertMany(entries);
}
