export interface BankAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  isPrimary: boolean;
  balance: number;
  createdAt: string;
}