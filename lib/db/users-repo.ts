import { ObjectId } from "mongodb";
import { getDbWithIndexes } from "@/lib/mongodb";

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  createdAt: Date | null;
};

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!ObjectId.isValid(userId)) return null;

  const db = await getDbWithIndexes();
  const user = await db.collection("users").findOne(
    { _id: new ObjectId(userId) },
    { projection: { email: 1, name: 1, createdAt: 1 } },
  );
  if (!user) return null;

  return {
    id: user._id.toString(),
    email: String(user.email ?? ""),
    name: String(user.name ?? ""),
    createdAt: user.createdAt instanceof Date ? user.createdAt : null,
  };
}
