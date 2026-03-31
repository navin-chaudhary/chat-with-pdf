import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri?.trim()) {
    throw new Error(
      'MONGODB_URI is not set. Add it to your environment (e.g. .env.local).',
    );
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri).connect();
    }
    return global._mongoClientPromise;
  }

  return new MongoClient(uri).connect();
}

export async function getDb() {
  const client = await getMongoClient();
  return client.db(process.env.MONGODB_DB?.trim() || "chatwithpdf");
}

let indexesEnsured = false;

export async function getDbWithIndexes() {
  const db = await getDb();
  if (!indexesEnsured) {
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db
      .collection("documents")
      .createIndex({ userId: 1, createdAt: -1 });
    indexesEnsured = true;
  }
  return db;
}
