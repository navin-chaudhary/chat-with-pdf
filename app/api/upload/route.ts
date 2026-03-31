import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { chunkText } from "@/lib/chunk";
import { saveUserPdfDocument } from "@/lib/db/documents-repo";
import { embedMany } from "@/lib/embeddings";
import { extractPdfText } from "@/lib/extract-pdf-text";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = (await extractPdfText(buffer)).trim();
    if (text.length < 20) {
      return NextResponse.json(
        {
          error:
            "Could not extract enough text. The PDF might be scanned images; try a text-based PDF.",
        },
        { status: 400 },
      );
    }

    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "No usable text chunks from PDF" },
        { status: 400 },
      );
    }

    const embeddings = await embedMany(chunks);
    const id = randomUUID();
    const chunkPayload = chunks.map((c, i) => ({
      text: c,
      embedding: embeddings[i]!,
    }));

    await saveUserPdfDocument({
      userId,
      documentId: id,
      fileName: file.name,
      preview: text.slice(0, 280),
      chunks: chunkPayload,
    });

    return NextResponse.json({
      documentId: id,
      fileName: file.name,
      chunkCount: chunks.length,
      preview: text.slice(0, 280),
    });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Upload failed";
    const status = message.includes("too large") ? 413 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
