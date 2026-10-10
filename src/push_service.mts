const PING_INTERVAL = Temporal.Duration.from({ minutes: 5 });

type MessageHandler = (input: {
  data: unknown;
  send: (data: string) => void;
}) => Promise<void>;

export async function connectPushService(
  uaid: string,
  onMessage: MessageHandler,
): Promise<void> {
  const socket = new WebSocket("wss://push.services.mozilla.com");
  const controller = new AbortController();
  const { signal } = controller;
  const inFlightMessages = new Set<Promise<void>>();

  const { promise: disconnectedPromise, resolve: disconnected } = Promise
    .withResolvers<void>();

  function schedulePing() {
    if (signal.aborted) {
      return;
    }

    setTimeoutWithSignal(
      () => {
        try {
          console.log("ping");
          socket.send(ping());
        } catch (err: unknown) {
          console.error(`[err] Failed to send ping: ${String(err)}`);
        }
        schedulePing();
      },
      PING_INTERVAL,
      signal,
    );
  }

  socket.addEventListener("open", () => {
    console.log("open");
    try {
      socket.send(hello(uaid));
    } catch (err: unknown) {
      console.error(`[err] Failed to send hello: ${String(err)}`);
    }
    schedulePing();
  }, { signal });

  socket.addEventListener("close", async (ev) => {
    console.log(
      "closed: " +
        `code=${ev.code}, ` +
        `reason=${ev.reason || "(none)"}, ` +
        `wasClean=${ev.wasClean}`,
    );
    controller.abort();
    // inFlightMessages は reject しないので try...catch で囲む必要はない
    await Promise.allSettled(inFlightMessages);
    disconnected();
  }, { signal });

  socket.addEventListener("error", (ev) => {
    const message = ev instanceof ErrorEvent ? ev.message : String(ev);
    console.error(`WebSocket error: ${message}`);
  }, { signal });

  function filterSecret(text: string) {
    return text.replace(uaid, "...uaid...");
  }

  socket.addEventListener("message", async (ev: MessageEvent<unknown>) => {
    const { promise, resolve } = Promise.withResolvers<void>();
    inFlightMessages.add(promise);

    try {
      console.log(filterSecret(String(ev.data)));
      if (typeof ev.data !== "string") {
        throw new TypeError("Expected a text WebSocket message");
      }
      const data: unknown = JSON.parse(ev.data);
      const send = (data: string) => socket.send(data);
      await onMessage({ data, send });
    } catch (err: unknown) {
      console.error(`[err] Failed to handle message: ${String(err)}`);
      console.error(err);
    } finally {
      resolve();
      inFlightMessages.delete(promise);
    }
  }, { signal });

  await disconnectedPromise;
}

function setTimeoutWithSignal(
  callback: () => Promise<void> | void,
  delay: Temporal.Duration,
  signal: AbortSignal,
) {
  if (signal.aborted) {
    return;
  }
  const timer = setTimeout(async () => {
    signal.removeEventListener("abort", abortTimer);
    if (!signal.aborted) {
      await callback();
    }
  }, delay.total("milliseconds"));
  const abortTimer = () => clearTimeout(timer);
  signal.addEventListener("abort", abortTimer, { once: true });
}

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
