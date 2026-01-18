import type { LoaderFunctionArgs } from "react-router";
import { searchYoutube } from "~/server/youtube.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");

  if (!query || typeof query !== "string") {
    return Response.json(
      { error: "query must be a string" },
      { status: 400 }
    );
  }

  try {
    const items = await searchYoutube(query);
    return Response.json(items);
  } catch (error) {
    console.error("YouTube API error:", error);
    return Response.json(
      { error: "youtube error" },
      { status: 500 }
    );
  }
}
