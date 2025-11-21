import { Request, Response } from "express";
import { db } from "../../config/db";

export async function getHistory(req: Request, res: Response) {
  const { roomId } = req.params;
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 20);
  const offset = (page - 1) * pageSize;

  const result = await db().query(
    `SELECT m.id,
            m.room_id,
            m.user_id,
            m.content,
            m.created_at,
            u.username
     FROM messages m
     JOIN users u ON u.id = m.user_id
     WHERE m.room_id = $1
     ORDER BY m.created_at DESC
     LIMIT $2 OFFSET $3`,
    [roomId, pageSize, offset]
  );

  return res.json(result.rows);
}
