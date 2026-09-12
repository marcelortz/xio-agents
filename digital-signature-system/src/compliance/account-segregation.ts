import * as crypto from 'crypto';

export type AccountType = 'CLIENT' | 'COMPANY' | 'GUARANTEE' | 'INSURANCE';
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'FEE' | 'GUARANTEE_ALLOCATION';
export type LedgerEntryStatus = 'PENDING' | 'VERIFIED' | 'RECONCILED' | 'DISPUTED';

export interface BankAccount {
  id: string;
  accountNumber: string;
  bankName: string;
  accountType: AccountType;
  clientId?: string; // Solo para CLIENT type
  currency: string;
  balance: number;
  ledgerHash: string; // SHA-256 del ledger para integridad
  createdAt: Date;
  lastUpdatedAt: Date;
  isActive: boolean;
}

export interface LedgerEntry {
  id: string;
  accountId: string;
  transactionType: TransactionType;
  amount: number;
  balance: number; // Balance después de esta transacción
  description: string;
  relatedAccountId?: string; // Para transfers
  status: LedgerEntryStatus;
  proof: string; // SHA-256 hash de entrada para integridad
  createdAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export interface SegregationReport {
  totalClientFunds: number;
  totalCompanyFunds: number;
  guaranteeFund: number;
  insuranceFund: number;
  aum: number; // Assets Under Management
  guaranteeRatio: number; // Actual guarantee fund / required (5% AUM)
  isCompliant: boolean;
  lastAuditDate: Date;
  discrepancies: string[];
}

export class AccountManager {
  private accounts: Map<string, BankAccount> = new Map();
  private ledger: Map<string, LedgerEntry[]> = new Map();
  private guaranteePercentage = 0.05; // 5% AUM
  private bankMappings = new Map<AccountType, string>([
    ['CLIENT', 'Bank A - Client Segregated Accounts'],
    ['COMPANY', 'Bank B - XIO Operating Account'],
    ['GUARANTEE', 'Bank C - Guarantee Fund'],
    ['INSURANCE', 'Bank D - Cyber Insurance Reserve'],
  ]);

  /**
   * Create segregated account for a specific type
   */
  createAccount(
    accountNumber: string,
    bankName: string,
    accountType: AccountType,
    currency: string = 'EUR',
    clientId?: string
  ): BankAccount {
    if (accountType === 'CLIENT' && !clientId) {
      throw new Error('CLIENT accounts require clientId');
    }

    const accountId = `ACC-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const account: BankAccount = {
      id: accountId,
      accountNumber,
      bankName,
      accountType,
      clientId,
      currency,
      balance: 0,
      ledgerHash: this.calculateLedgerHash([]),
      createdAt: new Date(),
      lastUpdatedAt: new Date(),
      isActive: true,
    };

    this.accounts.set(accountId, account);
    this.ledger.set(accountId, []);

    console.log(`✅ Cuenta ${accountType} creada: ${accountId}`);
    return account;
  }

  /**
   * Record transaction in ledger (IMMUTABLE audit trail)
   */
  recordTransaction(
    accountId: string,
    transactionType: TransactionType,
    amount: number,
    description: string,
    relatedAccountId?: string
  ): LedgerEntry {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    if (!account.isActive) {
      throw new Error(`Account is inactive: ${accountId}`);
    }

    // Validate transaction type
    if (transactionType === 'WITHDRAWAL' && account.balance < amount) {
      throw new Error(
        `Insufficient funds. Balance: ${account.balance}, Requested: ${amount}`
      );
    }

    // Calculate new balance
    let newBalance = account.balance;
    if (transactionType === 'DEPOSIT' || transactionType === 'TRANSFER') {
      newBalance += amount;
    } else if (transactionType === 'WITHDRAWAL' || transactionType === 'FEE') {
      newBalance -= amount;
    } else if (transactionType === 'GUARANTEE_ALLOCATION') {
      newBalance -= amount; // Allocated from main balance
    }

    const entryId = `LDG-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const entry: LedgerEntry = {
      id: entryId,
      accountId,
      transactionType,
      amount,
      balance: newBalance,
      description,
      relatedAccountId,
      status: 'PENDING',
      proof: this.generateEntryProof(entryId, accountId, amount, newBalance),
      createdAt: new Date(),
    };

    // Add to ledger (IMMUTABLE - append only)
    const accountLedger = this.ledger.get(accountId) || [];
    accountLedger.push(entry);
    this.ledger.set(accountId, accountLedger);

    // Update account balance and hash
    account.balance = newBalance;
    account.ledgerHash = this.calculateLedgerHash(accountLedger);
    account.lastUpdatedAt = new Date();
    this.accounts.set(accountId, account);

    console.log(`📝 Transacción registrada: ${entryId} | Tipo: ${transactionType} | Monto: €${amount}`);
    return entry;
  }

