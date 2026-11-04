import { runRecipeRequest } from "@/actions/recipe.actions";

export async function POST(request) {
  const formData = await request.formData();
  let closed = false;
  let streamController;

  const stream = new ReadableStream({
    start(controller) {
      streamController = controller;

      const send = (payload) => {
        if (closed) return;
        try {
          controller.enqueue(`data: ${JSON.stringify(payload)}\n\n`);
        } catch {
          closed = true;
        }
      };

      runRecipeRequest(formData, send)
        .then((result) => {
          send({ type: "result", result });
          if (!closed) {
            closed = true;
            controller.close();
          }
        })
        .catch((error) => {
          send({
            type: "error",
            message: error?.message || "Failed to load recipe",
          });
          if (!closed) {
            closed = true;
            controller.close();
          }
        });
    },
    cancel() {
      closed = true;
    },
  });

  request.signal.addEventListener("abort", () => {
    closed = true;
    streamController?.error(new Error("Recipe request cancelled"));
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
