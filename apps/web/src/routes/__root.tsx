import { createRootRoute, Navigate, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/stores/auth";
import { useRef, useEffect } from "react";

const PUBLIC_PATHS = ["/login", "/register"];

function RootComponent() {
  const { isAuthenticated, isPending, refresh, fetchMe, token } = useAuth();
  const path = window.location.pathname;
  const didAttempt = useRef(false);

  useEffect(() => {
    if (didAttempt.current) return;
    didAttempt.current = true;
    if (!token) {
      refresh();
    } else {
      fetchMe();
    }
  }, []);

  // Public routes — render without sidebar
  if (PUBLIC_PATHS.includes(path)) {
    return <Outlet />;
  }

  // On initial load, show nothing until auth resolves (avoids flash of login redirect)
  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" />;
  return <AppShell />;
}

export const Route = createRootRoute({
  component: RootComponent,
});
