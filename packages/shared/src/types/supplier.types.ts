export interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tinNumber: string | null;
  paymentTermsDays: number;
  creditLimit: number;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierSummary {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  balance: number;
  isActive: boolean;
}
