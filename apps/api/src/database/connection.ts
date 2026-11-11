import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { initializeSchema } from "./schema.ts";

export function openDatabase(filename: string): DatabaseSync {
  if (filename !== ":memory:")
    mkdirSync(path.dirname(filename), { recursive: true });
  const database = new DatabaseSync(filename);
  try {
    database.exec(
      "PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;",
    );
    initializeSchema(database);
    return database;
  } catch (error) {
    database.close();
    throw error;
  }
}
