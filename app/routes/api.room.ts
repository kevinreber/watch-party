import type { LoaderFunctionArgs } from "react-router";

// In-memory room storage (in production, use a database or Redis)
const ROOMS = new Map<string, { roomId: string; createdAt: Date }>();

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const roomId = url.searchParams.get("roomId");

  if (!roomId || typeof roomId !== "string") {
    return Response.json(
      { error: "roomId must be a string" },
      { status: 400 }
    );
  }

  // Create room if it doesn't exist
  if (!ROOMS.has(roomId)) {
    ROOMS.set(roomId, { roomId, createdAt: new Date() });
  }

  return Response.json({
    message: `Successfully joined room ${roomId}`,
    roomId,
  });
}
