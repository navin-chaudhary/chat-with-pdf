import { AppHeader } from "@/components/AppHeader";
import { ChatWithPdf } from "@/components/ChatWithPdf";
import { authOptions } from "@/lib/auth-options";
import { getUserChat } from "@/lib/db/chats-repo";
import { getUserPdfDocument } from "@/lib/db/documents-repo";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

export default async function ChatDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const chat = await getUserChat(session.user.id, id);
  if (!chat) notFound();

  const docStillExists = Boolean(
    await getUserPdfDocument(session.user.id, chat.documentId),
  );

  const messages = (chat.messages ?? []).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <AppHeader email={session.user.email} active="history" />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4">
          <Link
            href="/chats"
            className="text-sm text-zinc-400 transition hover:text-zinc-200"
          >
            ← Back to old chats
          </Link>
          <p className="mt-2 text-sm text-zinc-500">
            {chat.title}
            {!docStillExists && (
              <span className="ml-2 text-amber-400/90">
                (Document no longer available — history is view-only)
              </span>
            )}
          </p>
        </div>

        <ChatWithPdf
          initial={{
            chatId: chat._id,
            documentId: docStillExists ? chat.documentId : null,
            fileName: chat.fileName,
            messages,
            readOnly: !docStillExists,
          }}
        />
      </main>
    </div>
  );
}
