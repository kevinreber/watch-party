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

import { ConvexClientProvider } from "~/providers/ConvexClientProvider";
import { ConvexAuthProvider } from "~/context/ConvexAuthContext";
import { UserContext } from "~/context/UserContext";
import { AuthProvider } from "~/context/AuthContext";
import { ThemeProvider } from "~/context/ThemeContext";
import { generateName } from "~/utils/generateName";
import { generateMetaTags, generateWebsiteSchema, SEO_CONFIG } from "~/utils/seo";

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
  { rel: "icon", href: "/favicon.ico", sizes: "any" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/manifest.json" },
  { rel: "canonical", href: SEO_CONFIG.siteUrl },
];

export const meta: MetaFunction = () => {
  return generateMetaTags();
};

export function Layout({ children }: { children: React.ReactNode }) {
  const websiteSchema = generateWebsiteSchema();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
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
      <ConvexClientProvider>
        <ConvexAuthProvider>
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
        </ConvexAuthProvider>
      </ConvexClientProvider>
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
