import { createFileRoute, Link } from "@tanstack/react-router";
import { m } from "@/paraglide/messages";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { useAuth } from "@/db/hooks";

export const Route = createFileRoute("/$locale/")({ component: Home });

function Home() {
  const { locale } = Route.useParams();
  const { currentUser, isAuthenticated, logout } = useAuth();

  return (
    <div className="p-8" key={locale}>
      <h1 className="text-4xl font-bold">{m.welcome_title()}</h1>

      {isAuthenticated && currentUser && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">
            Welcome back, <strong>{currentUser.name}</strong>! (
            {currentUser.email})
          </p>
          <button
            onClick={logout}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      )}

      <p className="mt-4 text-lg">
        {m.edit_instruction({ code: "src/routes/$locale/index.tsx" })}
      </p>
      <p className="mt-2">{m.example_message()}</p>
      <a
        href="https://inlang.com/m/gerre34r/library-inlang-paraglideJs"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        {m.learn_router()}
      </a>

      {!isAuthenticated && (
        <div className="mt-6 flex gap-4">
          <Link
            to="/$locale/login"
            params={{ locale }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {m.login()}
          </Link>
          <Link
            to="/$locale/register"
            params={{ locale }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            {m.register()}
          </Link>
        </div>
      )}

      <div className="mt-3">
        <LocaleSwitcher />
      </div>
    </div>
  );
}
