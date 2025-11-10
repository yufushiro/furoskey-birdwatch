import { decodeBase64Url } from "@std/encoding";

export interface Config {
  pushService: PushServiceConfig;
  misskey: MisskeyConfig;
  twitter: TwitterConfig;
}

export interface PushServiceConfig {
  uaid: string;
  uaPrivateKeyJWK: JsonWebKey;
  uaPublicKeyBase64: string;
  authSecretBase64: string;
}

export interface MisskeyConfig {
  serverUrl: string;
  accessToken: string;
  clientUserAgent: string;
  visibility: "public" | "home" | "followers";
}

export interface TwitterConfig {
  targetScreenName: string[];
}

export async function loadConfig(configPath: string) {
  try {
    return (await import(configPath)).default as Config;
  } catch (err) {
    console.error(`Cannot load config: ${String(err)}`);
    throw err;
  }
}

export async function loadPushServiceConfig(config: PushServiceConfig) {
  const uaPrivateKey = await importJWK(config.uaPrivateKeyJWK);
  const uaPublicKeyRaw = decodeBase64Url(config.uaPublicKeyBase64);
  const authSecretRaw = decodeBase64Url(config.authSecretBase64).slice();
  return {
    uaid: config.uaid,
    uaPrivateKey,
    uaPublicKeyRaw,
    authSecretRaw,
  };
}

export async function importJWK(jwk: JsonWebKey) {
  const algorithm = {
    name: "ECDH",
    namedCurve: "P-256",
  } satisfies EcKeyAlgorithm;

  const keyUsages = ["deriveBits", "deriveKey"] satisfies KeyUsage[];

  const jwkModified = {
    ...jwk,
    key_ops: keyUsages, // deriveKey で使えるように key_ops を上書き
  };

  return await crypto.subtle.importKey(
    "jwk",
    jwkModified,
    algorithm,
    true,
    keyUsages,
  );
}
