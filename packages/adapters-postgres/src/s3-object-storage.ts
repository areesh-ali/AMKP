import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { ObjectStoragePort } from "@amkp/application";
import { LocalFsObjectStorage } from "./local-fs-object-storage";

export interface S3ObjectStorageOptions {
  bucket: string;
  region?: string;
  /** MinIO / custom endpoint */
  endpoint?: string;
  forcePathStyle?: boolean;
  accessKeyId?: string;
  secretAccessKey?: string;
  /** Optional key prefix (e.g. env name). */
  keyPrefix?: string;
}

/**
 * S3-compatible object store (AWS S3, MinIO, R2, etc.).
 */
export class S3ObjectStorage implements ObjectStoragePort {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly keyPrefix: string;

  constructor(options: S3ObjectStorageOptions) {
    this.bucket = options.bucket;
    this.keyPrefix = options.keyPrefix?.replace(/\/$/, "") ?? "";
    this.client = new S3Client({
      region: options.region ?? "us-east-1",
      endpoint: options.endpoint,
      forcePathStyle: options.forcePathStyle ?? Boolean(options.endpoint),
      credentials:
        options.accessKeyId && options.secretAccessKey
          ? {
              accessKeyId: options.accessKeyId,
              secretAccessKey: options.secretAccessKey,
            }
          : undefined,
    });
  }

  private fullKey(key: string): string {
    return this.keyPrefix ? `${this.keyPrefix}/${key}` : key;
  }

  async put(input: {
    key: string;
    bytes: Buffer;
    contentType: string;
  }): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.fullKey(input.key),
        Body: input.bytes,
        ContentType: input.contentType,
      }),
    );
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const out = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: this.fullKey(key),
        }),
      );
      if (!out.Body) return null;
      const bytes = await out.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch (err) {
      const name = (err as { name?: string }).name;
      if (name === "NoSuchKey" || name === "NotFound") return null;
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: this.fullKey(key),
      }),
    );
  }
}

/** Build storage from env: S3 bucket wins over local FS dir. */
export function createObjectStorageFromEnv(): ObjectStoragePort | undefined {
  const bucket = process.env.AMKP_S3_BUCKET?.trim();
  if (bucket) {
    return new S3ObjectStorage({
      bucket,
      region: process.env.AMKP_S3_REGION,
      endpoint: process.env.AMKP_S3_ENDPOINT,
      forcePathStyle: process.env.AMKP_S3_FORCE_PATH_STYLE === "1",
      accessKeyId: process.env.AMKP_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.AMKP_S3_SECRET_ACCESS_KEY,
      keyPrefix: process.env.AMKP_S3_KEY_PREFIX,
    });
  }
  const dir = process.env.AMKP_OBJECT_STORAGE_DIR?.trim();
  if (dir) {
    return new LocalFsObjectStorage(dir);
  }
  return undefined;
}
