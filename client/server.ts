import { createRequestHandler } from "@react-router/express";
import express from "express";
import { createServer } from "http";
import { initializeSocketServer } from "./app/server/socket.server";

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO with the HTTP server
initializeSocketServer(httpServer);

// Serve static assets in production
const viteDevServer =
  process.env.NODE_ENV === "production"
    ? null
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" })
  );
  app.use(express.static("build/client", { maxAge: "1h" }));
}

// Handle all other requests with React Router
app.all(
  "*",
  createRequestHandler({
    build: viteDevServer
      ? () => viteDevServer.ssrLoadModule("virtual:react-router/server-build")
      : await import("./build/server/index.js"),
  })
);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
