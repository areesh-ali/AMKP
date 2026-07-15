export const QUEUE_NAMES = ["ingest", "parse", "eval"] as const;

export type QueueName = (typeof QUEUE_NAMES)[number];
