import { AmkpAdminClient, AmkpClient } from "@amkp/sdk-js";
import { baseUrl, type ConsoleSession } from "../session/vault";

/** Winston: Console talks to the plane only via published SDK clients. */
export function createPlaneClient(session: ConsoleSession): {
  tenant: AmkpClient | null;
  admin: AmkpAdminClient | null;
} {
  const url = baseUrl();
  if (session.role === "admin") {
    return {
      admin: new AmkpAdminClient({ baseUrl: url, adminToken: session.credential }),
      tenant: null,
    };
  }
  return {
    admin: null,
    tenant: new AmkpClient({ baseUrl: url, apiKey: session.credential }),
  };
}
