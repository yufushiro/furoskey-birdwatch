import { assertEquals } from "@std/assert";
import { NotificationMessage } from "./push_service.mts";
import { decryptNotification } from "./decrypt.mts";
import { loadPushServiceConfig, PushServiceConfig } from "./load_config.mts";
import {
  extractTweetUrl,
  getNotificationUrl,
  TwitterNotificationPayload,
} from "./twitter.mts";

// 失効した鍵でテストしているのでご安心ください
const pushServiceConfig = {
  "uaid": "",
  "uaPrivateKeyJWK": {
    "crv": "P-256",
    "d": "gkjADgwBPt2rjrNcDfl-aPQbA8sIU_jFTBxOumS_758",
    "ext": true,
    "key_ops": ["deriveBits"],
    "kty": "EC",
    "x": "c5F6gj04VqSRFvzcx4dKUKXNevRgXBtXP5gKB37ksq8",
    "y": "LNcMsWpgN9BadH58LX3X20tXCjCpI3ICoLoykoEShDc",
  },
  "uaPublicKeyBase64":
    "BHOReoI9OFakkRb83MeHSlClzXr0YFwbVz-YCgd-5LKvLNcMsWpgN9BadH58LX3X20tXCjCpI3ICoLoykoEShDc=",
  "authSecretBase64": "II_30dOx9iKsard5LXM2gA==",
} satisfies PushServiceConfig;

const {
  uaPrivateKey,
  uaPublicKeyRaw,
  authSecretRaw,
} = await loadPushServiceConfig(pushServiceConfig);

const exampleNotification: NotificationMessage = {
  "messageType": "notification",
  "channelID": "8eece6ed-9fe1-4cf4-b339-41d07f1a6f24",
  "version":
    "gAAAAABnU0nCSS5OuCfJ-nvOzOxdBxsNrlTmyCh9bPhRLcGAIqjidZ6dyF4fG1fi_OfyULymuU3uD3fv4nWPRqD3EoN4XG3id9LJfpcUZGByjs6l0B1jxZ-YlSWgxmEdoGqKXHi-tdNvx1hDZV-K70b1wZ-EGNiRxdWZmTO1uCPIbIxOYeLDXKUFuLRMPqrq8pNGeXmyQPIZ",
  "data":
    "KBlFlVDD0_rd4M0dc95tG7Yj8xwEVeWKw_eAo_mg0MxsuIb0o1r6goPrnmUEpbJAG8wToCDlpm7m8pSM7LWFw6cFcFx-GoMQXwA1WUqojEVFkC181JN4CrRcPuc94xdogI3ehDKgBLx3-Lf0sYxs-IF0ntNIXvrUsHN65_Mz5E-kn2NsVreGHyCfP_stcnw1Mfu0E8WB7QwSv-UwrbTM7Yq3vgDQvQErzwaxyCPPQaay3tMqel4jcpcS00LEjVQWFEXtftoA85ShMMVYd9yDPesfBBrFFuisdkQqT8gwR2KnHx_ONQUp7RPInKGbqFp30PzmtFIrdpaTBy3LEx7fgyHiqzMyGAUH6rnfKraRZ4rRmE8BaZmClRuace5MtmrDEs4ZJNUQ4xjBZhBK3Jcg-CVZhlmR8GyGVfHb1nRXVz5_TW8IbJ2umWts4JKg8YMMXs1bXobJ5fMYGWb96kpFG1W_gUO46AAAnXc09CbxDbsUbmK5UHXJFXAB3GKxej1qdcBRtPfYvfejDFw5Ss7dYuC_jFk1tQrlu4C6zpmhd4ZTq5lVGnsicZJKKEqt8wt9aFajowehn8GHQ99WfzgaFssH5VSGpjHZGWioDbd5aXE6p0Zk4qkQodIxqjKZ8nO9FY4vjT05zY2GAXhqjZVvcyriHabBtxp1zJ19jcp30dVE6EyEnfAUcw_fMmweCrV6s67qHZ2x7rmnC4-0nkcOi2OFjSzAh3nj4EMbGErej4VSBva4Blg11AiFM4-3dTF9DhXFmowxuaCDlOx2UkkXVi_g-JO6H25AN196kfp-fHK94GbYRsd6U6gkK6o4tDF8uCAnI_c8m_2aip2lnC8ZyBsza6QxoEfE58Zyq_vK-YkTEJRZ4KzMN1pE_u6b1jGP3SpDk00iizgmNUVmPEjeJIkQJD57alYNcUGzPgDR6szELiGxTH1pQbkVMNr37KybCvTwBadR8w-5yuqY6FmZ4tWVIUgwcdmyfDqk5roGSmVn9Z7RSmgmaqpTOEWikF55BnIdyqV-jG8KQhhXjPn_ZIkF0tX0yYioIvWFRK8688gAYJUOE15ef1X4KWnzuSfymf6UAynvT54xZ2GQ9FD_8Cu4vaP5WMWoYhBMWUK_ok9lPfRGSn8BAUkpj2k4wNL-8U0OQzONDxXR-GGFEZHEzjVIFA52DNOcwRa-88J8wr_oFhX4PtS6hvrJnjRHyZqfqnvxExbkf5nd0AF8pkebuO2f8hRAUH8KdVZvsjy3WgMLzhhm28TLuh5RAqs48qRelhs0TJo2RDdQUUTO3xdD5T-sJaRvS_wpcuxUSPoazGlyNryM1NxZ",
  "headers": {
    "crypto_key":
      "p256ecdsa=BF5oEo0xDUpgylKDTlsd8pZmxQA1leYINiY-rSscWYK_3tWAkz4VMbtf1MLE_Yyd6iII6o-e3Q9TCN5vZMzVMEs;dh=BJn8tGG12LePgYwSAUSlLRRPpk5KOUHhgh8_UNWCcSIdkxX8EEfutDfTJubfAnK7OMLFTcvsX1z8xt3yi4V0FrE",
    "encoding": "aesgcm",
    "encryption": "salt=NUDkyZRDu1-kMI8D_yoSWA",
  },
};

