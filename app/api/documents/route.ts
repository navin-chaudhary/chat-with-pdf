import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { listUserDocuments } from "@/lib/db/documents-repo";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await listUserDocuments(userId);
    const documents = rows.map((d) => ({
      id: String(d._id),
      fileName: d.fileName as string,
      preview: (d.preview as string) ?? "",
      chunkCount: (d.chunkCount as number) ?? 0,
      createdAt:
        d.createdAt instanceof Date
          ? d.createdAt.toISOString()
          : String(d.createdAt),
    }));
    return NextResponse.json({ documents });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Could not load documents." },
      { status: 500 },
    );
  }
}
