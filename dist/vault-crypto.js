const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function derive(passphrase, salt) {
  const base = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  );
}

export async function seal(notes, passphrase, previous) {
  const salt = previous ? Uint8Array.from(previous.salt) : crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derive(passphrase, salt);
  const bytes = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(notes)));
  return { salt: [...salt], iv: [...iv], bytes: [...new Uint8Array(bytes)] };
}

export async function unseal(record, passphrase) {
  const key = await derive(passphrase, Uint8Array.from(record.salt));
  const bytes = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: Uint8Array.from(record.iv) }, key, Uint8Array.from(record.bytes)
  );
  return JSON.parse(decoder.decode(bytes));
}
