import { AppHeader } from "@/components/AppHeader";
import { authOptions } from "@/lib/auth-options";
import { getUserProfile } from "@/lib/db/users-repo";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getUserProfile(session.user.id);
  const name = profile?.name || session.user.name || "—";
  const email = profile?.email || session.user.email || "—";
  const joined = profile?.createdAt
    ? profile.createdAt.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const initial = (name !== "—" ? name : email !== "—" ? email : "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <AppHeader email={session.user.email} active="profile" />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Your profile</h1>
            <p className="text-sm text-zinc-400">
              Account details for your PDF chat workspace.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl shadow-black/20">
            <div className="mb-6 flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-xl font-bold text-white">
                {initial}
              </span>
              <div>
                <p className="text-lg font-medium text-zinc-100">{name}</p>
                <p className="text-sm text-zinc-500">{email}</p>
              </div>
            </div>

            <dl className="space-y-4 border-t border-zinc-800 pt-5">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Name
                </dt>
                <dd className="mt-1 text-sm text-zinc-200">{name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Email
                </dt>
                <dd className="mt-1 text-sm text-zinc-200">{email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Member since
                </dt>
                <dd className="mt-1 text-sm text-zinc-200">{joined}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Start new chat
            </Link>
            <Link
              href="/chats"
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              View old chats
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
