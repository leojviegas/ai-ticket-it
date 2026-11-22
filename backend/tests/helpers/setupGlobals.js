import { webcrypto } from "node:crypto";

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

if (!globalThis.fetch) {
  globalThis.fetch = async () => ({ ok: true, json: async () => ({}) });
}

