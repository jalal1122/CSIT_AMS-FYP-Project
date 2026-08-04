import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { 
  fetchNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification, 
  clearReadNotifications,
  addNotification 
} from "../../store/slices/notificationSlice";
import socket from "../../services/socket";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { items, unreadCount, status } = useSelector(state => state.notifications);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications());
      
      // Ensure socket is connected before emitting
      if (!socket.connected) {
        socket.connect();
      }

      const onConnect = () => {
        socket.emit("join-user", user._id);
      };

      if (socket.connected) {
        onConnect();
      } else {
        socket.on("connect", onConnect);
      }

      socket.on("new_notification", (notification) => {
        dispatch(addNotification(notification));
      });

      return () => {
        socket.off("connect", onConnect);
        socket.off("new_notification");
        if (socket.connected) {
          socket.emit("leave-user", user._id);
          socket.disconnect();
        }
      };
    }
  }, [dispatch, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      dispatch(markAsRead(notification._id));
    }
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100 focus:outline-none"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
            <div className="flex space-x-2">
              <button 
                onClick={() => dispatch(markAllAsRead())}
                className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                title="Mark all as read"
              >
                <Check className="w-4 h-4" />
              </button>
              <button 
                onClick={() => dispatch(clearReadNotifications())}
                className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                title="Clear read"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {status === "loading" && items.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((notification) => (
                  <li 
                    key={notification._id} 
                    className={`p-4 transition-colors ${notification.isRead ? 'bg-white' : 'bg-blue-50/50 hover:bg-blue-50'} flex gap-3`}
                  >
                    <div 
                      className={`flex-1 cursor-pointer`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <p className={`text-sm ${notification.isRead ? 'text-gray-800' : 'font-semibold text-gray-900'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); dispatch(deleteNotification(notification._id)); }}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 h-fit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
