import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addClient, removeClient } from "@/lib/notifications";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id, 10);

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  let heartbeatInterval: NodeJS.Timeout;

  const stream = new ReadableStream({
    start(controller) {
      addClient(userId, controller);

      controller.enqueue('event: connected\ndata: {"status":"connected"}\n\n');

      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(": heartbeat\n\n");
        } catch (error) {
          console.error(error);
          cleanup();
        }
      }, 30000);

      const cleanup = () => {
        clearInterval(heartbeatInterval);
        removeClient(userId);
        try {
          controller.close();
        } catch (error) {
          console.error(error);
        }
      };

      if (headers.get("connection")?.toLowerCase() === "close") {
        cleanup();
      }
    },
    cancel() {
      clearInterval(heartbeatInterval);
      removeClient(userId);
    },
  });

  return new NextResponse(stream, { headers });
}