  /**
   * Verify ledger entry (irreversible state change to VERIFIED)
   */
  verifyEntry(entryId: string, accountId: string, verifiedBy: string): LedgerEntry | null {
    const accountLedger = this.ledger.get(accountId);
    if (!accountLedger) return null;

    const entry = accountLedger.find((e) => e.id === entryId);
    if (!entry) return null;

    if (entry.status !== 'PENDING') {
      throw new Error(`Entry already verified or disputed: ${entryId}`);
    }

    entry.status = 'VERIFIED';
    entry.verifiedAt = new Date();
    entry.verifiedBy = verifiedBy;

    return entry;
  }

  /**
   * Reconcile account (verify all entries and calculate final balance)
   */
  reconcileAccount(accountId: string): { isReconciled: boolean; discrepancies: string[] } {
    const accountLedger = this.ledger.get(accountId);
    if (!accountLedger) {
      return { isReconciled: false, discrepancies: ['Account not found'] };
    }

    const discrepancies: string[] = [];
    let calculatedBalance = 0;

    for (const entry of accountLedger) {
      if (entry.status !== 'VERIFIED') {
        discrepancies.push(`Entry ${entry.id} is not verified`);
      }

      // Recalculate balance
      const expectedBalance = entry.balance;
      // In real scenario, would verify against bank statement
      if (Math.abs(calculatedBalance - expectedBalance) > 0.01) {
        discrepancies.push(
          `Balance mismatch at ${entry.id}: expected €${expectedBalance}, calculated €${calculatedBalance}`
        );
      }
      calculatedBalance = entry.balance;
    }

    // Mark all entries as RECONCILED if no discrepancies
    if (discrepancies.length === 0) {
      for (const entry of accountLedger) {
        entry.status = 'RECONCILED';
      }
    }

    return {
      isReconciled: discrepancies.length === 0,
      discrepancies,
    };
  }

  /**
   * Get segregation report (compliance check)
   */
  getSegregationReport(): SegregationReport {
    let totalClientFunds = 0;
    let totalCompanyFunds = 0;
    let guaranteeFund = 0;
    let insuranceFund = 0;

    // Calculate balances by account type
    for (const account of this.accounts.values()) {
      if (!account.isActive) continue;

      switch (account.accountType) {
        case 'CLIENT':
          totalClientFunds += account.balance;
          break;
        case 'COMPANY':
          totalCompanyFunds += account.balance;
          break;
        case 'GUARANTEE':
          guaranteeFund += account.balance;
          break;
        case 'INSURANCE':
          insuranceFund += account.balance;
          break;
      }
    }

    const aum = totalClientFunds; // Assets Under Management = Client funds
    const requiredGuaranteeFund = aum * this.guaranteePercentage;
    const guaranteeRatio = requiredGuaranteeFund > 0 ? guaranteeFund / requiredGuaranteeFund : 0;

    const discrepancies: string[] = [];

    // Compliance checks
    if (totalClientFunds < 0) {
      discrepancies.push('❌ CRITICAL: Client funds negative (overdraft)');
    }

    if (guaranteeFund < requiredGuaranteeFund) {
      discrepancies.push(
        `⚠️ Guarantee fund insufficient: €${guaranteeFund} < €${requiredGuaranteeFund} required (5% AUM)`
      );
    }

    if (totalCompanyFunds < 0) {
      discrepancies.push('⚠️ Company funds insufficient for operations');
    }

    if (insuranceFund === 0) {
      discrepancies.push('⚠️ Insurance fund not established');
    }

    return {
      totalClientFunds,
      totalCompanyFunds,
      guaranteeFund,
      insuranceFund,
      aum,
      guaranteeRatio,
      isCompliant: discrepancies.length === 0,
      lastAuditDate: new Date(),
      discrepancies,
    };
  }

