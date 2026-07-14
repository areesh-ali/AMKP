import {
  Body,
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
  CreateAccountUseCase,
  CreateTenantUseCase,
  ListTenantsByAccountUseCase,
} from "@amkp/application";
import { PlatformAdminGuard } from "./platform-admin.guard";
import {
  CREATE_ACCOUNT_UC,
  CREATE_TENANT_UC,
  LIST_TENANTS_UC,
} from "./tenancy.tokens";

class CreateAccountDto {
  name!: string;
}

class CreateTenantDto {
  name!: string;
}

@Controller("v1/accounts")
@UseGuards(PlatformAdminGuard)
export class TenancyController {
  constructor(
    @Inject(CREATE_ACCOUNT_UC)
    private readonly createAccount: CreateAccountUseCase,
    @Inject(CREATE_TENANT_UC)
    private readonly createTenant: CreateTenantUseCase,
    @Inject(LIST_TENANTS_UC)
    private readonly listTenants: ListTenantsByAccountUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAccountHandler(@Body() body: CreateAccountDto) {
    const account = await this.createAccount.execute({ name: body.name });
    return {
      accountId: account.id,
      name: account.name,
      createdAt: account.createdAt,
    };
  }

  @Post(":accountId/tenants")
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
      apiKey: result.apiKey,
      createdAt: result.tenant.createdAt,
    };
  }

  @Get(":accountId/tenants")
  async listTenantsHandler(@Param("accountId") accountId: string) {
    const items = await this.listTenants.execute(accountId);
    return {
      items: items.map((t) => ({
        tenantId: t.id,
        accountId: t.accountId,
        name: t.name,
        agenticEnabled: t.agenticEnabled,
        createdAt: t.createdAt,
      })),
    };
  }
}
