import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  MCP_PRODUCT_TOOL_MANIFEST,
  type McpRetrieveUseCase,
  type TenantContext,
} from "@amkp/application";
import {
  TenantApiKeyGuard,
  type RequestWithTenant,
} from "../tenancy/tenant-api-key.guard";
import { TenantContextInterceptor } from "../tenancy/tenant-context.interceptor";
import { MCP_RETRIEVE_UC } from "../tenancy/tenancy.tokens";

class McpRetrieveDto {
  query!: string;
  preferCorrectness?: boolean;
  documentIds?: string[];
}

/**
 * Thin MCP Streamable-HTTP-style facade (AD-6 / T-5.3).
 * Product credentials authenticate via Tenant API key; Tenant is never taken from tool params.
 */
@Controller("v1/mcp")
@UseGuards(TenantApiKeyGuard)
@UseInterceptors(TenantContextInterceptor)
export class McpController {
  constructor(
    @Inject(MCP_RETRIEVE_UC) private readonly mcpRetrieve: McpRetrieveUseCase,
  ) {}

  @Get("tools")
  listTools() {
    return MCP_PRODUCT_TOOL_MANIFEST;
  }

  @Post("tools/retrieve")
  @HttpCode(HttpStatus.OK)
  async retrieve(
    @Req() req: RequestWithTenant,
    @Body() body: McpRetrieveDto,
  ) {
    const ctx = req.tenantContext as TenantContext;
    return this.mcpRetrieve.execute(
      ctx,
      {
        query: body.query,
        preferCorrectness: body.preferCorrectness === true,
        documentIds: body.documentIds,
      },
      { requestId: `mcp_${randomUUID()}` },
    );
  }
}
