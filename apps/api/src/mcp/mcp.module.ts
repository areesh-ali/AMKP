import { Module } from "@nestjs/common";
import {
  McpRetrieveUseCase,
  type RetrieveUseCase,
} from "@amkp/application";
import { AuthModule } from "../auth/auth.module";
import { RetrieveModule } from "../retrieve/retrieve.module";
import { MCP_RETRIEVE_UC, RETRIEVE_UC } from "../tenancy/tenancy.tokens";
import { McpController } from "./mcp.controller";

@Module({
  imports: [AuthModule, RetrieveModule],
  controllers: [McpController],
  providers: [
    {
      provide: MCP_RETRIEVE_UC,
      useFactory: (retrieve: RetrieveUseCase) =>
        new McpRetrieveUseCase(retrieve),
      inject: [RETRIEVE_UC],
    },
  ],
  exports: [MCP_RETRIEVE_UC],
})
export class McpModule {}
