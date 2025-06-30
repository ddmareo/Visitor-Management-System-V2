import crypto from "crypto";

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY
  ? Buffer.from(process.env.NEXT_PUBLIC_ENCRYPTION_KEY, "base64")
  : null;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error("ENCRYPTION_KEY must be a 32-byte Base64-encoded string");
}

const IV_LENGTH = 16;

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

export const decrypt = (text: string): string => {
  const textParts = text.split(":");
  const iv = Buffer.from(textParts[0], "hex");
  const encryptedText = Buffer.from(textParts[1], "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

export const encryptBinary = (buffer: Buffer): Buffer => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([iv, encrypted]);
};

export const decryptBinary = (encryptedBuffer: Buffer): Buffer => {
  const iv = encryptedBuffer.subarray(0, IV_LENGTH);
  const encryptedData = encryptedBuffer.subarray(IV_LENGTH);
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
};
