import { useState, useMemo, useEffect } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";
import type { LinksFunction, MetaFunction } from "react-router";
import { SnackbarProvider } from "notistack";

import { UserContext } from "~/context/UserContext";
import { AuthProvider } from "~/context/AuthContext";
import { ThemeProvider } from "~/context/ThemeContext";
import { generateName } from "~/utils/generateName";

import "./styles/app.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap",
  },
];

export const meta: MetaFunction = () => {
  return [
    { title: "Watch Party" },
    { name: "description", content: "Watch videos together with friends" },
  ];
};

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

// Default username for SSR - must be consistent between server and client
const DEFAULT_USERNAME = "Guest";

export default function App() {
  // Start with consistent default for hydration, then generate random name
  const [user, setUser] = useState<string>(DEFAULT_USERNAME);
  const [isHydrated, setIsHydrated] = useState(false);
  const userData = useMemo(() => ({ user, setUser }), [user, setUser]);

  // Generate random name after hydration to avoid mismatch
  useEffect(() => {
    setIsHydrated(true);
    // Only generate a new name if still using default
    if (user === DEFAULT_USERNAME) {
      setUser(generateName());
    }
  }, []);

  return (
    <div className="App">
      <AuthProvider>
        <ThemeProvider>
          <UserContext.Provider value={userData}>
            <SnackbarProvider
              maxSnack={5}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              autoHideDuration={10000}
            >
              <Outlet />
            </SnackbarProvider>
          </UserContext.Provider>
        </ThemeProvider>
      </AuthProvider>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
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
