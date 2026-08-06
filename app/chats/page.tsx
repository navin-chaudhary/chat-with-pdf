import { AppHeader } from "@/components/AppHeader";
import { authOptions } from "@/lib/auth-options";
import { listUserChats } from "@/lib/db/chats-repo";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

function formatWhen(value: Date | string) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ChatsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const chats = await listUserChats(session.user.id);

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <AppHeader email={session.user.email} active="history" />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight">Old chats</h1>
              <p className="text-sm text-zinc-400">
                Open a past conversation to see everything you asked.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              New chat
            </Link>
          </div>

          {chats.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-5 py-10 text-center">
              <p className="text-sm text-zinc-400">
                No saved chats yet. Upload a PDF and ask a question to start one.
              </p>
              <Link
                href="/"
                className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                Go to workspace →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-800 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
              {chats.map((chat) => (
                <li key={chat.id}>
                  <Link
                    href={`/chats/${chat.id}`}
                    className="block px-4 py-4 transition hover:bg-zinc-900/80 sm:px-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate font-medium text-zinc-100">
                          {chat.title}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {chat.fileName} · {chat.messageCount} message
                          {chat.messageCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <time className="shrink-0 text-xs text-zinc-500">
                        {formatWhen(chat.updatedAt)}
                      </time>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
