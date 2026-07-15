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
  LIST_DOCUMENTS_UC,
} from "../tenancy/tenancy.tokens";

class IngestDto {
  filename!: string;
  contentType?: string;
  /** Base64-encoded document bytes. */
  contentBase64!: string;
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
    // Reject non-base64 garbage that decodes to empty when input was non-empty
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
    });

    return {
      documentId: result.document.id,
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
      filename: d.filename,
      contentType: d.contentType,
      byteSize: d.byteSize,
      status: d.status,
      createdAt: d.createdAt,
    };
  }
}
