import jwt from "jsonwebtoken";
import { describe, test, expect } from "@jest/globals";

const SECRET = "supersecreto"; 
describe("Auth Utils - JWT", () => {
  test("should generate and verify a valid JWT", () => {
    const token = jwt.sign({ id: 123 }, SECRET, { expiresIn: "1h" });
    const decoded = jwt.verify(token, SECRET) as any;

    expect(decoded.id).toBe(123);
  });
});