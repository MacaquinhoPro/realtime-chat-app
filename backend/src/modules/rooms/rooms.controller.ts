import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { db } from "../../config/db";

export async function createRoom(req: Request, res: Response) {
  const { name, is_private, password } = req.body;
  const user = (req as any).user;

  let hash: string | null = null;
  if (is_private && password) {
    hash = await bcrypt.hash(password, 10);
  }

  await db().query(
    "INSERT INTO rooms(name, is_private, password_hash, created_by) VALUES ($1, $2, $3, $4)",
    [name, !!is_private, hash, user.id]
  );

  return res.json({ message: "Room created" });
}

export async function listRooms(req: Request, res: Response) {
  const result = await db().query(
    `SELECT r.id,
            r.name,
            r.is_private,
            r.created_by,
            u.username AS created_by_username
     FROM rooms r
     JOIN users u ON u.id = r.created_by
     ORDER BY r.created_at DESC`
  );
  return res.json(result.rows);
}

export async function joinRoom(req: Request, res: Response) {
  const user = (req as any).user;
  const roomId = req.params.id;
  const { password } = req.body;

  const roomResult = await db().query("SELECT * FROM rooms WHERE id = $1", [
    roomId,
  ]);
  if (!roomResult.rows.length) {
    return res.status(404).json({ error: "Room not found" });
  }

  const room = roomResult.rows[0];

  if (room.is_private) {
    if (!password) {
      return res.status(401).json({ error: "Room password required" });
    }
    const ok = await bcrypt.compare(password, room.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Wrong room password" });
    }
  }

  await db().query(
    `INSERT INTO room_members(user_id, room_id)
     VALUES ($1, $2)
     ON CONFLICT(user_id, room_id) DO NOTHING`,
    [user.id, roomId]
  );

  return res.json({ message: "Joined" });
}

export async function leaveRoom(req: Request, res: Response) {
  const user = (req as any).user;
  const roomId = req.params.id;

  await db().query(
    "DELETE FROM room_members WHERE user_id = $1 AND room_id = $2",
    [user.id, roomId]
  );

  return res.json({ message: "Left room" });
}

// 🔹 Lista de miembros de una sala
export async function getRoomMembers(req: Request, res: Response) {
  const roomId = req.params.id;

  const room = await db().query("SELECT id FROM rooms WHERE id = $1", [
    roomId,
  ]);
  if (!room.rows.length) {
    return res.status(404).json({ error: "Room not found" });
  }

  const members = await db().query(
    `SELECT u.id, u.username
     FROM room_members rm
     JOIN users u ON u.id = rm.user_id
     WHERE rm.room_id = $1
     ORDER BY u.username`,
    [roomId]
  );

  return res.json(members.rows);
}

// 🔹 Renombrar sala (solo creador)
export async function updateRoom(req: Request, res: Response) {
  const user = (req as any).user;
  const roomId = req.params.id;
  const { name } = req.body;

  const roomResult = await db().query(
    "SELECT id, created_by FROM rooms WHERE id = $1",
    [roomId]
  );
  if (!roomResult.rows.length) {
    return res.status(404).json({ error: "Room not found" });
  }

  const room = roomResult.rows[0];
  if (room.created_by !== user.id) {
    return res.status(403).json({ error: "Only creator can update room" });
  }

  await db().query("UPDATE rooms SET name = $1 WHERE id = $2", [name, roomId]);

  return res.json({ message: "Room updated" });
}

// 🔹 Eliminar sala (solo creador)
export async function deleteRoom(req: Request, res: Response) {
  const user = (req as any).user;
  const roomId = req.params.id;

  const roomResult = await db().query(
    "SELECT id, created_by FROM rooms WHERE id = $1",
    [roomId]
  );
  if (!roomResult.rows.length) {
    return res.status(404).json({ error: "Room not found" });
  }

  const room = roomResult.rows[0];
  if (room.created_by !== user.id) {
    return res.status(403).json({ error: "Only creator can delete room" });
  }

  await db().query("DELETE FROM messages WHERE room_id = $1", [roomId]);
  await db().query("DELETE FROM room_members WHERE room_id = $1", [roomId]);
  await db().query("DELETE FROM rooms WHERE id = $1", [roomId]);

  return res.json({ message: "Room deleted" });
}
