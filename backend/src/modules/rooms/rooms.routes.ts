import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import {
  createRoom,
  listRooms,
  joinRoom,
  leaveRoom,
  getRoomMembers,
  updateRoom,
  deleteRoom,
} from "./rooms.controller";

const router = Router();

// Crear sala
router.post("/", auth, createRoom);

// Listar salas
router.get("/", auth, listRooms);

// Ver miembros de una sala
router.get("/:id/members", auth, getRoomMembers);

// Unirse / salir
router.post("/:id/join", auth, joinRoom);
router.post("/:id/leave", auth, leaveRoom);

// Renombrar sala (solo creador)
router.patch("/:id", auth, updateRoom);

// Eliminar sala (solo creador)
router.delete("/:id", auth, deleteRoom);

export default router;
