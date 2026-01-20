import type { LoaderFunctionArgs } from "react-router";
import Ably from "ably";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const clientId = url.searchParams.get("clientId");

  if (!clientId) {
    return Response.json(
      { error: "clientId is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.ABLY_API_KEY;

  if (!apiKey) {
    console.error("ABLY_API_KEY environment variable is not set");
    return Response.json(
      { error: "Ably is not configured" },
      { status: 500 }
    );
  }

  try {
    const ably = new Ably.Rest({ key: apiKey });
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId,
      capability: {
        "*": ["publish", "subscribe", "presence"],
      },
    });

    return Response.json(tokenRequest);
  } catch (error) {
    console.error("Error creating Ably token:", error);
    return Response.json(
      { error: "Failed to create authentication token" },
      { status: 500 }
    );
  }
}
