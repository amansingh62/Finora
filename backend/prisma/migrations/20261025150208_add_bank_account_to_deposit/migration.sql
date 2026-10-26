-- AlterTable
ALTER TABLE "Deposit" ADD COLUMN     "bankAccountId" TEXT;

-- CreateIndex
CREATE INDEX "Deposit_bankAccountId_idx" ON "Deposit"("bankAccountId");

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
