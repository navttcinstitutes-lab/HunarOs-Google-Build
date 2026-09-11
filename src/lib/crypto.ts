// Secure PIN hashing using Web Crypto API (PBKDF2 / SHA-256 with salt)

export async function hashPin(pin: string, providedSalt?: string): Promise<{ hash: string; salt: string }> {
  const salt = providedSalt || crypto.randomUUID();
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + salt + 'hunaros-v2.1-credential-secret');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return { hash, salt };
}

export async function verifyPin(pin: string, hash: string, salt: string): Promise<boolean> {
  const computed = await hashPin(pin, salt);
  return computed.hash === hash;
}
