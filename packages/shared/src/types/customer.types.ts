export type CustomerType = 'retail' | 'wholesale' | 'vip';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tinNumber: string | null;
  creditLimit: number;
  creditBalance: number;
  loyaltyPoints: number;
  customerType: CustomerType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  points: number;
  type: 'earn' | 'redeem' | 'expire' | 'adjust';
  reference: string | null;
  description: string | null;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string | null;
  loyaltyPoints: number;
  creditBalance: number;
  customerType: CustomerType;
}
