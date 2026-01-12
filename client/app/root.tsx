import { useState, useMemo, lazy, Suspense } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";
import { SnackbarProvider } from "notistack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

import { UserContext } from "@context";
import { generateName } from "@utils";
import type { Route } from "./+types/root";

import "./app.css";

const ReactQueryDevTools = lazy(() =>
  import("@tanstack/react-query-devtools").then((module) => ({
    default: module.ReactQueryDevtools,
  }))
);

const TWO_MINUTES_IN_MILLISECONDS = 1000 * 60 * 2;
const FIVE_MINUTES_IN_MILLISECONDS = 1000 * 60 * 5;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      retry: 0,
      staleTime: TWO_MINUTES_IN_MILLISECONDS,
      gcTime: TWO_MINUTES_IN_MILLISECONDS,
      refetchInterval: FIVE_MINUTES_IN_MILLISECONDS,
    },
  },
});

// Only persist in browser
if (typeof window !== "undefined") {
  const localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage,
  });

  persistQueryClient({
    queryClient,
    persister: localStoragePersister,
  });
}

const SNACKBAR_POSITION_VERTICAL = "bottom";
const SNACKBAR_POSITION_HORIZONTAL = "left";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const [user, setUser] = useState<string>(generateName());
  const userData = useMemo(() => ({ user, setUser }), [user]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <UserContext.Provider value={userData}>
          <SnackbarProvider
            maxSnack={5}
            anchorOrigin={{
              vertical: SNACKBAR_POSITION_VERTICAL,
              horizontal: SNACKBAR_POSITION_HORIZONTAL,
            }}
            autoHideDuration={10000}
          >
            <Outlet />
          </SnackbarProvider>
        </UserContext.Provider>
      </div>
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <ReactQueryDevTools position="bottom" />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="error-container">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
