import express, { Request, Response } from 'express';
import { KYCManager, AMLEngine } from '../compliance/kyc-aml';

const router = express.Router();

// Instancias compartidas
const kycManager = new KYCManager();
const amlEngine = new AMLEngine();

// ✅ ENDPOINT 1: Registrar cliente y solicitar KYC
router.post('/compliance/kyc/register', (req: Request, res: Response) => {
  try {
    const { cedula, fullName, email, phone, address } = req.body;

    // Validar cédula
    const isValidCedula = kycManager.verifyIdentity(cedula, fullName);
    if (!isValidCedula) {
      return res.status(400).json({
        success: false,
        error: 'Cédula inválida o no verificable',
        details: 'Formato incorrecto o dígito verificador no válido',
      });
    }

    // Verificar cliente no duplicado
    const existingClient = kycManager.getClientByCedula(cedula);
    if (existingClient) {
      return res.status(400).json({
        success: false,
        error: 'Cliente ya registrado',
        clientId: existingClient.id,
      });
    }

    // Registrar cliente
    const client = kycManager.registerClient(cedula, fullName, email, phone, address);

    res.json({
      success: true,
      message: 'Cliente registrado. KYC pendiente de verificación.',
      client: {
        id: client.id,
        cedula: client.cedula,
        fullName: client.fullName,
        kycStatus: client.kycStatus,
        amlStatus: client.amlStatus,
        riskScore: client.riskScore,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ ENDPOINT 2: Verificar KYC (simular aprobación)
router.post('/compliance/kyc/verify/:clientId', (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;

    const client = kycManager.getClient(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const verifiedClient = kycManager.markKYCVerified(clientId);
    if (!verifiedClient) {
      return res.status(404).json({ error: 'No se pudo verificar al cliente' });
    }

    res.json({
      success: true,
      message: 'KYC verificado exitosamente',
      client: {
        id: verifiedClient.id,
        cedula: verifiedClient.cedula,
        fullName: verifiedClient.fullName,
        kycStatus: verifiedClient.kycStatus,
        verifiedAt: verifiedClient.verifiedAt,
        riskScore: verifiedClient.riskScore,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ ENDPOINT 3: Obtener estado del cliente
router.get('/compliance/client/:clientId', (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;

    const client = kycManager.getClient(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const flags = amlEngine.getFlagsByClient(clientId);
    const riskScore = amlEngine.calculateRiskScore(client, flags);

    res.json({
      success: true,
      client: {
        ...client,
        riskScore,
        flagCount: flags.length,
        activeFlags: flags.filter((f) => f.status === 'OPEN').length,
      },
      flags: flags.map((f) => ({
        id: f.id,
        type: f.type,
        description: f.description,
        severity: f.severity,
        status: f.status,
        flaggedAt: f.flaggedAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ ENDPOINT 4: Validar transacción (AML checks)
router.post('/compliance/validate-transaction', (req: Request, res: Response) => {
  try {
    const { clientId, amount, description, recipientId, recentTransactions } = req.body;

    // Obtener cliente
    const client = kycManager.getClient(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const violations: any[] = [];
    const detectedFlags: any[] = [];

    // 1️⃣ Verificar KYC
    if (client.kycStatus !== 'VERIFIED') {
      violations.push({
        type: 'KYC_NOT_VERIFIED',
        severity: 'HIGH',
        description: 'Cliente sin verificación KYC completa',
        canProceed: false,
      });
    }

    // 2️⃣ Detectar spike
    const spikeFlag = amlEngine.detectSpike(client, amount);
    if (spikeFlag) {
      detectedFlags.push(spikeFlag);
      violations.push({
        type: 'SPIKE_DETECTION',
        severity: spikeFlag.severity,
        description: spikeFlag.description,
        flagId: spikeFlag.id,
        canProceed: spikeFlag.severity !== 'CRITICAL',
      });
    }

    // 3️⃣ Detectar circular flows
    let circularFlag = null;
    if (recipientId) {
      circularFlag = amlEngine.detectCircularFlow(clientId, recipientId, recentTransactions || []);
      if (circularFlag) {
        detectedFlags.push(circularFlag);
        violations.push({
          type: 'CIRCULAR_FLOW',
          severity: circularFlag.severity,
          description: circularFlag.description,
          flagId: circularFlag.id,
          canProceed: false,
        });
      }
    }

    // 4️⃣ Detectar structuring
    const structuringFlag = amlEngine.detectStructuring(clientId, recentTransactions || []);
    if (structuringFlag) {
      detectedFlags.push(structuringFlag);
      violations.push({
        type: 'STRUCTURING',
        severity: structuringFlag.severity,
        description: structuringFlag.description,
        flagId: structuringFlag.id,
        canProceed: false,
      });
    }

    // Calcular risk score
    const allFlags = amlEngine.getFlagsByClient(clientId);
    const riskScore = amlEngine.calculateRiskScore(client, allFlags);

    // Decidir si bloquear
    const blockDecision = amlEngine.shouldBlockTransaction(client, riskScore);

    // Reportar a UIF si es crítico
    if (blockDecision.shouldBlock && violations.some((v) => v.severity === 'CRITICAL')) {
      for (const flag of detectedFlags.filter((f) => f)) {
        amlEngine.reportToUIF(flag.id, clientId, `Transacción sospechosa: ${description}`);
      }
    }

    res.json({
      success: true,
      canProceed: !blockDecision.shouldBlock && violations.filter((v) => !v.canProceed).length === 0,
      blockReason: blockDecision.reason,
      riskScore,
      violations,
      compliance: {
        kycStatus: client.kycStatus,
        amlStatus: client.amlStatus,
        flagCount: allFlags.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ ENDPOINT 5: Obtener todas las flags activas
router.get('/compliance/flags/active', (req: Request, res: Response) => {
  try {
    const activeFlags = amlEngine.getAllActiveFlags();

    res.json({
      success: true,
      totalActiveFlags: activeFlags.length,
      flags: activeFlags.map((f) => ({
        id: f.id,
        clientId: f.clientId,
        type: f.type,
        description: f.description,
        severity: f.severity,
        status: f.status,
        flaggedAt: f.flaggedAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ ENDPOINT 6: Reportar a UIF manualmente
router.post('/compliance/report-uif/:flagId', (req: Request, res: Response) => {
  try {
    const { flagId } = req.params;
    const { clientId, reason } = req.body;

    const flag = amlEngine.getFlag(flagId);
    if (!flag) {
      return res.status(404).json({ error: 'Flag no encontrada' });
    }

    const reported = amlEngine.reportToUIF(flagId, clientId, reason);

    res.json({
      success: reported,
      message: reported
        ? '🚨 Reporte UIF enviado exitosamente'
        : 'Error al reportar a UIF',
      flag: {
        id: flag.id,
        status: flag.status,
        reportedToUIF: flag.reportedToUIF,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
