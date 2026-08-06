import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserChat } from "@/lib/db/chats-repo";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Chat id required" }, { status: 400 });
  }

  try {
    const chat = await getUserChat(userId, id.trim());
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({
      chat: {
        id: chat._id,
        documentId: chat.documentId,
        fileName: chat.fileName,
        title: chat.title,
        createdAt:
          chat.createdAt instanceof Date
            ? chat.createdAt.toISOString()
            : String(chat.createdAt),
        updatedAt:
          chat.updatedAt instanceof Date
            ? chat.updatedAt.toISOString()
            : String(chat.updatedAt),
        messages: (chat.messages ?? []).map((m) => ({
          role: m.role,
          content: m.content,
          createdAt:
            m.createdAt instanceof Date
              ? m.createdAt.toISOString()
              : String(m.createdAt ?? ""),
          sourcePreviews: m.sourcePreviews ?? [],
        })),
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Could not load chat." },
      { status: 500 },
    );
  }
}
