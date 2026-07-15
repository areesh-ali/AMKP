import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import type {
  CreateAccountUseCase,
  CreateTenantUseCase,
  GetTenantUseCase,
  ListTenantsByAccountUseCase,
  UpdateTenantSettingsUseCase,
} from "@amkp/application";
import { PlatformAdminGuard } from "./platform-admin.guard";
import {
  CREATE_ACCOUNT_UC,
  CREATE_TENANT_UC,
  GET_TENANT_UC,
  LIST_TENANTS_UC,
  UPDATE_TENANT_UC,
} from "./tenancy.tokens";

class CreateAccountDto {
  name!: string;
}

class CreateTenantDto {
  name!: string;
}

class UpdateTenantDto {
  pageVisionEnabled?: boolean;
  agenticEnabled?: boolean;
  preferCorrectnessThreshold?: number;
  agenticReadinessPassed?: boolean;
  agenticOverride?: boolean;
  actor?: string;
}

@Controller("v1")
export class TenancyController {
  constructor(
    @Inject(CREATE_ACCOUNT_UC)
    private readonly createAccount: CreateAccountUseCase,
    @Inject(CREATE_TENANT_UC)
    private readonly createTenant: CreateTenantUseCase,
    @Inject(LIST_TENANTS_UC)
    private readonly listTenants: ListTenantsByAccountUseCase,
    @Inject(UPDATE_TENANT_UC)
    private readonly updateTenant: UpdateTenantSettingsUseCase,
    @Inject(GET_TENANT_UC)
    private readonly getTenant: GetTenantUseCase,
  ) {}

  @Post("accounts")
  @UseGuards(PlatformAdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async createAccountHandler(@Body() body: CreateAccountDto) {
    const account = await this.createAccount.execute({ name: body.name });
    return {
      accountId: account.id,
      name: account.name,
      createdAt: account.createdAt,
    };
  }

  @Post("accounts/:accountId/tenants")
  @UseGuards(PlatformAdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async createTenantHandler(
    @Param("accountId") accountId: string,
    @Body() body: CreateTenantDto,
  ) {
    const result = await this.createTenant.execute({
      accountId,
      name: body.name,
    });
    return {
      tenantId: result.tenant.id,
      accountId: result.tenant.accountId,
      name: result.tenant.name,
      agenticEnabled: result.tenant.agenticEnabled,
      pageVisionEnabled: result.tenant.pageVisionEnabled,
      preferCorrectnessThreshold: result.tenant.preferCorrectnessThreshold,
      agenticReadinessPassed: result.tenant.agenticReadinessPassed,
      apiKey: result.apiKey,
      createdAt: result.tenant.createdAt,
    };
  }

  @Get("accounts/:accountId/tenants")
  @UseGuards(PlatformAdminGuard)
  async listTenantsHandler(@Param("accountId") accountId: string) {
    const items = await this.listTenants.execute(accountId);
    return {
      items: items.map((t) => ({
        tenantId: t.id,
        accountId: t.accountId,
        name: t.name,
        agenticEnabled: t.agenticEnabled,
        pageVisionEnabled: t.pageVisionEnabled,
        preferCorrectnessThreshold: t.preferCorrectnessThreshold,
        agenticReadinessPassed: t.agenticReadinessPassed,
        createdAt: t.createdAt,
      })),
    };
  }

  @Get("tenants/:tenantId")
  @UseGuards(PlatformAdminGuard)
  async getTenantHandler(@Param("tenantId") tenantId: string) {
    const tenant = await this.getTenant.execute(tenantId);
    return {
      tenantId: tenant.id,
      accountId: tenant.accountId,
      name: tenant.name,
      agenticEnabled: tenant.agenticEnabled,
      pageVisionEnabled: tenant.pageVisionEnabled,
      preferCorrectnessThreshold: tenant.preferCorrectnessThreshold,
      agenticReadinessPassed: tenant.agenticReadinessPassed,
      agenticMaxHops: tenant.agenticMaxHops,
      agenticMaxCostUsd: tenant.agenticMaxCostUsd,
      vectorNamespace: tenant.vectorNamespace,
      createdAt: tenant.createdAt,
    };
  }

  @Patch("tenants/:tenantId")
  @UseGuards(PlatformAdminGuard)
  async updateTenantHandler(
    @Param("tenantId") tenantId: string,
    @Body() body: UpdateTenantDto,
  ) {
    const tenant = await this.updateTenant.execute({
      tenantId,
      pageVisionEnabled: body.pageVisionEnabled,
      agenticEnabled: body.agenticEnabled,
      preferCorrectnessThreshold: body.preferCorrectnessThreshold,
      agenticReadinessPassed: body.agenticReadinessPassed,
      agenticOverride: body.agenticOverride,
      actor: body.actor,
    });
    return {
      tenantId: tenant.id,
      accountId: tenant.accountId,
      name: tenant.name,
      agenticEnabled: tenant.agenticEnabled,
      pageVisionEnabled: tenant.pageVisionEnabled,
      preferCorrectnessThreshold: tenant.preferCorrectnessThreshold,
      agenticReadinessPassed: tenant.agenticReadinessPassed,
      createdAt: tenant.createdAt,
    };
  }
}
