import { Writer } from './shift';

export interface Payment {
  id: string;
  writerId: string;
  amount: number;
  status: 'pending' | 'approved' | 'completed' | 'paid' | 'failed';
  method?: 'bank_transfer' | 'paypal' | 'check' | 'other';
  transactionReference?: string;
  notes?: string;
  paidBy?: string;
  paidAt?: string;
  writer: Writer;
  createdAt: string;
  updatedAt: string;
}
