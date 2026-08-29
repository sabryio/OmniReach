import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <Outlet />
      </div>
    </div>
  );
}
