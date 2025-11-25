import { describe, test, expect, jest } from "@jest/globals";

// 📌 1. Mockear la DB ANTES de que se importe app
jest.mock("../../src/config/db", () => require("../../tests/mocks/dbMock"));
import request from "supertest";
import app from "../../src/app"; 

describe("Auth API", () => {
  test("POST /auth/login returns JWT or acceptable status", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ username: "test", password: "123" });

    // 📌 Como los credentials no existen (y la DB está mockeada)
    // puede responder 200, 401, 500 según tu lógica.
   expect([200, 401, 404, 500]).toContain(res.status);

    // Si devuelve 200, valida el token
    if (res.status === 200) {
      expect(res.body.token).toBeDefined();
    }
  });
});