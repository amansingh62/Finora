-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN     "bankAccountId" TEXT;

-- CreateIndex
CREATE INDEX "Withdrawal_bankAccountId_idx" ON "Withdrawal"("bankAccountId");

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
