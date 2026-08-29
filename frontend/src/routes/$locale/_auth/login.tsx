import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { m } from "@/paraglide/messages";
import { useAuth } from "@/db/hooks";
import { useState, type FormEvent } from "react";

export const Route = createFileRoute("/$locale/_auth/login")({
  component: LoginPage,
});

function LoginPage() {
  const { locale } = Route.useParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call - replace with real authentication
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock successful login
      const user = {
        id: crypto.randomUUID(),
        email,
        name: email.split("@")[0] || "User",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const token = "mock-jwt-token";
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      login(user, token, expiresAt);

      // Navigate to home after successful login
      navigate({ to: "/$locale", params: { locale } });
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">{m.login()}</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {m.email()}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {m.password()}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Loading..." : m.sign_in()}
        </button>
      </form>
    </div>
  );
}
