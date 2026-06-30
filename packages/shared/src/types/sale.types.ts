import { OrderStatus } from '../enums/order-status.enum';
import { PaymentMethod } from '../enums/payment-method.enum';

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  costPrice: number;
  grossProfit: number;
}

export interface Payment {
  id: string;
  saleId: string;
  method: PaymentMethod;
  amount: number;
  reference: string | null;
  processedAt: string;
}

export interface Sale {
  id: string;
  saleNumber: string;
  sessionId: string;
  branchId: string;
  cashierId: string;
  customerId: string | null;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  changeGiven: number;
  notes: string | null;
  items: SaleItem[];
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  orderId: string | null;
  branchId: string;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  dueDate: string;
  issuedAt: string;
  paidAt: string | null;
  notes: string | null;
  items: InvoiceItem[];
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  lineTotal: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  branchId: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  validUntil: string;
  notes: string | null;
  items: QuoteItem[];
  createdAt: string;
}

export interface QuoteItem {
  id: string;
  quoteId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  lineTotal: number;
}

export interface DeliveryNote {
  id: string;
  deliveryNumber: string;
  saleId: string | null;
  invoiceId: string | null;
  customerId: string;
  branchId: string;
  status: 'pending' | 'dispatched' | 'delivered' | 'returned';
  deliveredAt: string | null;
  notes: string | null;
  items: DeliveryNoteItem[];
  createdAt: string;
}

export interface DeliveryNoteItem {
  id: string;
  deliveryNoteId: string;
  productId: string;
  productName: string;
  quantityOrdered: number;
  quantityDelivered: number;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  customerId: string;
  saleId: string | null;
  invoiceId: string | null;
  branchId: string;
  reason: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'issued' | 'applied' | 'voided';
  items: CreditNoteItem[];
  issuedAt: string;
  createdAt: string;
}

export interface CreditNoteItem {
  id: string;
  creditNoteId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}
