import type { EvidenceEnvelope, TraceRecord } from "@amkp/domain";

export interface AmkpClientOptions {
  baseUrl: string;
  /** Tenant API key (Bearer). */
  apiKey: string;
  fetch?: typeof fetch;
}

export class AmkpApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`AMKP API ${status}`);
    this.name = "AmkpApiError";
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

  constructor(opts: AmkpClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, "");
    this.apiKey = opts.apiKey;
    this.fetchFn = opts.fetch ?? fetch;
  }

  async health(): Promise<{ ok: boolean; service?: string; adapters?: Record<string, string> }> {
    const res = await this.fetchFn(`${this.baseUrl}/health`);
    if (!res.ok) throw new AmkpApiError(res.status, await safeJson(res));
    return res.json() as Promise<{
      ok: boolean;
      service?: string;
      adapters?: Record<string, string>;
    }>;
  }

  async ready(): Promise<{ ok: boolean; database: string }> {
    const res = await this.fetchFn(`${this.baseUrl}/ready`);
    if (!res.ok) throw new AmkpApiError(res.status, await safeJson(res));
    return res.json() as Promise<{ ok: boolean; database: string }>;
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
  }): Promise<{ documentId: string; jobId: string }> {
    return this.request("POST", "/v1/ingest", input);
  }

  async getTrace(requestId: string): Promise<TraceRecord> {
    return this.request("GET", `/v1/traces/${encodeURIComponent(requestId)}`);
  }

  async listDocuments(): Promise<{ items: unknown[] }> {
    return this.request("GET", "/v1/documents");
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
    status: string;
    version: number;
  }> {
    return this.request(
      "GET",
      `/v1/documents/${encodeURIComponent(documentId)}`,
    );
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

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const res = await this.fetchFn(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        ...(body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw new AmkpApiError(res.status, await safeJson(res));
    }
    return res.json() as Promise<T>;
  }
}

export interface AmkpAdminClientOptions {
  baseUrl: string;
  /** PLATFORM_ADMIN_TOKEN bearer. */
  adminToken: string;
  fetch?: typeof fetch;
}

/** Platform-admin SDK surface (accounts, tenants, audit). */
export class AmkpAdminClient {
  private readonly baseUrl: string;
  private readonly adminToken: string;
  private readonly fetchFn: typeof fetch;

  constructor(opts: AmkpAdminClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, "");
    this.adminToken = opts.adminToken;
    this.fetchFn = opts.fetch ?? fetch;
  }

  async createAccount(name: string): Promise<{ accountId: string; name: string }> {
    return this.request("POST", "/v1/accounts", { name });
  }

  async createTenant(
    accountId: string,
    name: string,
  ): Promise<{ tenantId: string; apiKey: string }> {
    return this.request("POST", `/v1/accounts/${accountId}/tenants`, { name });
  }

  async listAudit(limit = 50): Promise<{ items: unknown[] }> {
    return this.request("GET", `/v1/audit?limit=${encodeURIComponent(String(limit))}`);
  }

  async getTenant(tenantId: string): Promise<unknown> {
    return this.request("GET", `/v1/tenants/${encodeURIComponent(tenantId)}`);
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
        ...(body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw new AmkpApiError(res.status, await safeJson(res));
    }
    return res.json() as Promise<T>;
  }
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export type { EvidenceEnvelope, TraceRecord };
