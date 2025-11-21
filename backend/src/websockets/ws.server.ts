import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { mq } from "../config/rabbitmq";
import { db } from "../config/db";

interface JwtPayload {
  id: number;
  username: string;
}

export function initWebSocketServer(server: HttpServer) {
  const io = new Server(server, { cors: { origin: "*" } });

  io.use((socket, next) => {
    try {
      const { token } = socket.handshake.auth as { token?: string };
      if (!token) {
        return next(new Error("Unauthorized"));
      }
      const user = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as JwtPayload;
      (socket as any).user = user;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket as any).user as JwtPayload;

    socket.on("joinRoom", ({ roomId }) => {
      socket.join("room:" + roomId);
      io.to("room:" + roomId).emit("systemMessage", {
        type: "userJoined" as const,
        user: { id: user.id, username: user.username },
      });
    });

    socket.on("leaveRoom", ({ roomId }) => {
      socket.leave("room:" + roomId);
      io.to("room:" + roomId).emit("systemMessage", {
        type: "userLeft" as const,
        user: { id: user.id, username: user.username },
      });
    });

    socket.on(
      "sendMessage",
      async ({ roomId, content }: { roomId: number; content: string }) => {
        const msg = {
          roomId,
          userId: user.id,
          username: user.username,
          content,
          ts: Date.now(),
        };

        mq().publish(
          "chat.exchange",
          `room.${roomId}.message`,
          Buffer.from(JSON.stringify(msg))
        );
      }
    );
  });

  (async () => {
    const channel = mq();
    const q = await channel.assertQueue("", { exclusive: true });
    await channel.bindQueue(q.queue, "chat.exchange", "room.*.message");

    channel.consume(q.queue, async (rawMsg) => {
      if (!rawMsg) return;
      const data = JSON.parse(rawMsg.content.toString()) as {
        roomId: number;
        userId: number;
        username: string;
        content: string;
        ts: number;
      };

      await db().query(
        "INSERT INTO messages(room_id, user_id, content) VALUES ($1, $2, $3)",
        [data.roomId, data.userId, data.content]
      );

      io.to("room:" + data.roomId).emit("message", data);

      channel.ack(rawMsg);
    });
  })();
}
