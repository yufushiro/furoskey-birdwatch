import { decodeBase64Url } from "@std/encoding";
import { NotificationMessage } from "./push_service.mts";

export async function decryptNotification(
  data: NotificationMessage,
  uaPrivateKey: CryptoKey,
  uaPublicKeyRaw: Uint8Array,
  authSecretRaw: Uint8Array<ArrayBuffer>,
) {
  const { encoding } = data.headers;
  if (encoding !== "aesgcm") {
    console.warn(
      `[warn]: encoding type "${encoding}" is not supported. skipping.`,
    );
    return;
  }
  const cryptoKey = getEncryptionParams(data.headers.crypto_key);
  const encryption = getEncryptionParams(data.headers.encryption);
  const asPublicKeyBase64 = cryptoKey.get("dh")!;
  const asPublicKeyRaw = decodeBase64Url(asPublicKeyBase64).slice();
  const asPublicKey = await crypto.subtle.importKey(
    "raw",
    asPublicKeyRaw,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    [],
  );
  const saltBase64 = encryption.get("salt")!;
  const salt = decodeBase64Url(saltBase64).slice();
  const context = concatBuffer(
    new TextEncoder().encode("P-256\0"),
    new Uint8Array([0, 0x41]),
    uaPublicKeyRaw,
    new Uint8Array([0, 0x41]),
    asPublicKeyRaw,
  );
  const authInfo = new TextEncoder().encode("Content-Encoding: auth\0");
  const ecdhSecret = await ecdh(asPublicKey, uaPrivateKey);
  const prkCombine = await hmacSHA256(authSecretRaw, ecdhSecret);
  const ikm = await hmacSHA256(
    prkCombine,
    concatBuffer(authInfo, new Uint8Array([0x01])),
  );

  const prk = await hmacSHA256(salt, ikm);
  const cekInfo = concatBuffer(
    new TextEncoder().encode("Content-Encoding: aesgcm\0"),
    context,
  );
  const cek =
    (await hmacSHA256(prk, concatBuffer(cekInfo, new Uint8Array([0x01]))))
      .slice(0, 16);
  const nonceInfo = concatBuffer(
    new TextEncoder().encode("Content-Encoding: nonce\0"),
    context,
  );
  const nonce =
    (await hmacSHA256(prk, concatBuffer(nonceInfo, new Uint8Array([0x01]))))
      .slice(0, 12);

  const content = decodeBase64Url(data.data).slice();
  const { data: decryptedData } = await decrypt(
    nonce,
    cek,
    content,
    0,
    "aesgcm",
  );
  const text = new TextDecoder().decode(decryptedData);
  return JSON.parse(text);
}

const ecdh = async (publicKey: CryptoKey, privateKey: CryptoKey) => {
  const ecdhSecretCryptoKey = await crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: publicKey,
    },
    privateKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  const ecdhSecret = await crypto.subtle.exportKey(
    "raw",
    ecdhSecretCryptoKey,
  );
  return new Uint8Array(ecdhSecret);
};

const hmacSHA256 = async (
  key: Uint8Array<ArrayBuffer>,
  data: Uint8Array<ArrayBuffer>,
) => {
  const keyData = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", keyData, data));
};

const concatBuffer = (...buffer: Uint8Array[]) => {
  const length = buffer.reduce((acc, cur) => acc + cur.byteLength, 0);
  const tmp = new Uint8Array(length);
  buffer.reduce((acc, cur) => {
    tmp.set(new Uint8Array(cur), acc);
    return acc + cur.byteLength;
  }, 0);
  return tmp;
};

function getEncryptionParams(valueStr: string) {
  const pairs = valueStr.split(";").map((x) =>
    x.split("=", 2) as [string, string]
  );
  return new Map(pairs);
}

const getNonce = (nonce: Uint8Array<ArrayBuffer>, seq: number) => {
  if (seq > 0) {
    nonce = new Uint8Array(nonce);
    return nonce.map((byte, index) => {
      if (index < 6) {
        return byte;
      } else {
        return byte ^ ((seq / Math.pow(256, 12 - 1 - index)) & 0xff);
      }
    });
  }
  return nonce;
};

const splitData = (data: Uint8Array<ArrayBuffer>, size: number) => {
  const result: Uint8Array<ArrayBuffer>[] = [];
  for (let i = 0; i < data.byteLength; i += size) {
    result.push(data.slice(i, i + size));
  }
  return result;
};
const decrypt = async (
  nonce: Uint8Array<ArrayBuffer>,
  contentEncryptionKey: Uint8Array<ArrayBuffer>,
  content: Uint8Array<ArrayBuffer>,
  rs: number = 0,
  encoding = "aesgcm",
) => {
  const cek = await crypto.subtle.importKey(
    "raw",
    contentEncryptionKey,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"],
  );
  const bufferChunk = [];
  if (rs < 18) {
    bufferChunk.push(content);
  } else {
    bufferChunk.push(...splitData(content, rs));
  }
  const decodedChunk = await Promise.all(
    bufferChunk.map(async (chunk, index) => {
      let decodedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: getNonce(nonce, index) },
        cek,
        chunk,
      );
      let paddingLength = 0;
      if (encoding === "aes128gcm") {
        let i = decodedBuffer.byteLength - 1;
        const tmpDecodedBuffer = new Uint8Array(decodedBuffer);
        while (tmpDecodedBuffer[i--] === 0) {
          paddingLength++;
        }
        decodedBuffer = decodedBuffer.slice(
          0,
          decodedBuffer.byteLength - paddingLength - 1,
        );
      } else {
        paddingLength = new DataView(decodedBuffer.slice(0, 2)).getUint8(0);
        decodedBuffer = decodedBuffer.slice(2 + paddingLength);
      }
      return {
        data: new Uint8Array(decodedBuffer),
        padding: { length: paddingLength },
      };
    }),
  );
  return {
    data: concatBuffer(...decodedChunk.map((chunk) => chunk.data)),
    padding: { length: decodedChunk[0].padding.length },
    chunk: decodedChunk,
  };
};
