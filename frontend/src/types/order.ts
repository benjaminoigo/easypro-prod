import { Writer } from './shift';

export interface Order {
  id: string;
  orderNumber: string;
  title: string;
  subject: string;
  instructions?: string;
  deadline: string;
  pages: number;
  wordCount: number;
  amount: number;
  cpp: number;
  totalAmount: number;
  writerId?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'submitted' | 'completed' | 'cancelled';
  cancellationReason?: string;
  cancellationConsequence?: 'warning' | 'probation' | 'suspension';
  writer?: Writer;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  orderId: string;
  writerId: string;
  pagesWorked: number;
  cpp: number;
  amount: number;
  filePath?: string;
  fileName?: string;
  filePaths?: string[];
  fileNames?: string[];
  fileUrl?: string;
  notes?: string;
  feedback?: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision';
  reviewedBy?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  shiftId: string;
  order: Order;
  writer: Writer;
  createdAt: string;
  updatedAt: string;
}
