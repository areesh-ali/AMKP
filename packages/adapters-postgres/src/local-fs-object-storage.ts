import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import type { ObjectStoragePort } from "@amkp/application";

/**
 * Local filesystem object store (S3-shaped). Keys are relative paths under root.
 * Rejects path traversal outside the configured root.
 */
export class LocalFsObjectStorage implements ObjectStoragePort {
  constructor(private readonly rootDir: string) {}

  private resolveSafe(key: string): string {
    if (
      !key ||
      key.includes("..") ||
      key.startsWith("/") ||
      key.includes("\0")
    ) {
      throw new Error(`Object key escapes storage root: ${key}`);
    }
    const full = resolve(join(this.rootDir, key));
    const root = resolve(this.rootDir);
    if (full !== root && !full.startsWith(root + sep)) {
      throw new Error(`Object key escapes storage root: ${key}`);
    }
    return full;
  }

  async put(input: {
    key: string;
    bytes: Buffer;
    contentType: string;
  }): Promise<void> {
    void input.contentType;
    const path = this.resolveSafe(input.key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, input.bytes);
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.resolveSafe(key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(this.resolveSafe(key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return;
      throw err;
    }
  }

  async listKeys(prefix: string): Promise<string[]> {
    const root = resolve(this.rootDir);
    const start = prefix
      ? this.resolveSafe(prefix.replace(/\/$/, ""))
      : root;
    const out: string[] = [];
    async function walk(dir: string): Promise<void> {
      let entries;
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") return;
        throw err;
      }
      for (const ent of entries) {
        const full = join(dir, ent.name);
        if (ent.isDirectory()) {
          await walk(full);
        } else if (ent.isFile()) {
          out.push(relative(root, full).split(sep).join("/"));
        }
      }
    }
    await walk(start);
    return out.sort();
  }
}
