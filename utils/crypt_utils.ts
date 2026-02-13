import * as crypto from "node:crypto";

export function encryptString(str: string, key: string): string {
    const initializationVector = crypto.randomBytes(16);
    const keyBuffer = crypto.scryptSync(key, 'salt', 32);
    const cipher = crypto.createCipheriv("aes-256-cbc", keyBuffer, initializationVector);
    let encrypted = cipher.update(str, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${initializationVector.toString('base64')}:${encrypted}`;
}

export function decryptString(encryptedStr: string, key: string): string {
    const [initializationVectorString, encrypted] = encryptedStr.split(":");
    const initializationVector = Buffer.from(initializationVectorString, "base64");
    const keyBuffer = crypto.scryptSync(key, 'salt', 32);
    const decipher = crypto.createDecipheriv("aes-256-cbc", keyBuffer, initializationVector);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}