/** Redis/BullMQ adapter stub — queue names: ingest, parse, eval (AD-5). */
export const QUEUE_NAMES = ["ingest", "parse", "eval"] as const;

export type QueueName = (typeof QUEUE_NAMES)[number];
