import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("room/:roomId", "routes/room.tsx"),
  route("api/youtube", "routes/api.youtube.ts"),
  route("api/room", "routes/api.room.ts"),
  route("api/ably-auth", "routes/api.ably-auth.ts"),
  route("api/video-state", "routes/api.video-state.ts"),
] satisfies RouteConfig;
