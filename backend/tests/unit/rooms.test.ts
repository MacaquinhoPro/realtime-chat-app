import { createRoom } from "../../src/modules/rooms/rooms.controller";
import { describe, test, expect, jest } from "@jest/globals";

describe("Rooms Controller - Unit", () => {
  test("should create a room", async () => {
    const req = {
      body: {
        name: "sala-unit-test",
        is_private: false,
      },
      user: { id: 1 },
    } as any;

    const jsonMock = jest.fn().mockImplementation((payload) => payload);
    const res = { json: jsonMock } as any;

    const result = await createRoom(req, res);

    expect(jsonMock).toHaveBeenCalledWith({ message: "Room created" });
    expect(result).toEqual({ message: "Room created" });
  });
});