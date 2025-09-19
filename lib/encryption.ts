
import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-this';

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export function hashData(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

export function generateApiKey(): string {
  return `arkv_${CryptoJS.lib.WordArray.random(32).toString()}`;
}
