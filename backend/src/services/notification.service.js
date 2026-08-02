import Notification from "../models/notification.model.js";
import { emitToUser, emitToSession } from "./socket.js";

/**
 * Creates a notification in the database and emits it to the specific user via Socket.io
 * @param {string} userId - ID of the user receiving the notification
 * @param {object} notificationData - { type, title, message, link, metadata }
 */
export const sendUserNotification = async (userId, notificationData) => {
  try {
    const notification = await Notification.create({
      userId,
      ...notificationData,
    });

    // Emit real-time update
    emitToUser(userId, "new_notification", notification);

    return notification;
  } catch (error) {
    console.error("Error sending user notification:", error);
  }
};

/**
 * Sends a notification to an entire array of user IDs
 * @param {Array<string>} userIds
 * @param {object} notificationData 
 */
export const sendBulkNotification = async (userIds, notificationData) => {
  try {
    const notifications = userIds.map(userId => ({
      userId,
      ...notificationData
    }));

    const insertedNotifications = await Notification.insertMany(notifications);

    // Emit real-time to each user
    insertedNotifications.forEach(notification => {
      emitToUser(notification.userId.toString(), "new_notification", notification);
    });

    return insertedNotifications;
  } catch (error) {
    console.error("Error sending bulk notifications:", error);
  }
};
