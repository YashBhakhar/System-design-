/*
 * Ask tab chats, kept in this browser only (no login).
 * They survive a refresh; "clear browsing data" removes them.
 *
 * Chat:    { id, title, createdAt, updatedAt, messages }
 * Message: { role: "user" | "assistant", text, at,
 *            origin?, conceptIds?, level?, error? }   (the extras are on answers)
 *
 * The functions never change their input: they return a new list, ready for React state.
 * The list is newest first.
 */
import { storage } from "../utils/storage.js";

export const MAX_CHATS = 20;
export const MAX_MESSAGES = 30; // per chat
const TITLE_LENGTH = 60;

const KEY = "chats";

/** The saved chats. Anything broken in storage is dropped, never thrown. */
export function loadChats() {
  const saved = storage.get(KEY, []);
  if (!Array.isArray(saved)) return [];
  return saved
    .filter((c) => c && typeof c.id === "string" && Array.isArray(c.messages))
    .map((c) => ({ ...c, messages: c.messages.filter((m) => m && typeof m.text === "string" && (m.role === "user" || m.role === "assistant")) }))
    .slice(0, MAX_CHATS);
}

export const saveChats = (chats) => storage.set(KEY, chats);

/** Short, URL-safe and unique enough for one browser. */
export const newChatId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** The first question, cut at a word, as the chat's name. */
export function titleFor(text) {
  const t = String(text).replace(/\s+/g, " ").trim();
  return t.length <= TITLE_LENGTH ? t : `${t.slice(0, TITLE_LENGTH).replace(/\s+\S*$/, "")}…`;
}

/**
 * Add a message to a chat, creating the chat if it doesn't exist yet.
 * The chat moves to the top; the oldest messages and chats drop off past the limits.
 */
export function addMessage(chats, chatId, message, now = Date.now()) {
  const old = chats.find((c) => c.id === chatId);
  const msg = { ...message, at: now };
  const chat = old
    ? { ...old, updatedAt: now, messages: [...old.messages, msg].slice(-MAX_MESSAGES) }
    : { id: chatId, title: titleFor(message.text), createdAt: now, updatedAt: now, messages: [msg] };
  return [chat, ...chats.filter((c) => c.id !== chatId)].slice(0, MAX_CHATS);
}

export const deleteChat = (chats, chatId) => chats.filter((c) => c.id !== chatId);

export const findChat = (chats, chatId) => chats.find((c) => c.id === chatId) ?? null;
