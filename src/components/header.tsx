"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import LogoLight from "../app/images/logo3.png";
import LogoDark from "../app/images/logo.png";
import Profile from "../app/images/user1.png";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import axios from "axios";
import {
  Home,
  LayoutGrid,
  UserCheck,
  ScanLine,
  Smile,
  Moon,
  Sun,
  HelpCircle,
  Bell,
  Settings,
} from "lucide-react";

interface NavbarProps {
  profileUrl?: string;
  userName?: string;
  userEmail?: string;
}

interface Notification {
  message: string;
  mark_read: boolean;
  created_at: string;
}

const NavbarWithSidebar: React.FC<NavbarProps> = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [userName, setUsername] = useState<string>("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);

    if (diffInSeconds < 60) {
      return diffInSeconds === 1
        ? "One second ago"
        : `${diffInSeconds} seconds ago`;
    } else if (diffInMinutes < 60) {
      return diffInMinutes === 1
        ? "One minute ago"
        : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return diffInHours === 1 ? "One hour ago" : `${diffInHours} hours ago`;
    } else if (diffInDays < 7) {
      return diffInDays === 1 ? "One day ago" : `${diffInDays} days ago`;
    } else if (diffInWeeks < 4) {
      return diffInWeeks === 1 ? "One week ago" : `${diffInWeeks} weeks ago`;
    } else if (diffInMonths < 12) {
      return diffInMonths === 1
        ? "One month ago"
        : `${diffInMonths} months ago`;
    } else {
      return past.toLocaleDateString();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isUserMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }

      if (
        isNotificationsOpen &&
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen, isNotificationsOpen]);

  // Save sidebar state to localStorage
  useEffect(() => {
    const savedSidebarState = localStorage.getItem("sidebarOpen");
    if (savedSidebarState !== null) {
      setIsSidebarOpen(savedSidebarState === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem("sidebarOpen", String(newState));
  };

  const fetchNotifications = async () => {
    if (status === "authenticated" && isUser) {
      setIsLoading(true);
      try {
        const response = await axios.get("/api/notifications/history");
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const clearAllNotifications = async () => {
    if (status === "authenticated" && isUser) {
      try {
        await axios.delete("/api/notifications/history");
        setNotifications([]);
        setUnreadCount(0);
      } catch (error) {
        console.error("Error clearing notifications:", error);
      }
    }
  };

  useEffect(() => {
    if (status === "authenticated" && isUser) {
      fetchNotifications();

      const handleNewNotification = (): void => {
        fetchNotifications();
      };

      window.addEventListener("newNotification", handleNewNotification);

      return () => {
        window.removeEventListener("newNotification", handleNewNotification);
      };
    }
  }, [status]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const theme = savedTheme || (prefersDark ? "dark" : "light");

    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
    setIsDarkMode(theme === "dark");
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newMode);
  };

  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  const toggleNotifications = async () => {
    if (!isNotificationsOpen) {
      await fetchNotifications();
      if (unreadCount > 0) {
        try {
          await axios.put("/api/notifications/history");
          setUnreadCount(0);
        } catch (error) {
          console.error("Error marking notifications as read:", error);
        }
      }
    }

    setIsNotificationsOpen(!isNotificationsOpen);
    if (isUserMenuOpen) setIsUserMenuOpen(false);
  };

  const handleLogoClick = () => {
    router.push("/");
    router.refresh();
  };

  const handleLogin = async () => {
    router.push("/login");
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  const handleVisitsClick = () => {
    router.push("/security/visits-list");
  };

  const handleFormClick = () => {
    router.push("/admin/formcontrol");
  };

  const handleScanClick = () => {
    router.push("/security/home");
  };

  const handleTableClick = () => {
    router.push("/admin/database");
  };

  const handleWelcomeClick = () => {
    router.push("/admin/welcome");
  };

  const handleHelpClick = () => {
    window.open("/user-manual", "_blank");
  };

  const capitalizeFirstLetter = (string: string | undefined): string => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const isSecurity = session?.user?.role === "security";
  const isUser = session?.user?.role === "user";
  const isAdmin =
    session?.user?.role === "admin" || session?.user?.role === "sec_admin";
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    const fetchUsername = async () => {
      if (status === "authenticated") {
        try {
          const response = await axios.get("/api/profile");
          setUsername(response.data.username);
        } catch (error) {
          console.error("Error fetching username:", error);
          setUsername("User");
        }
      }
    };

    fetchUsername();
  }, [status]);

  return (
    <>
      <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start rtl:justify-end">
              {isAuthenticated && (
                <button
                  onClick={toggleSidebar}
                  type="button"
                  className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                  <span className="sr-only">Toggle sidebar</span>
                  <svg
                    className="w-6 h-6"
                    aria-hidden="true"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      clipRule="evenodd"
                      fillRule="evenodd"
                      d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
                  </svg>
                </button>
              )}
              <a
                onClick={handleLogoClick}
                className="flex ms-2 md:me-24 cursor-pointer">
                <Image
                  src={isDarkMode ? LogoDark : LogoLight}
                  height={40}
                  alt="Logo"
                  className="h-10 w-auto me-3"
                  priority
                />
              </a>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleHelpClick}
                className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                <HelpCircle className="w-6 h-6" />
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                aria-label="Toggle dark mode">
                {isDarkMode ? (
                  <Sun className="w-6 h-6" />
                ) : (
                  <Moon className="w-6 h-6" />
                )}
              </button>
              {isUser && (
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={toggleNotifications}
                    className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 relative">
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && (
                      <div className="absolute inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full -top-1 -right-1">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </div>
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-80 bg-white divide-y divide-gray-100 rounded-lg shadow-lg dark:bg-gray-700 dark:divide-gray-600">
                      <div className="px-4 py-3 flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          Notifications
                        </h3>
                        {notifications.length > 0 && (
                          <button
                            onClick={clearAllNotifications}
                            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                            Clear all
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {isLoading ? (
                          <div className="px-4 py-3 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Loading notifications...
                            </p>
                          </div>
                        ) : notifications.length > 0 ? (
                          <ul className="py-1">
                            {notifications.map((notification, index) => (
                              <li
                                key={index}
                                className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <p className="text-sm text-gray-700 dark:text-gray-200">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  {formatRelativeTime(notification.created_at)}
                                </p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="px-4 py-3">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No notifications
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {status === "authenticated" ? (
                <div className="flex items-center ms-3" ref={userMenuRef}>
                  <div>
                    <button
                      type="button"
                      onClick={toggleUserMenu}
                      className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600">
                      <span className="sr-only">Open user menu</span>
                      <Image
                        src={Profile}
                        width={32}
                        height={32}
                        className="rounded-full"
                        alt="user photo"
                      />
                    </button>
                  </div>
                  {isUserMenuOpen && (
                    <div className="absolute top-10 right-0 z-50 my-4 text-base list-none bg-white divide-y divide-gray-100 rounded shadow dark:bg-gray-700 dark:divide-gray-600">
                      <div className="px-4 py-3">
                        <p className="text-sm text-gray-900 dark:text-white font-semibold">
                          {capitalizeFirstLetter(userName)} (
                          {capitalizeFirstLetter(session?.user?.role)})
                        </p>
                      </div>
                      <ul className="py-1">
                        <li>
                          <a
                            onClick={handleLogoClick}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white cursor-pointer">
                            {isAdmin ? "Dashboard" : "Home"}
                          </a>
                        </li>
                        <li>
                          <a
                            onClick={handleLogout}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer">
                            Sign out
                          </a>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleLogin}
                  className="ml-2 text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2 dark:text-black dark:bg-gray-100 dark:hover:bg-gray-100 dark:focus:ring-gray-300 dark:border-gray-300">
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
      {isAuthenticated && (
        <aside
          className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700`}>
          <div className="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
            <ul className="space-y-2 font-medium">
              <li>
                <a
                  onClick={handleLogoClick}
                  className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group cursor-pointer">
                  <Home className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                  <span className="ms-3">Home</span>
                </a>
              </li>
              <li>
                {isAdmin && (
                  <a
                    onClick={handleTableClick}
                    className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group cursor-pointer">
                    <LayoutGrid className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                    <span className="flex-1 ms-3 whitespace-nowrap">Table</span>
                  </a>
                )}
              </li>
              <li>
                {(isSecurity || isAdmin) && (
                  <a
                    onClick={handleVisitsClick}
                    className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group cursor-pointer">
                    <UserCheck className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                    <span className="flex-1 ms-3 whitespace-nowrap">
                      Visits
                    </span>
                  </a>
                )}
              </li>
              <li>
                {session?.user?.role === "admin" && (
                  <a
                    onClick={handleFormClick}
                    className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group cursor-pointer">
                    <Settings className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                    <span className="flex-1 ms-3 whitespace-nowrap">Form</span>
                  </a>
                )}
              </li>
              <li>
                {isAdmin && (
                  <a
                    onClick={handleScanClick}
                    className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group cursor-pointer">
                    <ScanLine className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                    <span className="flex-1 ms-3 whitespace-nowrap">Scan</span>
                  </a>
                )}
              </li>
              <li>
                {isAdmin && (
                  <a
                    onClick={handleWelcomeClick}
                    className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group cursor-pointer">
                    <Smile className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                    <span className="flex-1 ms-3 whitespace-nowrap">
                      Welcome
                    </span>
                  </a>
                )}
              </li>
            </ul>
          </div>
        </aside>
      )}
    </>
  );
};

export default NavbarWithSidebar;
