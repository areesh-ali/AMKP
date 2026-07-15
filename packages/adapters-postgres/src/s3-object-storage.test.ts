import { describe, expect, it } from "vitest";
import { S3ObjectStorage } from "./s3-object-storage";

describe("S3ObjectStorage", () => {
  it("constructs with bucket and path-style endpoint defaults", () => {
    const store = new S3ObjectStorage({
      bucket: "amkp-docs",
      endpoint: "http://127.0.0.1:9000",
      accessKeyId: "minio",
      secretAccessKey: "minio123",
    });
    expect(store).toBeInstanceOf(S3ObjectStorage);
  });
});
