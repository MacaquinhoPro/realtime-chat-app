import { useEffect, useState } from "react";
import api from "../services/api";
import {
  connectSocket,
  disconnectSocket,
  getSocket,
} from "../services/socket";
import type {
  Room,
  ChatMessage,
  SystemMessage,
  RoomMember,
} from "../types";

export function useChat(token: string | null) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<
    (ChatMessage | SystemMessage)[]
  >([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (!token) return;
    const s = connectSocket(token);

    s.on("message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    s.on("systemMessage", (msg: SystemMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      disconnectSocket();
    };
  }, [token]);

  async function fetchRooms() {
    setLoadingRooms(true);
    const res = await api.get<Room[]>("/rooms");
    setRooms(res.data);
    setLoadingRooms(false);
  }

  async function joinRoom(room: Room, password?: string) {
    await api.post(`/rooms/${room.id}/join`, { password });
    setCurrentRoom(room);
    await fetchMessages(room.id);
    const s = getSocket();
    s?.emit("joinRoom", { roomId: room.id });
  }

  async function leaveCurrentRoom() {
    if (!currentRoom) return;
    await api.post(`/rooms/${currentRoom.id}/leave`);
    const s = getSocket();
    s?.emit("leaveRoom", { roomId: currentRoom.id });
    setCurrentRoom(null);
    setMessages([]);
  }

  async function fetchMessages(roomId: number, page = 1) {
    setLoadingMessages(true);
    const res = await api.get<ChatMessage[]>(`/messages/${roomId}`, {
      params: { page, pageSize: 30 },
    });
    const history = res.data;
    // los más antiguos primero
    setMessages(history.reverse());
    setLoadingMessages(false);
  }

  function sendMessage(content: string) {
    if (!currentRoom) return;
    const s = getSocket();
    s?.emit("sendMessage", { roomId: currentRoom.id, content });
  }

  async function createRoom(
    name: string,
    is_private: boolean,
    password?: string
  ) {
    await api.post("/rooms", { name, is_private, password });
    await fetchRooms();
  }

  // 🔹 Renombrar sala (solo creador)
  async function renameRoom(roomId: number, newName: string) {
    await api.patch(`/rooms/${roomId}`, { name: newName });
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, name: newName } : r))
    );
    setCurrentRoom((prev) =>
      prev && prev.id === roomId ? { ...prev, name: newName } : prev
    );
  }

  // 🔹 Eliminar sala (solo creador)
  async function deleteRoom(roomId: number) {
    await api.delete(`/rooms/${roomId}`);
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
    setCurrentRoom((prev) => (prev && prev.id === roomId ? null : prev));
    setMessages((prev) =>
      currentRoom && currentRoom.id === roomId ? [] : prev
    );
  }

  // 🔹 Obtener miembros de una sala
  async function fetchMembers(roomId: number): Promise<RoomMember[]> {
    const res = await api.get<RoomMember[]>(`/rooms/${roomId}/members`);
    return res.data;
  }

  return {
    rooms,
    currentRoom,
    messages,
    loadingRooms,
    loadingMessages,
    fetchRooms,
    joinRoom,
    leaveCurrentRoom,
    sendMessage,
    createRoom,
    renameRoom,
    deleteRoom,
    fetchMembers,
  };
}
