"use client";
import { useLocalStorage } from "@mantine/hooks";
import React, { Children } from "react";
import { QueryClient, QueryClientProvider } from "react-query";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const queryClient = new QueryClient();
  const [themeStorage] = useLocalStorage({
    key: "theme",
    defaultValue: "winter",
  });
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
