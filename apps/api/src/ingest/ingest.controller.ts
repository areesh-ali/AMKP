import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Res,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import type {
  DeleteDocumentUseCase,
  GetDocumentContentUseCase,
  GetDocumentUseCase,
  IngestDocumentUseCase,
  ListChunksUseCase,
  ListDocumentVersionsUseCase,
  ListDocumentsUseCase,
  ReparseDocumentUseCase,
  TenantContext,
} from "@amkp/application";
import {
  TenantApiKeyGuard,
  type RequestWithTenant,
} from "../tenancy/tenant-api-key.guard";
import { TenantContextInterceptor } from "../tenancy/tenant-context.interceptor";
import { TenantRateLimitInterceptor } from "../common/tenant-rate-limit.interceptor";
import {
  DELETE_DOCUMENT_UC,
  GET_DOCUMENT_CONTENT_UC,
  GET_DOCUMENT_UC,
  INGEST_DOCUMENT_UC,
  LIST_CHUNKS_UC,
  LIST_DOCUMENT_VERSIONS_UC,
  LIST_DOCUMENTS_UC,
  REPARSE_DOCUMENT_UC,
} from "../tenancy/tenancy.tokens";

class IngestDto {
  filename!: string;
  contentType?: string;
  /** Base64-encoded document bytes. */
  contentBase64!: string;
  /** Stable source identity for versioning (defaults to filename). */
  sourceKey?: string;
}

function mapIngestResult(result: {
  document: {
    id: string;
    sourceKey: string;
    version: number;
    contentHash: string;
    status: string;
    filename: string;
    contentType: string;
    byteSize: number;
  };
  jobId: string;
}) {
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
    deduped: String(result.jobId).startsWith("noop_"),
  };
}

function maxUploadBytes(): number {
  const raw = Number(process.env.AMKP_MAX_DOCUMENT_BYTES ?? 10 * 1024 * 1024);
  return Number.isFinite(raw) && raw > 0 ? raw : 10 * 1024 * 1024;
}

@Controller("v1")
@UseGuards(TenantApiKeyGuard)
@UseInterceptors(TenantContextInterceptor, TenantRateLimitInterceptor)
export class IngestController {
  constructor(
    @Inject(INGEST_DOCUMENT_UC)
    private readonly ingest: IngestDocumentUseCase,
    @Inject(DELETE_DOCUMENT_UC)
    private readonly deleteDocument: DeleteDocumentUseCase,
    @Inject(REPARSE_DOCUMENT_UC)
    private readonly reparseDocument: ReparseDocumentUseCase,
    @Inject(LIST_DOCUMENTS_UC)
    private readonly listDocuments: ListDocumentsUseCase,
    @Inject(LIST_DOCUMENT_VERSIONS_UC)
    private readonly listDocumentVersions: ListDocumentVersionsUseCase,
    @Inject(GET_DOCUMENT_UC)
    private readonly getDocument: GetDocumentUseCase,
    @Inject(GET_DOCUMENT_CONTENT_UC)
    private readonly getDocumentContent: GetDocumentContentUseCase,
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

    return mapIngestResult(result);
  }

  /**
   * Multipart ingest: field `file` (required), optional `sourceKey` / `filename`.
   * Prefer this over base64 JSON for large documents.
   */
  @Post("ingest/upload")
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: maxUploadBytes() },
    }),
  )
  async ingestUploadHandler(
    @Req() req: RequestWithTenant,
    @UploadedFile()
    file:
      | {
          originalname?: string;
          mimetype?: string;
          buffer: Buffer;
          size: number;
        }
      | undefined,
    @Body() body: { sourceKey?: string; filename?: string },
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException({
        error: {
          code: "VALIDATION_ERROR",
          message: "multipart field 'file' is required",
        },
      });
    }
    const ctx = req.tenantContext as TenantContext;
    const filename =
      (typeof body.filename === "string" && body.filename.trim()) ||
      file.originalname ||
      "upload.bin";
    const result = await this.ingest.execute(ctx, {
      filename,
      contentType: file.mimetype || "application/octet-stream",
      content: file.buffer,
      sourceKey:
        typeof body.sourceKey === "string" ? body.sourceKey : undefined,
    });
    return mapIngestResult(result);
  }

  @Get("documents")
  async listHandler(
    @Req() req: RequestWithTenant,
    @Query("limit") limitRaw?: string,
    @Query("offset") offsetRaw?: string,
    @Query("cursor") cursorRaw?: string,
    @Query("status") statusRaw?: string,
  ) {
    const ctx = req.tenantContext as TenantContext;
    const limit =
      limitRaw === undefined || limitRaw === ""
        ? undefined
        : Number(limitRaw);
    const offset =
      offsetRaw === undefined || offsetRaw === ""
        ? undefined
        : Number(offsetRaw);
    const page = await this.listDocuments.execute(ctx, {
      limit,
      offset,
      cursor: cursorRaw || undefined,
      status: statusRaw || undefined,
    });
    return {
      items: page.items.map((d) => ({
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
      total: page.total,
      offset: page.offset,
      limit: page.limit,
      nextCursor: page.nextCursor,
    };
  }

  @Get("documents/versions")
  async listVersionsHandler(
    @Req() req: RequestWithTenant,
    @Query("sourceKey") sourceKey?: string,
  ) {
    const ctx = req.tenantContext as TenantContext;
    const items = await this.listDocumentVersions.execute(
      ctx,
      sourceKey ?? "",
    );
    return {
      sourceKey: (sourceKey ?? "").trim(),
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

  @Get("documents/:documentId/content")
  async getContentHandler(
    @Req() req: RequestWithTenant,
    @Param("documentId") documentId: string,
    @Res() res: Response,
  ) {
    const ctx = req.tenantContext as TenantContext;
    const file = await this.getDocumentContent.execute(ctx, documentId);
    res.setHeader("Content-Type", file.contentType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.filename.replace(/"/g, "")}"`,
    );
    res.setHeader("Content-Length", String(file.content.length));
    res.status(HttpStatus.OK).send(file.content);
  }

  @Delete("documents/:documentId")
  @HttpCode(HttpStatus.OK)
  async deleteHandler(
    @Req() req: RequestWithTenant,
    @Param("documentId") documentId: string,
  ) {
    const ctx = req.tenantContext as TenantContext;
    return this.deleteDocument.execute(ctx, documentId);
  }

  @Post("documents/:documentId/reparse")
  @HttpCode(HttpStatus.ACCEPTED)
  async reparseHandler(
    @Req() req: RequestWithTenant,
    @Param("documentId") documentId: string,
  ) {
    const ctx = req.tenantContext as TenantContext;
    return this.reparseDocument.execute(ctx, documentId);
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
