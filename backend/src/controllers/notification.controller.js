import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Notification from "../models/notification.model.js";

// @desc    Get user's notifications
// @route   GET /api/v2/notifications
// @access  Private (Any authenticated user)
export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50); // Get latest 50

  const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

  res.status(200).json(new ApiResponse(200, { notifications, unreadCount }, "Notifications retrieved successfully"));
});

// @desc    Mark a notification as read
// @route   PATCH /api/v2/notifications/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found or unauthorized");
  }

  res.status(200).json(new ApiResponse(200, notification, "Notification marked as read"));
});

// @desc    Mark all notifications as read
// @route   PATCH /api/v2/notifications/read-all
// @access  Private
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true }
  );

  res.status(200).json(new ApiResponse(200, {}, "All notifications marked as read"));
});

// @desc    Delete a notification
// @route   DELETE /api/v2/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found or unauthorized");
  }

  res.status(200).json(new ApiResponse(200, {}, "Notification deleted"));
});

// @desc    Delete all read notifications
// @route   DELETE /api/v2/notifications/read
// @access  Private
export const clearReadNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ userId: req.user._id, isRead: true });

  res.status(200).json(new ApiResponse(200, {}, "Read notifications cleared"));
});
