import { randomUUID } from "crypto";
import { getDbWithIndexes } from "@/lib/mongodb";

const COL = "chats";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  sourcePreviews?: string[];
};

export type ChatDoc = {
  _id: string;
  userId: string;
  documentId: string;
  fileName: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
};

export type ChatListItem = {
  id: string;
  documentId: string;
  fileName: string;
  title: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
};

function titleFromQuestion(question: string): string {
  const t = question.trim().replace(/\s+/g, " ");
  return t.length > 80 ? `${t.slice(0, 77)}…` : t;
}

export async function createOrAppendChat(params: {
  userId: string;
  chatId?: string | null;
  documentId: string;
  fileName: string;
  userMessage: string;
  assistantMessage: string;
  sourcePreviews?: string[];
}): Promise<{ chatId: string }> {
  const db = await getDbWithIndexes();
  const coll = db.collection<ChatDoc>(COL);
  const now = new Date();

  const userMsg: ChatMessage = {
    role: "user",
    content: params.userMessage,
    createdAt: now,
  };
  const assistantMsg: ChatMessage = {
    role: "assistant",
    content: params.assistantMessage,
    createdAt: now,
    sourcePreviews: params.sourcePreviews,
  };

  if (params.chatId) {
    const existing = await coll.findOne({
      _id: params.chatId,
      userId: params.userId,
    });
    if (existing) {
      await coll.updateOne(
        { _id: params.chatId, userId: params.userId },
        {
          $push: { messages: { $each: [userMsg, assistantMsg] } },
          $set: { updatedAt: now },
        },
      );
      return { chatId: params.chatId };
    }
  }

  const chatId = randomUUID();
  const doc: ChatDoc = {
    _id: chatId,
    userId: params.userId,
    documentId: params.documentId,
    fileName: params.fileName,
    title: titleFromQuestion(params.userMessage),
    messages: [userMsg, assistantMsg],
    createdAt: now,
    updatedAt: now,
  };
  await coll.insertOne(doc);
  return { chatId };
}

export async function listUserChats(userId: string): Promise<ChatListItem[]> {
  const db = await getDbWithIndexes();
  const coll = db.collection<ChatDoc>(COL);
  const rows = await coll
    .aggregate<{
      _id: string;
      documentId: string;
      fileName: string;
      title: string;
      createdAt: Date;
      updatedAt: Date;
      messageCount: number;
    }>([
      { $match: { userId } },
      { $sort: { updatedAt: -1 } },
      { $limit: 100 },
      {
        $project: {
          documentId: 1,
          fileName: 1,
          title: 1,
          createdAt: 1,
          updatedAt: 1,
          messageCount: { $size: { $ifNull: ["$messages", []] } },
        },
      },
    ])
    .toArray();

  return rows.map((r) => ({
    id: String(r._id),
    documentId: r.documentId,
    fileName: r.fileName,
    title: r.title || "Untitled chat",
    messageCount: r.messageCount ?? 0,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function getUserChat(
  userId: string,
  chatId: string,
): Promise<ChatDoc | null> {
  const db = await getDbWithIndexes();
  const coll = db.collection<ChatDoc>(COL);
  return coll.findOne({ _id: chatId, userId });
}
