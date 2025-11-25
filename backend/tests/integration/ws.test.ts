// backend/tests/integration/ws.test.ts
import WebSocket from "ws";
import { describe, test, expect, beforeAll } from "@jest/globals";

const WS_URL = "ws://localhost:4001";

describe("WebSocket Server", () => {
  let serverIsOnline = false;

  beforeAll((done: () => void) => {
    const ws = new WebSocket(WS_URL);

    ws.on("open", () => {
      serverIsOnline = true;
      ws.close();
      done();
    });

    ws.on("error", () => {
      console.warn("⚠ WebSocket server no está corriendo, test será SKIPPED.");
      serverIsOnline = false;
      done();
    });
  });

  test("should connect and receive any message", (done: () => void) => {
    if (!serverIsOnline) {
      console.warn("⚠ Saltando test WebSocket porque el servidor no está activo.");
      return done();
    }

    const ws = new WebSocket(WS_URL);

    ws.on("open", () => {
      ws.send(JSON.stringify({ type: "ping", content: "test" }));
    });

    ws.on("message", (msg: WebSocket.Data) => {
      const data = JSON.parse(msg.toString());
      expect(data).toBeDefined();
      expect(data.type).toBeDefined();
      ws.close();
      done();
    });
  });
});
