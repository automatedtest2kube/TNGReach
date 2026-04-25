import { getConfig, isMnsConfigured } from "../../config";
import { HttpError } from "../../lib/http-error";

/**
 * Enqueue a JSON payload to Alibaba Message Service (MNS) via a queue URL.
 * Replace the body with the official MNS Open API or a thin worker when you are ready to go beyond HTTP to the queue.
 */
export async function enqueueMessage(body: {
  action: string;
  payload: unknown;
}): Promise<{ ok: true; note: string }> {
  const config = getConfig();
  if (!isMnsConfigured(config)) {
    throw new HttpError(503, "MNS is not configured (set ALIBABA_MNS_*)", "mns_not_configured");
  }
  if (!config.ALIBABA_MNS_QUEUE_URL) {
    throw new HttpError(500, "MNS queue URL missing", "mns_misconfig");
  }
  const res = await fetch(config.ALIBABA_MNS_QUEUE_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new HttpError(502, `MNS forward failed: ${res.status}`, "mns_request_failed");
  }
  return { ok: true, note: "Message accepted by configured queue forwarder" };
}
