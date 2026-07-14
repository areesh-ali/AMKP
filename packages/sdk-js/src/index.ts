import type { EvidenceEnvelope } from "@amkp/domain";

export interface AmkpClientOptions {
  baseUrl: string;
  apiKey: string;
}

/** Official TS SDK stub — full path in T-8.2. */
export class AmkpClient {
  constructor(private readonly opts: AmkpClientOptions) {}

  async health(): Promise<{ ok: boolean }> {
    const res = await fetch(`${this.opts.baseUrl}/health`);
    if (!res.ok) throw new Error(`health failed: ${res.status}`);
    return res.json() as Promise<{ ok: boolean }>;
  }

  async retrieve(_query: string): Promise<EvidenceEnvelope> {
    throw new Error("retrieve not implemented — see story T-3.1 / T-8.2");
  }
}
