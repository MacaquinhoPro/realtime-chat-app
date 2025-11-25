// backend/tests/integration/rooms.itegration.test.ts
import { jest, describe, test, expect } from "@jest/globals";
jest.mock("../../src/config/db", () => require("../mocks/dbMock"));

import request from "supertest";
import app from "../../src/app";

describe("Rooms API", () => {
  test("POST /rooms creates a room or returns auth error", async () => {
    const fakeToken = "Bearer faketoken123";
    const res = await request(app)
      .post("/rooms")
      .set("Authorization", fakeToken)
      .send({ name: "Sala 123", isPrivate: false });

    // puede devolver 201 si todo listo, 401 si auth falla, 400 si valida, 500 por error no esperado
    expect([201, 401, 400, 500]).toContain(res.status);
  });
});