import type {
  CostEstimate,
  EvidenceEnvelope,
  EvidenceItem,
  TraceHopStep,
  TraceRecord,
} from "@amkp/domain";

export interface AmkpClientOptions {
  baseUrl: string;
  /** Tenant API key (Bearer). */
  apiKey: string;
  fetch?: typeof fetch;
  /** Optional caller request id forwarded as `x-request-id`. */
  requestId?: string;
}

export class AmkpApiError extends Error {
  readonly requestId: string | null;

  constructor(
    readonly status: number,
    readonly body: unknown,
    requestId?: string | null,
  ) {
    super(`AMKP API ${status}`);
    this.name = "AmkpApiError";
    this.requestId = requestId ?? extractRequestId(body);
  }
}

/**
 * Official TypeScript SDK (T-8.2 / FR-25).
 * Covers auth/me, ingest, retrieve, and trace get for the <60-minute path.
 */
export class AmkpClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetchFn: typeof fetch;
  private readonly requestId?: string;

  constructor(opts: AmkpClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, "");
    this.apiKey = opts.apiKey;
    this.fetchFn = opts.fetch ?? fetch;
    this.requestId = opts.requestId;
  }

  async health(): Promise<{ ok: boolean; service?: string; adapters?: Record<string, string> }> {
    const res = await this.fetchFn(`${this.baseUrl}/health`);
    if (!res.ok) throw await this.toApiError(res);
    return res.json() as Promise<{
      ok: boolean;
      service?: string;
      adapters?: Record<string, string>;
    }>;
  }

  async ready(): Promise<{
    ok: boolean;
    database: string;
    redis?: string;
  }> {
    const res = await this.fetchFn(`${this.baseUrl}/ready`);
    if (!res.ok) throw await this.toApiError(res);
    return res.json() as Promise<{
      ok: boolean;
      database: string;
      redis?: string;
    }>;
  }

  async me(): Promise<{ tenantId: string; accountId: string }> {
    return this.request("GET", "/v1/me");
  }

  async retrieve(input: {
    query: string;
    preferCorrectness?: boolean;
    mode?: "single_pass" | "agentic";
  }): Promise<EvidenceEnvelope> {
    return this.request("POST", "/v1/retrieve", input);
  }

  async ingest(input: {
    filename: string;
    contentType: string;
    contentBase64: string;
    sourceKey?: string;
    idempotencyKey?: string;
  }): Promise<{
    documentId: string;
    jobId: string;
    deduped?: boolean;
  }> {
    return this.request("POST", "/v1/ingest", input, {
      idempotencyKey: input.idempotencyKey,
    });
  }

  /** Multipart upload (field name `file`). */
  async ingestUpload(input: {
    file: Blob | Buffer | Uint8Array;
    filename: string;
    sourceKey?: string;
    contentType?: string;
    idempotencyKey?: string;
  }): Promise<{ documentId: string; jobId: string; deduped?: boolean }> {
    const form = new FormData();
    const blob =
      input.file instanceof Blob
        ? input.file
        : new Blob([Uint8Array.from(input.file)], {
            type: input.contentType ?? "application/octet-stream",
          });
    form.append("file", blob, input.filename);
    if (input.sourceKey) form.append("sourceKey", input.sourceKey);
    if (input.filename) form.append("filename", input.filename);

    const res = await this.fetchFn(`${this.baseUrl}/v1/ingest/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        ...this.requestIdHeaders(),
        ...(input.idempotencyKey
          ? { "Idempotency-Key": input.idempotencyKey }
          : {}),
      },
      body: form,
    });
    if (!res.ok) {
      throw await this.toApiError(res);
    }
    return res.json() as Promise<{
      documentId: string;
      jobId: string;
      deduped?: boolean;
    }>;
  }

  async getTrace(requestId: string): Promise<TraceRecord> {
    return this.request("GET", `/v1/traces/${encodeURIComponent(requestId)}`);
  }

  async listDocuments(options?: {
    limit?: number;
    offset?: number;
    cursor?: string;
    status?: string;
    sourceKey?: string;
  }): Promise<{
    items: unknown[];
    total: number;
    limit: number;
    offset: number;
    nextCursor: string | null;
  }> {
    const q = new URLSearchParams();
    if (options?.limit !== undefined) q.set("limit", String(options.limit));
    if (options?.offset !== undefined) q.set("offset", String(options.offset));
    if (options?.cursor) q.set("cursor", options.cursor);
    if (options?.status) q.set("status", options.status);
    if (options?.sourceKey) q.set("sourceKey", options.sourceKey);
    const qs = q.toString();
    return this.request("GET", `/v1/documents${qs ? `?${qs}` : ""}`);
  }

  async listDocumentVersions(
    sourceKey: string,
  ): Promise<{ sourceKey: string; items: unknown[] }> {
    return this.request(
      "GET",
      `/v1/documents/versions?sourceKey=${encodeURIComponent(sourceKey)}`,
    );
  }

  async pruneDocumentVersions(input: {
    sourceKey: string;
    keep?: number;
  }): Promise<{ sourceKey: string; kept: number; deleted: string[] }> {
    return this.request("POST", "/v1/documents/versions/prune", input);
  }

  async listDocumentChunks(
    documentId: string,
  ): Promise<{ items: unknown[] }> {
    return this.request(
      "GET",
      `/v1/documents/${encodeURIComponent(documentId)}/chunks`,
    );
  }

  async deleteDocument(
    documentId: string,
  ): Promise<{ documentId: string; deleted: true }> {
    return this.request(
      "DELETE",
      `/v1/documents/${encodeURIComponent(documentId)}`,
    );
  }

  async getDocument(documentId: string): Promise<{
    documentId: string;
    documentVersionId?: string;
    sourceKey?: string;
    status: string;
    version: number;
    contentHash?: string;
    filename?: string;
    contentType?: string;
    byteSize?: number;
    createdAt?: string;
  }> {
    return this.request(
      "GET",
      `/v1/documents/${encodeURIComponent(documentId)}`,
    );
  }

  async getDocumentContent(documentId: string): Promise<ArrayBuffer> {
    const res = await this.fetchFn(
      `${this.baseUrl}/v1/documents/${encodeURIComponent(documentId)}/content`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          ...this.requestIdHeaders(),
        },
      },
    );
    if (!res.ok) {
      throw await this.toApiError(res);
    }
    return res.arrayBuffer();
  }

  /** Poll until Document status is terminal or timeout. */
  async waitForDocument(
    documentId: string,
    options?: {
      intervalMs?: number;
      timeoutMs?: number;
      terminal?: string[];
    },
  ): Promise<{ documentId: string; status: string; version: number }> {
    const intervalMs = options?.intervalMs ?? 500;
    const timeoutMs = options?.timeoutMs ?? 30_000;
    const terminal = new Set(
      options?.terminal ?? ["parsed", "failed", "error"],
    );
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const doc = await this.getDocument(documentId);
      if (terminal.has(doc.status)) return doc;
      if (Date.now() >= deadline) {
        throw new AmkpApiError(408, {
          error: {
            code: "DOCUMENT_WAIT_TIMEOUT",
            message: `Document ${documentId} still ${doc.status}`,
            request_id: documentId,
          },
        });
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  async reparseDocument(
    documentId: string,
  ): Promise<{ documentId: string; jobId: string; status: string }> {
    return this.request(
      "POST",
      `/v1/documents/${encodeURIComponent(documentId)}/reparse`,
    );
  }

  async listMcpTools(): Promise<unknown> {
    return this.request("GET", "/v1/mcp/tools");
  }

  async mcpRetrieve(input: {
    query: string;
    preferCorrectness?: boolean;
    documentIds?: string[];
  }): Promise<EvidenceEnvelope> {
    return this.request("POST", "/v1/mcp/tools/retrieve", input);
  }

  async runGoldenEval(input: {
    questions: Array<{
      id: string;
      question: string;
      expectedDocumentIds?: string[];
      expectedKeywords?: string[];
    }>;
    judge?: { kind: "lexical_stub" | "llm"; modelId?: string };
  }): Promise<unknown> {
    return this.request("POST", "/v1/eval/golden-set", input);
  }

  async runTableRankEval(input: { queries: string[] }): Promise<unknown> {
    return this.request("POST", "/v1/eval/table-rank", input);
  }

  private requestIdHeaders(): Record<string, string> {
    return this.requestId ? { "x-request-id": this.requestId } : {};
  }

  private async toApiError(res: Response): Promise<AmkpApiError> {
    const body = await safeJson(res);
    const headerId = res.headers.get("x-request-id");
    return new AmkpApiError(res.status, body, headerId);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    opts?: { idempotencyKey?: string },
  ): Promise<T> {
    const payload =
      body && typeof body === "object" && "idempotencyKey" in (body as object)
        ? (() => {
            const { idempotencyKey: _k, ...rest } = body as Record<
              string,
              unknown
            >;
            return rest;
          })()
        : body;
    const res = await this.fetchFn(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        ...this.requestIdHeaders(),
        ...(opts?.idempotencyKey
          ? { "Idempotency-Key": opts.idempotencyKey }
          : {}),
        ...(payload !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body: payload !== undefined ? JSON.stringify(payload) : undefined,
    });
    if (!res.ok) {
      throw await this.toApiError(res);
    }
    return res.json() as Promise<T>;
  }
}

export interface AmkpAdminClientOptions {
  baseUrl: string;
  /** PLATFORM_ADMIN_TOKEN bearer. */
  adminToken: string;
  fetch?: typeof fetch;
  requestId?: string;
}

/** Platform-admin SDK surface (accounts, tenants, audit). */
export class AmkpAdminClient {
  private readonly baseUrl: string;
  private readonly adminToken: string;
  private readonly fetchFn: typeof fetch;
  private readonly requestId?: string;

  constructor(opts: AmkpAdminClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, "");
    this.adminToken = opts.adminToken;
    this.fetchFn = opts.fetch ?? fetch;
    this.requestId = opts.requestId;
  }

  async health(): Promise<{
    ok: boolean;
    service?: string;
    adapters?: Record<string, string>;
  }> {
    const res = await this.fetchFn(`${this.baseUrl}/health`);
    if (!res.ok) throw await this.toApiError(res);
    return res.json() as Promise<{
      ok: boolean;
      service?: string;
      adapters?: Record<string, string>;
    }>;
  }

  async ready(): Promise<{
    ok: boolean;
    database: string;
    redis?: string;
  }> {
    const res = await this.fetchFn(`${this.baseUrl}/ready`);
    if (!res.ok) throw await this.toApiError(res);
    return res.json() as Promise<{
      ok: boolean;
      database: string;
      redis?: string;
    }>;
  }

  async createAccount(name: string): Promise<{ accountId: string; name: string }> {
    return this.request("POST", "/v1/accounts", { name });
  }

  async listAccounts(limit = 100): Promise<{ items: unknown[] }> {
    return this.request(
      "GET",
      `/v1/accounts?limit=${encodeURIComponent(String(limit))}`,
    );
  }

  async getAccount(
    accountId: string,
  ): Promise<{ accountId: string; name: string; createdAt?: string }> {
    return this.request(
      "GET",
      `/v1/accounts/${encodeURIComponent(accountId)}`,
    );
  }

  async createTenant(
    accountId: string,
    name: string,
  ): Promise<{ tenantId: string; apiKey: string }> {
    return this.request("POST", `/v1/accounts/${accountId}/tenants`, { name });
  }

  async listAudit(
    limit = 50,
    opts?: { tenantId?: string },
  ): Promise<{ items: unknown[] }> {
    const q = new URLSearchParams();
    q.set("limit", String(limit));
    if (opts?.tenantId) q.set("tenantId", opts.tenantId);
    return this.request("GET", `/v1/audit?${q.toString()}`);
  }

  async listTenants(opts?: {
    accountId?: string;
    limit?: number;
  }): Promise<{ items: unknown[] }> {
    const q = new URLSearchParams();
    if (opts?.accountId) q.set("accountId", opts.accountId);
    if (opts?.limit !== undefined) q.set("limit", String(opts.limit));
    const qs = q.toString();
    return this.request("GET", `/v1/tenants${qs ? `?${qs}` : ""}`);
  }

  async getTenant(tenantId: string): Promise<unknown> {
    return this.request("GET", `/v1/tenants/${encodeURIComponent(tenantId)}`);
  }

  async updateTenant(
    tenantId: string,
    body: {
      pageVisionEnabled?: boolean;
      agenticEnabled?: boolean;
      preferCorrectnessThreshold?: number;
      agenticReadinessPassed?: boolean;
      agenticOverride?: boolean;
      actor?: string;
    },
  ): Promise<unknown> {
    return this.request(
      "PATCH",
      `/v1/tenants/${encodeURIComponent(tenantId)}`,
      body,
    );
  }

  async createApiKey(tenantId: string): Promise<{
    apiKeyId: string;
    tenantId: string;
    apiKey: string;
    createdAt: string;
  }> {
    return this.request(
      "POST",
      `/v1/tenants/${encodeURIComponent(tenantId)}/api-keys`,
    );
  }

  async listApiKeys(tenantId: string): Promise<{ items: unknown[] }> {
    return this.request(
      "GET",
      `/v1/tenants/${encodeURIComponent(tenantId)}/api-keys`,
    );
  }

  async revokeApiKey(
    tenantId: string,
    apiKeyId: string,
  ): Promise<{ apiKeyId: string; tenantId: string; revokedAt: string | null }> {
    return this.request(
      "POST",
      `/v1/tenants/${encodeURIComponent(tenantId)}/api-keys/${encodeURIComponent(apiKeyId)}/revoke`,
    );
  }

  async rotateApiKey(
    tenantId: string,
    apiKeyId: string,
  ): Promise<{
    apiKeyId: string;
    tenantId: string;
    apiKey: string;
    revokedApiKeyId: string;
    createdAt: string;
  }> {
    return this.request(
      "POST",
      `/v1/tenants/${encodeURIComponent(tenantId)}/api-keys/${encodeURIComponent(apiKeyId)}/rotate`,
    );
  }

  async sweepOrphanObjects(opts?: {
    dryRun?: boolean;
    prefix?: string;
  }): Promise<{
    scanned: number;
    orphaned: string[];
    deleted: string[];
    dryRun: boolean;
  }> {
    return this.request("POST", "/v1/admin/storage/sweep-orphans", opts ?? {});
  }

  private requestIdHeaders(): Record<string, string> {
    return this.requestId ? { "x-request-id": this.requestId } : {};
  }

  private async toApiError(res: Response): Promise<AmkpApiError> {
    const body = await safeJson(res);
    const headerId = res.headers.get("x-request-id");
    return new AmkpApiError(res.status, body, headerId);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const res = await this.fetchFn(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.adminToken}`,
        ...this.requestIdHeaders(),
        ...(body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw await this.toApiError(res);
    }
    return res.json() as Promise<T>;
  }
}

function extractRequestId(body: unknown): string | null {
  if (
    body &&
    typeof body === "object" &&
    "error" in body &&
    body.error &&
    typeof body.error === "object" &&
    "request_id" in body.error
  ) {
    const id = (body.error as { request_id?: unknown }).request_id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export type {
  CostEstimate,
  EvidenceEnvelope,
  EvidenceItem,
  TraceHopStep,
  TraceRecord,
};
