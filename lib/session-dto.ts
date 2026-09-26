import type { Message, PracticeSession } from "@/models/PracticeSession";

// 回給前端的資料格式（ObjectId、Date 轉成字串）

export type MessageDTO = {
  id: string;
  role: Message["role"];
  content: string;
  inputType: Message["inputType"];
  createdAt: string;
};

export type SessionDTO = {
  id: string;
  scenarioId: string;
  title: string;
  status: PracticeSession["status"];
  messages: MessageDTO[];
};

export function toMessageDTO(m: Message): MessageDTO {
  return {
    id: m._id.toString(),
    role: m.role,
    content: m.content,
    inputType: m.inputType ?? "text",
    createdAt: new Date(m.createdAt).toISOString(),
  };
}

export function toSessionDTO(s: PracticeSession): SessionDTO {
  return {
    id: s._id.toString(),
    scenarioId: s.topic,
    title: s.title,
    status: s.status,
    messages: s.messages.map(toMessageDTO),
  };
}
