import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface RSAKeyPair {
  publicKey: string;
  privateKey: string;
  keyId: string;
  createdAt: Date;
  expiresAt: Date;
}

export class RSAKeyManager {
  private keysDir: string;
  private keyRotationDays = 365;

  constructor(keysDir: string = './keys') {
    this.keysDir = keysDir;
    this.ensureKeysDirectory();
  }

  private ensureKeysDirectory() {
    if (!fs.existsSync(this.keysDir)) {
      fs.mkdirSync(this.keysDir, { recursive: true });
    }
  }

  generateKeyPair(keyId: string = 'default'): RSAKeyPair {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.keyRotationDays * 24 * 60 * 60 * 1000);

    const keyPair: RSAKeyPair = {
      publicKey,
      privateKey,
      keyId,
      createdAt: now,
      expiresAt,
    };

    this.saveKeyPair(keyPair);
    return keyPair;
  }

  private saveKeyPair(keyPair: RSAKeyPair) {
    const keyFile = path.join(this.keysDir, `${keyPair.keyId}.json`);
    const keyData = {
      keyId: keyPair.keyId,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      createdAt: keyPair.createdAt.toISOString(),
      expiresAt: keyPair.expiresAt.toISOString(),
    };
    fs.writeFileSync(keyFile, JSON.stringify(keyData, null, 2));
  }

  loadKeyPair(keyId: string = 'default'): RSAKeyPair {
    const keyFile = path.join(this.keysDir, `${keyId}.json`);
    if (!fs.existsSync(keyFile)) {
      throw new Error(`Clave RSA no encontrada: ${keyId}`);
    }

    const keyData = JSON.parse(fs.readFileSync(keyFile, 'utf-8'));
    return {
      publicKey: keyData.publicKey,
      privateKey: keyData.privateKey,
      keyId: keyData.keyId,
      createdAt: new Date(keyData.createdAt),
      expiresAt: new Date(keyData.expiresAt),
    };
  }

  isKeyExpired(keyPair: RSAKeyPair): boolean {
    return new Date() > keyPair.expiresAt;
  }

  getPublicKeyThumbprint(publicKey: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(publicKey);
    return hash.digest('hex').substring(0, 16);
  }

  listKeys(): string[] {
    return fs.readdirSync(this.keysDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  }
}

export default RSAKeyManager;
