import type { EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { renderToPipeableStream } from "react-dom/server";
import { PassThrough } from "node:stream";

const ABORT_DELAY = 5000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}

// Helper to convert Node readable stream to Web ReadableStream
function createReadableStreamFromReadable(
  source: import("stream").Readable
): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      source.on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      source.on("end", () => {
        controller.close();
      });
      source.on("error", (err: Error) => {
        controller.error(err);
      });
    },
    cancel() {
      source.destroy();
    },
  });
}
