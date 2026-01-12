import type { Config } from "@react-router/dev/config";

export default {
  // Enable SPA mode - all rendering happens on the client
  ssr: false,
  // Use the app directory for routes
  appDirectory: "app",
} satisfies Config;
