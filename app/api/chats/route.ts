import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { listUserChats } from "@/lib/db/chats-repo";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await listUserChats(userId);
    const chats = rows.map((c) => ({
      id: c.id,
      documentId: c.documentId,
      fileName: c.fileName,
      title: c.title,
      messageCount: c.messageCount,
      createdAt:
        c.createdAt instanceof Date
          ? c.createdAt.toISOString()
          : String(c.createdAt),
      updatedAt:
        c.updatedAt instanceof Date
          ? c.updatedAt.toISOString()
          : String(c.updatedAt),
    }));
    return NextResponse.json({ chats });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Could not load chats." },
      { status: 500 },
    );
  }
}
