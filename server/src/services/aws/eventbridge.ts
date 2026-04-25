import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { getAwsClientConfig } from "./region";

let client: EventBridgeClient | null = null;
function getClient() {
  if (!client) {
    client = new EventBridgeClient(getAwsClientConfig());
  }
  return client;
}

export async function putEvent(args: {
  source: string;
  detailType: string;
  eventBusName?: string;
  detail: unknown;
}) {
  const out = await getClient().send(
    new PutEventsCommand({
      Entries: [
        {
          Source: args.source,
          DetailType: args.detailType,
          Detail: JSON.stringify(args.detail),
          EventBusName: args.eventBusName,
        },
      ],
    }),
  );
  return { failed: out.FailedEntryCount, entries: out.Entries };
}
