import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { createOrAppendChat } from "@/lib/db/chats-repo";
import { getUserPdfDocument } from "@/lib/db/documents-repo";
import { embedText } from "@/lib/embeddings";
import { answerWithContext } from "@/lib/groq-chat";
import { topKSimilarMMR } from "@/lib/similarity";

export const runtime = "nodejs";
export const maxDuration = 60;

const TOP_K = 8;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const documentId = body.documentId as string | undefined;
    const question = body.question as string | undefined;
    const chatId =
      typeof body.chatId === "string" && body.chatId.trim()
        ? body.chatId.trim()
        : null;

    if (!documentId || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "documentId and non-empty question are required" },
        { status: 400 },
      );
    }

    const doc = await getUserPdfDocument(userId, documentId);
    if (!doc) {
      return NextResponse.json(
        { error: "Document not found or you do not have access." },
        { status: 404 },
      );
    }

    const trimmed = question.trim();
    const qEmb = await embedText(trimmed);
    const top = topKSimilarMMR(qEmb, doc.chunks, TOP_K);
    const answer = await answerWithContext(
      trimmed,
      top.map((c) => c.text),
    );
    const sourcePreviews = top.map((c) =>
      c.text.length > 220 ? `${c.text.slice(0, 220)}…` : c.text,
    );

    const saved = await createOrAppendChat({
      userId,
      chatId,
      documentId,
      fileName: doc.fileName,
      userMessage: trimmed,
      assistantMessage: answer,
      sourcePreviews,
    });

    return NextResponse.json({
      answer,
      sourcePreviews,
      chatId: saved.chatId,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Chat failed" },
      { status: 500 },
    );
  }
}
