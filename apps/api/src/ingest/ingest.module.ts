import { Module } from "@nestjs/common";
import {
  CHUNK_REPOSITORY,
  DOCUMENT_REPOSITORY,
  DeleteDocumentUseCase,
  GetDocumentContentUseCase,
  GetDocumentUseCase,
  IngestDocumentUseCase,
  JOB_QUEUE,
  ListChunksUseCase,
  ListDocumentVersionsUseCase,
  ListDocumentsUseCase,
  PARSE_LADDER,
  ProcessParseJobUseCase,
  PruneDocumentVersionsUseCase,
  ReparseDocumentUseCase,
  TENANT_REPOSITORY,
  RETRIEVE_CACHE,
  VECTOR_INDEX,
  type ChunkRepository,
  type DocumentRepository,
  type DocumentStatusNotifier,
  type JobQueuePort,
  type ParseLadderPort,
  type RetrieveCachePort,
  type TenantRepository,
  type VectorIndexPort,
} from "@amkp/application";
import { createDocumentStatusNotifierFromEnv } from "@amkp/adapters-providers";
import { PersistenceModule } from "../infrastructure/persistence.module";
import { AuthModule } from "../auth/auth.module";
import { IngestController } from "./ingest.controller";
import {
  DELETE_DOCUMENT_UC,
  GET_DOCUMENT_CONTENT_UC,
  GET_DOCUMENT_UC,
  INGEST_DOCUMENT_UC,
  LIST_CHUNKS_UC,
  LIST_DOCUMENT_VERSIONS_UC,
  LIST_DOCUMENTS_UC,
  PROCESS_PARSE_UC,
  PRUNE_DOCUMENT_VERSIONS_UC,
  REPARSE_DOCUMENT_UC,
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
      provide: LIST_DOCUMENT_VERSIONS_UC,
      useFactory: (docs: DocumentRepository) =>
        new ListDocumentVersionsUseCase(docs),
      inject: [DOCUMENT_REPOSITORY],
    },
    {
      provide: GET_DOCUMENT_UC,
      useFactory: (docs: DocumentRepository) => new GetDocumentUseCase(docs),
      inject: [DOCUMENT_REPOSITORY],
    },
    {
      provide: GET_DOCUMENT_CONTENT_UC,
      useFactory: (docs: DocumentRepository) =>
        new GetDocumentContentUseCase(docs),
      inject: [DOCUMENT_REPOSITORY],
    },
    {
      provide: DELETE_DOCUMENT_UC,
      useFactory: (
        docs: DocumentRepository,
        index: VectorIndexPort,
        cache: RetrieveCachePort,
      ) => new DeleteDocumentUseCase(docs, index, cache),
      inject: [DOCUMENT_REPOSITORY, VECTOR_INDEX, RETRIEVE_CACHE],
    },
    {
      provide: PRUNE_DOCUMENT_VERSIONS_UC,
      useFactory: (
        docs: DocumentRepository,
        del: DeleteDocumentUseCase,
      ) => new PruneDocumentVersionsUseCase(docs, del),
      inject: [DOCUMENT_REPOSITORY, DELETE_DOCUMENT_UC],
    },
    {
      provide: REPARSE_DOCUMENT_UC,
      useFactory: (docs: DocumentRepository, jobs: JobQueuePort) =>
        new ReparseDocumentUseCase(docs, jobs),
      inject: [DOCUMENT_REPOSITORY, JOB_QUEUE],
    },
    {
      provide: LIST_CHUNKS_UC,
      useFactory: (docs: DocumentRepository, chunks: ChunkRepository) =>
        new ListChunksUseCase(docs, chunks),
      inject: [DOCUMENT_REPOSITORY, CHUNK_REPOSITORY],
    },
    {
      provide: PROCESS_PARSE_UC,
      useFactory: (
        docs: DocumentRepository,
        chunks: ChunkRepository,
        ladder: ParseLadderPort,
        index: VectorIndexPort,
        tenants: TenantRepository,
      ) =>
        new ProcessParseJobUseCase(
          docs,
          chunks,
          ladder,
          index,
          tenants,
          createDocumentStatusNotifierFromEnv() as
            | DocumentStatusNotifier
            | undefined,
        ),
      inject: [
        DOCUMENT_REPOSITORY,
        CHUNK_REPOSITORY,
        PARSE_LADDER,
        VECTOR_INDEX,
        TENANT_REPOSITORY,
      ],
    },
  ],
  exports: [PROCESS_PARSE_UC],
})
export class IngestModule {}
