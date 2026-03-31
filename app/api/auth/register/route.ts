import { hash } from "bcryptjs";
import { MongoServerError } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getDbWithIndexes } from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation/auth";

export const runtime = "nodejs";

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return `register:${ip}`;
}

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(clientKey(req), 8, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many signup attempts. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limited.retryAfterMs / 1000)),
        },
      },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(". ");
    return NextResponse.json({ error: msg || "Invalid input" }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  try {
    const passwordHash = await hash(password, 12);
    const db = await getDbWithIndexes();
    await db.collection("users").insertOne({
      email,
      name,
      passwordHash,
      createdAt: new Date(),
    });
  } catch (e) {
    if (e instanceof MongoServerError && e.code === 11000) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }
    console.error(e);
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
