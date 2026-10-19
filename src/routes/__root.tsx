import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AuthGate } from "@/components/authgate";

export const Route = createRootRoute({
  component: () => (
    <div className="antialiased min-h-screen">
      <AuthGate>
        <Outlet />
      </AuthGate>
    </div>
  ),
});