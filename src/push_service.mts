export function hello(uaid: string) {
  return JSON.stringify({
    messageType: "hello",
    uaid,
    use_webpush: true,
  });
}

export function ack(
  { channelID, version }: { channelID: string; version: string },
) {
  return JSON.stringify({
    messageType: "ack",
    updates: [{
      channelID,
      version,
      code: 100,
    }],
  });
}

export function ping() {
  return "{}";
}

export interface NotificationMessage {
  messageType: "notification";
  channelID: string;
  version: string;
  data: string;
  headers: {
    crypto_key: string;
    encryption: string;
    encoding: string;
  };
}

export function isNotificationMessage(
  data: unknown,
): data is NotificationMessage {
  return data !== null && typeof data === "object" && "messageType" in data &&
    data.messageType === "notification";
}