const exampleNotificationDecrypted: TwitterNotificationPayload = {
  registration_ids: [
    "https://updates.push.services.mozilla.com/wpush/v2/gAAAAABnU0QECZh_ui_FqkmSFIXjXR4ICKbMhB_Q9rNA4eWI76xh--fr8kpeejQkkhtTNwp2IAgtVkCL36_i5QE6iLmsfWgYs7y97TWI3h0Dc8VCNUpfxRldjPVcR0iG0gpwtQ_-pKsX6pzMpUJ5LBC5pQPmgTiUJcHeB2O-TKh7noZCVKjKi2w",
  ],
  title: "BBC News (UK)",
  body: "Road marking repainted again after misspelling bbc.in/4g0ew5B",
  icon:
    "https://pbs.twimg.com/profile_images/1529107486271225859/03qcVNIk_reasonably_small.jpg",
  timestamp: "1733511618627",
  tag: "tweet-1865109020542894378",
  data: {
    lang: "en",
    bundle_text:
      "{num_total, number} new {num_total, plural, one {interaction} other {interactions}}",
    type: "tweet",
    uri: "/BBCNews/status/1865109020542894378",
    impression_id: "1219817934446448640-1685725312",
    title: "BBC News (UK)",
    body: "Road marking repainted again after misspelling bbc.in/4g0ew5B",
    tag: "tweet-1865109020542894378",
    scribe_target: "tweet",
  },
};

Deno.test("decrypt", async () => {
  const decrypted = await decryptNotification(
    exampleNotification,
    uaPrivateKey,
    uaPublicKeyRaw,
    authSecretRaw,
  );
  assertEquals(decrypted, exampleNotificationDecrypted);
});

Deno.test("extractTweetUrl", () => {
  const tweetUrl = getNotificationUrl(exampleNotificationDecrypted);
  const extracted = extractTweetUrl(tweetUrl);
  assertEquals(extracted, {
    screenName: "BBCNews",
    tweetId: "1865109020542894378",
  });
});
