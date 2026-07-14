import { QUEUE_NAMES } from "@amkp/adapters-redis";

// BullMQ consumers land in T-2.1 / T-7.1 — bootstrap proves worker process role (AD-10).
console.log("AMKP worker starting");
console.log("queues:", QUEUE_NAMES.join(", "));
setInterval(() => {
  // keep process alive in dev until real consumers exist
}, 60_000);
