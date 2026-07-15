import { Module } from "@nestjs/common";
import {
  DOCUMENT_REPOSITORY,
  GetDocumentUseCase,
  IngestDocumentUseCase,
  JOB_QUEUE,
  ListDocumentsUseCase,
  type DocumentRepository,
  type JobQueuePort,
} from "@amkp/application";
import { PersistenceModule } from "../infrastructure/persistence.module";
import { AuthModule } from "../auth/auth.module";
import { IngestController } from "./ingest.controller";
import {
  GET_DOCUMENT_UC,
  INGEST_DOCUMENT_UC,
  LIST_DOCUMENTS_UC,
} from "../tenancy/tenancy.tokens";

@Module({
  imports: [PersistenceModule, AuthModule],
  controllers: [IngestController],
  providers: [
    {
      provide: INGEST_DOCUMENT_UC,
      useFactory: (docs: DocumentRepository, jobs: JobQueuePort) =>
        new IngestDocumentUseCase(docs, jobs),
      inject: [DOCUMENT_REPOSITORY, JOB_QUEUE],
    },
    {
      provide: LIST_DOCUMENTS_UC,
      useFactory: (docs: DocumentRepository) => new ListDocumentsUseCase(docs),
      inject: [DOCUMENT_REPOSITORY],
    },
    {
      provide: GET_DOCUMENT_UC,
      useFactory: (docs: DocumentRepository) => new GetDocumentUseCase(docs),
      inject: [DOCUMENT_REPOSITORY],
    },
  ],
})
export class IngestModule {}
