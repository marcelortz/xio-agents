import * as crypto from 'crypto';

export interface SignatureData {
  transactionId: string;
  amount: number;
  currency: string;
  description: string;
  timestamp: Date;
  signatory: string; // Síndico (Omar)
  signature: string;
  keyId: string;
  algorithm: string;
  verified: boolean;
}

export class DigitalSignatureManager {
  sign(
    data: {
      transactionId: string;
      amount: number;
      currency: string;
      description: string;
      signatory: string;
    },
    privateKey: string,
    keyId: string = 'default'
  ): SignatureData {
    // Crear payload consistente para firma
    const payload = JSON.stringify({
      transactionId: data.transactionId,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      signatory: data.signatory,
      timestamp: new Date().toISOString(),
    });

    // Generar firma RSA-SHA256
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(payload);
    const signature = sign.sign(privateKey, 'hex');

    return {
      transactionId: data.transactionId,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      timestamp: new Date(),
      signatory: data.signatory,
      signature,
      keyId,
      algorithm: 'RSA-SHA256',
      verified: false,
    };
  }

  verify(
    signatureData: SignatureData,
    publicKey: string
  ): boolean {
    try {
      // Reconstruir payload exacto
      const payload = JSON.stringify({
        transactionId: signatureData.transactionId,
        amount: signatureData.amount,
        currency: signatureData.currency,
        description: signatureData.description,
        signatory: signatureData.signatory,
        timestamp: signatureData.timestamp.toISOString(),
      });

      // Verificar firma RSA-SHA256
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(payload);
      return verify.verify(publicKey, signatureData.signature, 'hex');
    } catch (error) {
      return false;
    }
  }

  createSignatureProof(
    signatureData: SignatureData,
    publicKey: string
  ): {
    isValid: boolean;
    timestamp: Date;
    proofHash: string;
  } {
    const isValid = this.verify(signatureData, publicKey);

    // Crear prueba criptográfica del acto de firma
    const proofData = JSON.stringify({
      transactionId: signatureData.transactionId,
      signature: signatureData.signature,
      signatory: signatureData.signatory,
      timestamp: signatureData.timestamp.toISOString(),
    });

    const proofHash = crypto
      .createHash('sha256')
      .update(proofData)
      .digest('hex');

    return {
      isValid,
      timestamp: new Date(),
      proofHash,
    };
  }

  generateTransactionId(): string {
    return `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }
}

export default DigitalSignatureManager;
