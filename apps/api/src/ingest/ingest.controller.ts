import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import type {
  GetDocumentUseCase,
  IngestDocumentUseCase,
  ListChunksUseCase,
  ListDocumentsUseCase,
  TenantContext,
} from "@amkp/application";
import {
  TenantApiKeyGuard,
  type RequestWithTenant,
} from "../tenancy/tenant-api-key.guard";
import { TenantContextInterceptor } from "../tenancy/tenant-context.interceptor";
import {
  GET_DOCUMENT_UC,
  INGEST_DOCUMENT_UC,
  LIST_CHUNKS_UC,
  LIST_DOCUMENTS_UC,
} from "../tenancy/tenancy.tokens";

class IngestDto {
  filename!: string;
  contentType?: string;
  /** Base64-encoded document bytes. */
  contentBase64!: string;
  /** Stable source identity for versioning (defaults to filename). */
  sourceKey?: string;
}

@Controller("v1")
@UseGuards(TenantApiKeyGuard)
@UseInterceptors(TenantContextInterceptor)
export class IngestController {
  constructor(
    @Inject(INGEST_DOCUMENT_UC)
    private readonly ingest: IngestDocumentUseCase,
    @Inject(LIST_DOCUMENTS_UC)
    private readonly listDocuments: ListDocumentsUseCase,
    @Inject(GET_DOCUMENT_UC)
    private readonly getDocument: GetDocumentUseCase,
    @Inject(LIST_CHUNKS_UC)
    private readonly listChunks: ListChunksUseCase,
  ) {}

  @Post("ingest")
  @HttpCode(HttpStatus.ACCEPTED)
  async ingestHandler(
    @Req() req: RequestWithTenant,
    @Body() body: IngestDto,
  ) {
    const ctx = req.tenantContext as TenantContext;
    let content: Buffer;
    try {
      content = Buffer.from(body.contentBase64 ?? "", "base64");
    } catch {
      content = Buffer.alloc(0);
    }
    if (
      typeof body.contentBase64 === "string" &&
      body.contentBase64.length > 0 &&
      content.length === 0
    ) {
      content = Buffer.alloc(0);
    }

    const result = await this.ingest.execute(ctx, {
      filename: body.filename,
      contentType: body.contentType,
      content,
      sourceKey: body.sourceKey,
    });

    return {
      documentId: result.document.id,
      documentVersionId: result.document.id,
      sourceKey: result.document.sourceKey,
      version: result.document.version,
      contentHash: result.document.contentHash,
      jobId: result.jobId,
      status: result.document.status,
      filename: result.document.filename,
      contentType: result.document.contentType,
      byteSize: result.document.byteSize,
    };
  }

  @Get("documents")
  async listHandler(@Req() req: RequestWithTenant) {
    const ctx = req.tenantContext as TenantContext;
    const items = await this.listDocuments.execute(ctx);
    return {
      items: items.map((d) => ({
        documentId: d.id,
        documentVersionId: d.id,
        sourceKey: d.sourceKey,
        version: d.version,
        contentHash: d.contentHash,
        filename: d.filename,
        contentType: d.contentType,
        byteSize: d.byteSize,
        status: d.status,
        createdAt: d.createdAt,
      })),
    };
  }

  @Get("documents/:documentId")
  async getHandler(
    @Req() req: RequestWithTenant,
    @Param("documentId") documentId: string,
  ) {
    const ctx = req.tenantContext as TenantContext;
    const d = await this.getDocument.execute(ctx, documentId);
    return {
      documentId: d.id,
      documentVersionId: d.id,
      sourceKey: d.sourceKey,
      version: d.version,
      contentHash: d.contentHash,
      filename: d.filename,
      contentType: d.contentType,
      byteSize: d.byteSize,
      status: d.status,
      createdAt: d.createdAt,
    };
  }

  @Get("documents/:documentId/chunks")
  async listChunksHandler(
    @Req() req: RequestWithTenant,
    @Param("documentId") documentId: string,
  ) {
    const ctx = req.tenantContext as TenantContext;
    const items = await this.listChunks.execute(ctx.tenantId, documentId);
    return {
      items: items.map((c) => ({
        chunkId: c.id,
        documentId: c.documentId,
        parseTier: c.parseTier,
        parseConfidence: c.parseConfidence,
        ordinal: c.ordinal,
        content: c.content,
        createdAt: c.createdAt,
        ...(c.table ? { table: c.table } : {}),
      })),
    };
  }
}
