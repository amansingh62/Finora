export interface withdrawalResponse {
  message: string;

  withdrawal: {
    id: string;
    amount: string;
    status: string;
    referenceId: string | null;
    transactionId: string | null;
    completedAt: string | null;
    
    bankAccount: {
      id: string;
      bankName: string;
      accountHolder: string;
      accountNumber: string;
      ifscCode: string;
    };
  };
  balance: string;
  alreadyProcessed: boolean;
}
