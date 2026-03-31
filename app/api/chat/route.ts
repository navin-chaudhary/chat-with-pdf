import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
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

    const qEmb = await embedText(question.trim());
    const top = topKSimilarMMR(qEmb, doc.chunks, TOP_K);
    const answer = await answerWithContext(
      question.trim(),
      top.map((c) => c.text),
    );

    return NextResponse.json({
      answer,
      sourcePreviews: top.map((c) =>
        c.text.length > 220 ? `${c.text.slice(0, 220)}…` : c.text,
      ),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Chat failed" },
      { status: 500 },
    );
  }
}
