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

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export type { EvidenceEnvelope, TraceRecord };
