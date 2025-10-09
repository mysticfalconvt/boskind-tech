import React, { useState } from "react";
import { headerLinks } from "@/lib/copy";
import Link from "next/link";
import { navStore } from "@/stateHooks/sidebarNav";
import { useIroningBeadsStore } from "@/stateHooks/ironingBeadsStore";
import { AuthModal } from "./auth/AuthModal";
import { useRouter } from "next/router";

export default function Sidebar() {
  const { sidebarMenu, toggleSidebarMenu } = navStore();
  const { user, isAuthenticated, authLoading, logout } = useIroningBeadsStore();
  const [showAuthModal, setShowAuthModal] = useState<
    "login" | "register" | null
  >(null);
  const router = useRouter();

  const sidebarClassNames = `drawer-side h-screen md:hidden fixed inset-0 w-full ${
    sidebarMenu ? "z-50" : ""
  }`;

  const handleLogin = () => {
    setShowAuthModal("login");
  };

  const handleRegister = () => {
    setShowAuthModal("register");
  };

  const handleLogout = async () => {
    try {
      await logout();
      toggleSidebarMenu(); // Close sidebar
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleAccountSettings = () => {
    toggleSidebarMenu(); // Close sidebar
    router.push("/account/settings");
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(null);
    toggleSidebarMenu(); // Close sidebar after successful auth
  };

  return (
    <>
      <input
        id="my-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={sidebarMenu}
        onChange={toggleSidebarMenu}
      />
      {
        <div className={sidebarClassNames}>
          <label
            htmlFor="my-drawer"
            className="drawer-overlay h-full w-full md:hidden"
          ></label>
          <ul className="menu p-4 w-80 h-full bg-base-100 text-base-content md:hidden overflow-y-auto">
            {
              <ul className="p-4 w-full bg-base-100 flex-1">
                {headerLinks.map((link) => {
                  if (link.subItems) {
                    return (
                      <li key={`sidenav${link.label}${link.href}`}>
                        <div className="group relative flex items-center ">
                          {link.icon ? <link.icon /> : null}
                          {link.label}
                        </div>
                        <ul className="p-4 pt-0 w-full bg-base-100">
                          {link.subItems.map((subItem) => (
                            <li
                              key={`sidenav${subItem.label}${subItem.href}`}
                              onClick={() => {
                                if (sidebarMenu) {
                                  // wait for the sidebar to close before navigating
                                  setTimeout(() => {
                                    toggleSidebarMenu();
                                  }, 200);
                                }
                              }}
                            >
                              <Link href={subItem.href}>
                                {subItem.label}
                                {subItem.icon ? <subItem.icon /> : null}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  } else {
                    return (
                      <li key={`sidenav${link.label}`}>
                        <Link href={link.href}>
                          {link.icon ? <link.icon /> : null}
                          {link.label}
                        </Link>
                      </li>
                    );
                  }
                })}

                {/* Authentication Section */}
                <li className="border-t border-base-300 mt-4 pt-4">
                  {authLoading ? (
                    <div className="flex items-center justify-center p-2">
                      <span className="loading loading-spinner loading-sm"></span>
                    </div>
                  ) : isAuthenticated && user ? (
                    <>
                      <div className="flex items-center p-2 text-sm opacity-70">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        {user.username}
                      </div>
                      <li>
                        <button
                          onClick={handleAccountSettings}
                          className="w-full text-left"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          Account Settings
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left text-error"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          Sign Out
                        </button>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <button
                          onClick={handleLogin}
                          className="w-full text-left"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                            />
                          </svg>
                          Sign In
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={handleRegister}
                          className="w-full text-left"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                            />
                          </svg>
                          Sign Up
                        </button>
                      </li>
                    </>
                  )}
                </li>
              </ul>
            }
          </ul>
        </div>
      }

      {/* Authentication Modal */}
      <AuthModal
        mode={showAuthModal || "login"}
        isOpen={!!showAuthModal}
        onClose={() => setShowAuthModal(null)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
