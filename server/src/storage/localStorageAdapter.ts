import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { env } from "../config/env";
import type { StorageAdapter, SavedFile } from "./storageAdapter";

const ROOT = path.resolve(process.cwd(), env.UPLOAD_DIR);

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Disk-backed implementation of StorageAdapter. Keys are relative paths
 * under UPLOAD_DIR (e.g. "applications/photo/abc123.jpg"), which keeps this
 * swappable for an S3StorageAdapter later — callers only ever see `key`.
 */
export const localStorageAdapter: StorageAdapter = {
  async save(namespace, filename, data): Promise<SavedFile> {
    const dir = path.join(ROOT, namespace);
    await ensureDir(dir);
    const uniqueName = `${crypto.randomUUID()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const key = path.posix.join(namespace, uniqueName);
    await fs.writeFile(path.join(ROOT, key), data);
    return { key, size: data.length };
  },

  async read(key): Promise<Buffer> {
    return fs.readFile(path.join(ROOT, key));
  },

  async remove(key): Promise<void> {
    await fs.rm(path.join(ROOT, key), { force: true });
  },
};
