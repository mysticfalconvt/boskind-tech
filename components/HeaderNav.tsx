import { copy } from "@/lib/copy";
import { headerLinks } from "@/lib/copy";
import { useLocalStorage } from "@mantine/hooks";
import Link from "next/link";
import { IconType } from "react-icons/lib";
import { navStore } from "@/stateHooks/sidebarNav";
import { useIroningBeadsStore } from "@/stateHooks/ironingBeadsStore";
import { AccountDropdown } from "./auth/AccountDropdown";
import { AuthModal } from "./auth/AuthModal";
import { useState } from "react";
import { useRouter } from "next/router";
import * as React from "react";

type linkItem = {
  label: string;
  href: string;
  icon?: IconType;
  subItems?: linkItem[];
};

export type linkItemsList = linkItem[];

type headerLinksRendererProps = {
  links: linkItemsList;
};

const HeaderLinksRenderer: React.FC<headerLinksRendererProps> = ({ links }) => {
  const submenuList = links.map((link) => {
    if (link.subItems && link.subItems.length > 0 && link.label) {
      return link.label || "";
    }
  });
  return (
    <>
      {links.map((link) => {
        if (link.subItems) {
          return (
            <div
              tabIndex={0}
              key={`header${link.label}${link.href}`}
              className="z-10 hidden md:block dropdown dropdown-end"
            >
              <label className="btn btn-ghost">
                {link.icon ? <link.icon /> : null}
                {link.label}
              </label>

              <ul className="p-2 mt-1 rounded-md bg-gradient-to-bl drop-shadow text:base-content from-base-300 to-base-100 dropdown-content">
                {link.subItems.map((subItem) => {
                  return (
                    <li
                      key={`header${subItem.label}${subItem.href}`}
                      className="btn-ghost hover:drop-shadow-md text-base-content"
                    >
                      <Link href={subItem.href}>
                        {subItem.icon ? <subItem.icon /> : null}
                        {subItem.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        } else {
          return (
            <li key={link.label} className="hidden md:block btn-ghost">
              <Link href={link.href}>
                {link.icon ? <link.icon /> : null}
                {link.label}
              </Link>
            </li>
          );
        }
      })}
    </>
  );
};

export const HeaderNav: React.FC = () => {
  const [themeStorage, setTheme] = useLocalStorage({
    key: "theme",
    defaultValue: "winter",
  });
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'register' | null>(null);
  
  const handleThemeChange = () => {
    setTheme(themeStorage === "winter" ? "dark" : "winter");
  };

  const { sidebarMenu, toggleSidebarMenu } = navStore();
  const { user, isAuthenticated, authLoading, logout, checkAuth } = useIroningBeadsStore();
  const router = useRouter();

  // Initialize authentication on mount
  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const isDarkMode = themeStorage === "dark";

  const handleLogin = () => {
    setShowAuthModal('login');
  };

  const handleRegister = () => {
    setShowAuthModal('register');
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAccountSettings = () => {
    router.push('/account/settings');
  };

  const handleAuthSuccess = async (user: any) => {
    // The store should already be updated by the AuthModal
  };

  return (
    <div className="navbar bg-gradient-to-tr from-primary to-secondary text-primary-content font-mono">
      <div className="flex-1 align-center">
        <Link href="/" className="btn btn-ghost normal-case text-xl ">
          {copy.components.BoskindDigital.title}
        </Link>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal items-center justify-center px-1">
          <HeaderLinksRenderer links={headerLinks} />
          <AccountDropdown
            user={user ? {
              id: user.id,
              username: user.username,
              createdAt: user.createdAt
            } : null}
            isLoading={authLoading}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onLogout={handleLogout}
            onAccountSettings={handleAccountSettings}
          />
          <li>
            <label className="swap btn-ghost hover:drop-shadow swap-rotate">
              <input
                type="checkbox"
                checked={!isDarkMode ? true : false}
                onChange={handleThemeChange}
                data-testid="theme-toggle"
              />

              <svg
                className="swap-on fill-current w-5 h-5 sm:w-8 sm:h-8"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
              </svg>

              <svg
                className="swap-off fill-current w-5 h-5 sm:w-8 sm:h-8"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
              </svg>
            </label>
          </li>
          <li className="md:hidden">
            <label className="btn btn-ghost hover:drop-shadow-md swap swap-rotate">
              <input
                type="checkbox"
                checked={sidebarMenu}
                onChange={toggleSidebarMenu}
              />

              <svg
                className="swap-off fill-current w-5 h-5 sm:w-8 sm:h-8"
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 512 512"
              >
                <path d="M64,384H448V341.33H64Zm0-106.67H448V234.67H64ZM64,128v42.67H448V128Z" />
              </svg>

              <svg
                className="swap-on fill-current w-5 h-5 sm:w-8 sm:h-8"
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 512 512"
              >
                <polygon points="400 145.49 366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49" />
              </svg>
            </label>
          </li>
        </ul>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        mode={showAuthModal || 'login'}
        isOpen={!!showAuthModal}
        onClose={() => setShowAuthModal(null)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};
