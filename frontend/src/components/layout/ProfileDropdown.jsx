import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../store/slices/authSlice";
import { 
  LogOut, 
  Settings, 
  User as UserIcon, 
  Bell, 
  Check, 
  Trash2,
  ChevronRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { markAsRead, markAllAsRead, deleteNotification, clearReadNotifications } from "../../store/slices/notificationSlice";

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user } = useSelector(state => state.auth);
  const { items, unreadCount, status } = useSelector(state => state.notifications);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      dispatch(markAsRead(notification._id));
    }
    setIsOpen(false);
    setShowNotifications(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getProfileLink = () => {
    if (!user) return "/";
    if (user.role === "admin") return "/admin/profile";
    if (user.role === "teacher") return "/teacher/profile";
    return "/student/profile";
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          setShowNotifications(false);
        }}
        className="flex items-center gap-2 hover:bg-slate-100 p-1 pr-3 rounded-full transition-colors focus:outline-none"
      >
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold border border-sky-200">
            {getInitials(user?.name)}
          </div>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 border border-white rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-slate-700 leading-tight">{user?.name?.split(' ')[0]}</p>
          <p className="text-xs text-slate-500 capitalize leading-tight">{user?.role}</p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50 transform origin-top-right transition-all">
          {!showNotifications ? (
            <>
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <p className="font-semibold text-slate-800 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              
              <div className="p-2">
                <Link 
                  to={getProfileLink()} 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50 hover:text-sky-600 transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  My Profile
                </Link>
                
                <button 
                  onClick={() => setShowNotifications(true)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50 hover:text-sky-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4" />
                    Notifications
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <span className="bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-bold">
                        {unreadCount} new
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
                
                {/* Admin only Settings - optional */}
                {user?.role === "admin" && (
                  <Link 
                    to="/admin/foundation"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50 hover:text-sky-600 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                )}
              </div>
              
              <div className="p-2 border-t border-slate-100">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Notifications View */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180 text-slate-600" />
                  </button>
                  <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                </div>
                <div className="flex space-x-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); dispatch(markAllAsRead()); }}
                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                    title="Mark all as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); dispatch(clearReadNotifications()); }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="Clear read"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {status === "loading" && items.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">Loading...</div>
                ) : items.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
                    <Bell className="w-8 h-8 text-slate-200" />
                    No notifications
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {items.map((notification) => (
                      <li 
                        key={notification._id} 
                        className={`p-4 transition-colors ${notification.isRead ? 'bg-white' : 'bg-sky-50/50 hover:bg-sky-50'} flex gap-3 group`}
                      >
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <p className={`text-sm ${notification.isRead ? 'text-slate-700' : 'font-semibold text-slate-900'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-2 font-medium">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); dispatch(deleteNotification(notification._id)); }}
                          className="text-slate-300 hover:text-rose-500 transition-colors p-1.5 h-fit opacity-0 group-hover:opacity-100 rounded hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
