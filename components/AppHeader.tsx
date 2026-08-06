import Link from "next/link";

type AppHeaderProps = {
  email?: string | null;
  active?: "chat" | "history" | "profile";
};

export function AppHeader({ email, active }: AppHeaderProps) {
  const linkClass = (key: AppHeaderProps["active"]) =>
    `rounded-lg px-3 py-2 text-sm transition ${
      active === key
        ? "bg-zinc-800 text-zinc-100"
        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
    }`;

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white"
          >
            P
          </Link>
          <div>
            <p className="font-semibold">PDF Chat Workspace</p>
            {email && (
              <p className="text-xs text-zinc-500">
                Signed in as <span className="text-zinc-300">{email}</span>
              </p>
            )}
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-1">
          <Link href="/" className={linkClass("chat")}>
            New chat
          </Link>
          <Link href="/chats" className={linkClass("history")}>
            Old chats
          </Link>
          <Link href="/profile" className={linkClass("profile")}>
            Profile
          </Link>
          <Link
            href="/api/auth/signout"
            className="ml-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Sign out
          </Link>
        </nav>
      </div>
    </header>
  );
}
