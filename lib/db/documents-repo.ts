import { getDbWithIndexes } from "@/lib/mongodb";
import type { StoredChunk } from "@/lib/store";

const COL = "documents";
/** Stay under MongoDB 16MB document limit */
const MAX_DOC_BYTES = 14 * 1024 * 1024;

export type PdfDocumentDoc = {
  _id: string;
  userId: string;
  fileName: string;
  preview: string;
  chunkCount: number;
  chunks: StoredChunk[];
  createdAt: Date;
};

export async function saveUserPdfDocument(params: {
  userId: string;
  documentId: string;
  fileName: string;
  preview: string;
  chunks: StoredChunk[];
}): Promise<void> {
  const db = await getDbWithIndexes();
  const coll = db.collection<PdfDocumentDoc>(COL);
  const doc: PdfDocumentDoc = {
    _id: params.documentId,
    userId: params.userId,
    fileName: params.fileName,
    preview: params.preview,
    chunkCount: params.chunks.length,
    chunks: params.chunks,
    createdAt: new Date(),
  };
  const approxSize = Buffer.byteLength(JSON.stringify(doc), "utf8");
  if (approxSize > MAX_DOC_BYTES) {
    throw new Error(
      "Indexed document is too large to store. Try a shorter PDF or increase chunk size limits.",
    );
  }
  await coll.insertOne(doc);
}

export async function getUserPdfDocument(
  userId: string,
  documentId: string,
): Promise<{ fileName: string; chunks: StoredChunk[] } | null> {
  const db = await getDbWithIndexes();
  const coll = db.collection<PdfDocumentDoc>(COL);
  const doc = await coll.findOne(
    { _id: documentId, userId },
    { projection: { fileName: 1, chunks: 1 } },
  );
  return doc;
}

export async function listUserDocuments(userId: string) {
  const db = await getDbWithIndexes();
  const coll = db.collection<PdfDocumentDoc>(COL);
  return coll
    .find({ userId })
    .project({ chunks: 0 })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
}
