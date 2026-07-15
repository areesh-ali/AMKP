import { Global, Module } from "@nestjs/common";
import { createPrismaClient } from "@amkp/adapters-postgres";
import { PRISMA } from "../tenancy/tenancy.tokens";

@Global()
@Module({
  providers: [
    {
      provide: PRISMA,
      useFactory: () => {
        const url = process.env.DATABASE_URL;
        if (!url) {
          throw new Error("DATABASE_URL is required");
        }
        return createPrismaClient(url);
      },
    },
  ],
  exports: [PRISMA],
})
export class PrismaModule {}
