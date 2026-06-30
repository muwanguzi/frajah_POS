export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type AccountNormalBalance = 'debit' | 'credit';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  normalBalance: AccountNormalBalance;
  parentId: string | null;
  description: string | null;
  isActive: boolean;
  isSystem: boolean;
  balance: number;
  createdAt: string;
}

export interface JournalLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string | null;
}

export interface JournalEntry {
  id: string;
  referenceNumber: string;
  description: string;
  entryDate: string;
  branchId: string | null;
  isPosted: boolean;
  postedAt: string | null;
  postedById: string | null;
  sourceType: string | null;
  sourceId: string | null;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  createdById: string;
  createdAt: string;
}

export interface CashbookEntry {
  id: string;
  referenceNumber: string;
  accountId: string;
  accountName: string;
  branchId: string;
  type: 'receipt' | 'payment';
  amount: number;
  description: string;
  entryDate: string;
  balanceAfter: number;
  sourceType: string | null;
  sourceId: string | null;
  createdById: string;
  createdAt: string;
}
