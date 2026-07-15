import { Module } from "@nestjs/common";
import {
  DOCUMENT_REPOSITORY,
  GetTraceUseCase,
  OBJECT_STORAGE,
  SweepOrphanObjectsUseCase,
  TRACE_REPOSITORY,
  type DocumentRepository,
  type ObjectStoragePort,
  type TraceRepository,
} from "@amkp/application";
import { createObjectStorageFromEnv } from "@amkp/adapters-postgres";
import { AuthModule } from "../auth/auth.module";
import { PersistenceModule } from "../infrastructure/persistence.module";
import {
  GET_TRACE_UC,
  SWEEP_ORPHAN_OBJECTS_UC,
} from "../tenancy/tenancy.tokens";
import { TraceController } from "./trace.controller";
import { MetricsController } from "./metrics.controller";
import { AuditController } from "./audit.controller";
import { StorageAdminController } from "./storage-admin.controller";

const sharedObjectStorage = createObjectStorageFromEnv();

@Module({
  imports: [PersistenceModule, AuthModule],
  controllers: [
    TraceController,
    MetricsController,
    AuditController,
    StorageAdminController,
  ],
  providers: [
    {
      provide: GET_TRACE_UC,
      useFactory: (traces: TraceRepository) => new GetTraceUseCase(traces),
      inject: [TRACE_REPOSITORY],
    },
    {
      provide: OBJECT_STORAGE,
      useValue: sharedObjectStorage ?? null,
    },
    {
      provide: SWEEP_ORPHAN_OBJECTS_UC,
      useFactory: (
        storage: ObjectStoragePort | null,
        docs: DocumentRepository,
      ) => {
        if (!storage?.listKeys || !docs.listStorageKeys) return null;
        return new SweepOrphanObjectsUseCase(storage, {
          listStorageKeys: () => docs.listStorageKeys!(),
        });
      },
      inject: [OBJECT_STORAGE, DOCUMENT_REPOSITORY],
    },
  ],
})
export class ObservabilityModule {}
