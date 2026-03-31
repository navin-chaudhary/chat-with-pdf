/** Shared secret for NextAuth JWT and middleware. Keep in sync everywhere. */
export function authSecret(): string {
  const s = process.env.NEXTAUTH_SECRET?.trim();
  if (s) return s;
  /* Next.js sets this during `next build` when env secrets may be absent */
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return "build-time-placeholder-set-NEXTAUTH_SECRET-at-runtime";
  }
  if (process.env.NODE_ENV !== "production") {
    return "dev-only-insecure-change-for-local-testing";
  }
  throw new Error(
    "NEXTAUTH_SECRET is required in production (openssl rand -base64 32)",
  );
}
