import { AppHeader } from "@/components/AppHeader";
import { ChatWithPdf } from "@/components/ChatWithPdf";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <AppHeader email={session.user.email} active="chat" />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <ChatWithPdf />
      </main>
    </div>
  );
}