  /**
   * Transfer between segregated accounts (internal movement)
   */
  transferFunds(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    reason: string
  ): boolean {
    const fromAccount = this.accounts.get(fromAccountId);
    const toAccount = this.accounts.get(toAccountId);

    if (!fromAccount || !toAccount) {
      throw new Error('One or both accounts not found');
    }

    // Validate transfer rules
    if (fromAccount.accountType === 'CLIENT' && toAccount.accountType === 'CLIENT') {
      throw new Error('Cannot transfer between different client accounts');
    }

    if (fromAccount.balance < amount) {
      throw new Error(
        `Insufficient funds in ${fromAccountId}: €${fromAccount.balance} < €${amount}`
      );
    }

    // Record transactions on both sides
    this.recordTransaction(
      fromAccountId,
      'TRANSFER',
      amount,
      `Transfer to ${toAccountId}: ${reason}`,
      toAccountId
    );

    this.recordTransaction(
      toAccountId,
      'TRANSFER',
      amount,
      `Transfer from ${fromAccountId}: ${reason}`,
      fromAccountId
    );

    console.log(`💳 Transferencia: €${amount} de ${fromAccountId} a ${toAccountId}`);
    return true;
  }

  /**
   * Allocate guarantee fund (5% of AUM)
   */
  allocateGuaranteeFund(clientFundAccountId: string, guaranteeAccountId: string): boolean {
    const clientAccount = this.accounts.get(clientFundAccountId);
    const guaranteeAccount = this.accounts.get(guaranteeAccountId);

    if (!clientAccount || !guaranteeAccount) {
      throw new Error('Account not found');
    }

    if (clientAccount.accountType !== 'CLIENT') {
      throw new Error('First account must be CLIENT type');
    }

    if (guaranteeAccount.accountType !== 'GUARANTEE') {
      throw new Error('Second account must be GUARANTEE type');
    }

    const guaranteeAmount = clientAccount.balance * this.guaranteePercentage;

    this.recordTransaction(
      clientFundAccountId,
      'GUARANTEE_ALLOCATION',
      guaranteeAmount,
      `Allocate 5% guarantee fund`,
      guaranteeAccountId
    );

    this.recordTransaction(
      guaranteeAccountId,
      'DEPOSIT',
      guaranteeAmount,
      `Received 5% guarantee from client account`,
      clientFundAccountId
    );

    console.log(`🛡️ Fondo de garantía asignado: €${guaranteeAmount} (5% de €${clientAccount.balance})`);
    return true;
  }

  /**
   * Get all transactions for audit trail
   */
  getAuditTrail(accountId: string): LedgerEntry[] {
    return this.ledger.get(accountId) || [];
  }

  /**
   * Get account details
   */
  getAccount(accountId: string): BankAccount | null {
    return this.accounts.get(accountId) || null;
  }

  /**
   * Get all accounts by type
   */
  getAccountsByType(accountType: AccountType): BankAccount[] {
    return Array.from(this.accounts.values()).filter((a) => a.accountType === accountType && a.isActive);
  }

  /**
   * Verify segregation integrity
   */
  verifySegregationIntegrity(): { isIntegrated: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check that each account type has at least one active account
    const typeCount = new Map<AccountType, number>();
    for (const account of this.accounts.values()) {
      if (account.isActive) {
        typeCount.set(account.accountType, (typeCount.get(account.accountType) || 0) + 1);
      }
    }

    const requiredTypes: AccountType[] = ['CLIENT', 'COMPANY', 'GUARANTEE', 'INSURANCE'];
    for (const type of requiredTypes) {
      if (!typeCount.has(type) || typeCount.get(type)! === 0) {
        issues.push(`❌ No active ${type} account found`);
      }
    }

    // Verify ledger hashes
    for (const [accountId, ledger] of this.ledger.entries()) {
      const account = this.accounts.get(accountId);
      if (account) {
        const calculatedHash = this.calculateLedgerHash(ledger);
        if (calculatedHash !== account.ledgerHash) {
          issues.push(`❌ Ledger integrity compromised for account ${accountId}`);
        }
      }
    }

    return {
      isIntegrated: issues.length === 0,
      issues,
    };
  }

  /**
   * Generate SHA-256 proof for ledger entry
   */
  private generateEntryProof(
    entryId: string,
    accountId: string,
    amount: number,
    balance: number
  ): string {
    const data = `${entryId}|${accountId}|${amount}|${balance}|${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Calculate ledger hash for integrity verification
   */
  private calculateLedgerHash(ledger: LedgerEntry[]): string {
    const data = ledger.map((e) => e.proof).join('|');
    return crypto.createHash('sha256').update(data || 'empty').digest('hex');
  }
}

export default { AccountManager };
