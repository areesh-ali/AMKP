import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import type {
  CreateApiKeyUseCase,
  ListApiKeysUseCase,
  RevokeApiKeyUseCase,
  RotateApiKeyUseCase,
} from "@amkp/application";
import { PlatformAdminGuard } from "./platform-admin.guard";
import {
  CREATE_API_KEY_UC,
  LIST_API_KEYS_UC,
  REVOKE_API_KEY_UC,
  ROTATE_API_KEY_UC,
} from "./tenancy.tokens";

@Controller("v1/tenants/:tenantId/api-keys")
@UseGuards(PlatformAdminGuard)
export class ApiKeysController {
  constructor(
    @Inject(CREATE_API_KEY_UC)
    private readonly createApiKey: CreateApiKeyUseCase,
    @Inject(LIST_API_KEYS_UC)
    private readonly listApiKeys: ListApiKeysUseCase,
    @Inject(REVOKE_API_KEY_UC)
    private readonly revokeApiKey: RevokeApiKeyUseCase,
    @Inject(ROTATE_API_KEY_UC)
    private readonly rotateApiKey: RotateApiKeyUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Param("tenantId") tenantId: string) {
    const issued = await this.createApiKey.execute(tenantId);
    return {
      apiKeyId: issued.apiKeyId,
      tenantId: issued.tenantId,
      apiKey: issued.plaintext,
      createdAt: new Date().toISOString(),
    };
  }

  @Get()
  async list(@Param("tenantId") tenantId: string) {
    const items = await this.listApiKeys.execute(tenantId);
    return {
      items: items.map((k) => ({
        apiKeyId: k.id,
        tenantId: k.tenantId,
        prefix: k.prefix,
        createdAt: k.createdAt,
        revokedAt: k.revokedAt,
      })),
    };
  }

  @Post(":apiKeyId/revoke")
  @HttpCode(HttpStatus.OK)
  async revoke(
    @Param("tenantId") tenantId: string,
    @Param("apiKeyId") apiKeyId: string,
  ) {
    const record = await this.revokeApiKey.execute({ tenantId, apiKeyId });
    return {
      apiKeyId: record.id,
      tenantId: record.tenantId,
      revokedAt: record.revokedAt,
    };
  }

  @Post(":apiKeyId/rotate")
  @HttpCode(HttpStatus.CREATED)
  async rotate(
    @Param("tenantId") tenantId: string,
    @Param("apiKeyId") apiKeyId: string,
  ) {
    const result = await this.rotateApiKey.execute({ tenantId, apiKeyId });
    return {
      apiKeyId: result.issued.apiKeyId,
      tenantId: result.issued.tenantId,
      apiKey: result.issued.plaintext,
      revokedApiKeyId: result.revokedApiKeyId,
      createdAt: new Date().toISOString(),
    };
  }
}
