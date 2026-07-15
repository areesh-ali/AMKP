import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
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
}
