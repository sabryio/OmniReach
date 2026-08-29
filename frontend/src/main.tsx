import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import TanstackQueryProvider from "./integrations/tanstack-query/root-provider";
import type { PropsWithChildren } from "react";
import { TooltipProvider } from "./components/ui/tooltip";

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  Wrap: ({ children }: PropsWithChildren) => (
    <TanstackQueryProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </TanstackQueryProvider>
  ),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app")!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}
