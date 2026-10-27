/**
 * Development entry point: runs the Express API against a local MongoDB that is
 * downloaded and managed automatically, so the full stack works without
 * installing MongoDB.
 *
 * Data is written to `.data/mongodb`, so accounts and articles survive restarts.
 * For a shared or deployed database set MONGODB_URI (for example a MongoDB Atlas
 * connection string) and run `npm run server` instead.
 */
import path from "node:path";
import fs from "node:fs";
import { MongoMemoryServer } from "mongodb-memory-server";

async function main() {
  const dbPath = path.resolve(process.cwd(), ".data/mongodb");
  fs.mkdirSync(dbPath, { recursive: true });

  console.log("Starting local MongoDB (first run downloads the binary)…");

  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: "devlog",
      dbPath,
      storageEngine: "wiredTiger",
    },
  });

  process.env.MONGODB_URI = mongod.getUri("devlog");
  process.env.JWT_SECRET ??= "dev-only-secret-change-me";

  console.log(`MongoDB ready at ${process.env.MONGODB_URI}`);

  const shutdown = async () => {
    await mongod.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Imported after the environment is prepared: server.ts reads it on startup.
  await import("./server");
}

main().catch((error) => {
  console.error("Could not start the development server:", error);
  process.exit(1);
});
