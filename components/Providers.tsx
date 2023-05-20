"use client";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import React, { Children } from "react";
import { QueryClient, QueryClientProvider } from "react-query";

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  const [themeStorage, setTheme] = useLocalStorage({
    key: "theme",
    defaultValue: "winter",
  });
  const handleThemeChange = () => {
    setTheme(themeStorage === "winter" ? "dark" : "winter");
  };
  // set data-theme attribute on html element
  React.useEffect(() => {
    const root = window.document.documentElement;
    root.dataset.theme = themeStorage;
  }, [themeStorage]);

  return (
    <>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </>
  );
}
