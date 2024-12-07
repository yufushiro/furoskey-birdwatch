import { MisskeyConfig } from "./load_config.mts";

export interface MisskeyRequestCreateNote {
  text: string;
  visibility?: "public" | "home" | "followers";
  noExtractMentions?: boolean;
  noExtractHashtags?: boolean;
  noExtractEmojis?: boolean;
}

export interface MisskeyResponseNote {
  id: string;
  createdAt: string;
  text: string;
  url: string;
}

export async function createNote(
  config: MisskeyConfig,
  params: MisskeyRequestCreateNote,
) {
  const endpointUrl = new URL("/api/notes/create", config.serverUrl);
  const response = await fetch(endpointUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": config.clientUserAgent,
      "authorization": `Bearer ${config.accessToken}`,
    },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error(
      `Request failed with status ${response.status} (${response.statusText})`,
    );
  }
  return await response.json() as MisskeyResponseNote;
}
