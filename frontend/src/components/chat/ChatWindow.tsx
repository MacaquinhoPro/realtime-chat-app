import React, { useEffect, useRef, useState } from "react";
import {
  Room,
  ChatMessage,
  SystemMessage,
  RoomMember,
} from "../../types";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { Button } from "../common/Button";

interface Props {
  room: Room | null;
  messages: (ChatMessage | SystemMessage)[];
  username: string | null;
  loadingMessages: boolean;
  onSendMessage: (content: string) => void;
  onLeaveRoom: () => Promise<void>;
  isOwner: boolean;
  onRenameRoom: (newName: string) => Promise<void>;
  onDeleteRoom: () => Promise<void>;
  onFetchMembers: (roomId: number) => Promise<RoomMember[]>;
}

const ChatWindow: React.FC<Props> = ({
  room,
  messages,
  username,
  loadingMessages,
  onSendMessage,
  onLeaveRoom,
  isOwner,
  onRenameRoom,
  onDeleteRoom,
  onFetchMembers,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, room]);

  useEffect(() => {
    // reset miembros al cambiar de sala
    setShowMembers(false);
    setMembers([]);
    setMembersError(null);
  }, [room?.id]);

  async function handleToggleMembers() {
    if (!room) return;
    const next = !showMembers;
    setShowMembers(next);
    if (next && members.length === 0) {
      try {
        setLoadingMembers(true);
        const data = await onFetchMembers(room.id);
        setMembers(data);
        setMembersError(null);
      } catch (e) {
        setMembersError("No se pudieron cargar los miembros.");
      } finally {
        setLoadingMembers(false);
      }
    }
  }

  async function handleRename() {
    if (!room) return;
    const newName = prompt("Nuevo nombre para la sala:", room.name);
    if (!newName || !newName.trim()) return;
    await onRenameRoom(newName.trim());
  }

  async function handleDelete() {
    if (!room) return;
    const ok = confirm(
      `¿Seguro que quieres eliminar la sala "${room.name}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    await onDeleteRoom();
  }

  if (!room) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 text-sm text-slate-400">
        <p className="mb-1 font-medium text-slate-300">
          Selecciona una sala o crea una nueva
        </p>
        <p className="text-xs text-slate-500">
          Podrás ver el historial de mensajes y enviar mensajes en tiempo real.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl shadow-slate-950/60">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-50">
            #{room.name}
          </h2>
          <p className="text-[11px] text-slate-400">
            Sala {room.is_private ? "privada" : "pública"} · Creador:{" "}
            <span className="font-medium text-slate-200">
              {room.created_by_username}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="px-3 py-1 text-[11px]"
            onClick={handleToggleMembers}
          >
            Miembros
          </Button>
          {isOwner && (
            <>
              <Button
                variant="ghost"
                className="px-3 py-1 text-[11px]"
                onClick={handleRename}
              >
                Renombrar
              </Button>
              <Button
                variant="ghost"
                className="px-3 py-1 text-[11px] text-rose-300"
                onClick={handleDelete}
              >
                Eliminar
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            className="px-3 py-1 text-[11px]"
            onClick={onLeaveRoom}
          >
            Salir
          </Button>
        </div>
      </header>

      {showMembers && (
        <div className="border-b border-slate-800 bg-slate-950/80 px-4 py-2 text-[11px]">
          <p className="mb-1 font-semibold text-slate-200">
            Miembros de la sala
          </p>
          {loadingMembers && (
            <p className="text-slate-400">Cargando miembros...</p>
          )}
          {membersError && (
            <p className="text-rose-400">{membersError}</p>
          )}
          {!loadingMembers && !membersError && (
            <div className="flex flex-wrap gap-1">
              {members.map((m) => (
                <span
                  key={m.id}
                  className="rounded-full bg-slate-900 px-2 py-1 text-[10px] text-slate-200"
                >
                  {m.username}
                </span>
              ))}
              {members.length === 0 && (
                <span className="text-slate-500">
                  Aún no hay miembros registrados.
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 text-xs">
        {loadingMessages && (
          <p className="mb-2 text-center text-[11px] text-slate-400">
            Cargando historial...
          </p>
        )}
        {messages.map((m, idx) => (
          <MessageBubble key={idx} msg={m} username={username} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-800 p-3">
        <MessageInput onSend={onSendMessage} />
      </div>
    </section>
  );
};

export default ChatWindow;
