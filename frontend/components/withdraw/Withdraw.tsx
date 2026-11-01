
"use client";

import { useState } from "react";
import { useCreateWithdraw } from "@/src/hooks/useWithdraw";
import { useGetAllBankAccounts } from "@/src/hooks/useBank";
import WithdrawalHistory from "./WithdrawHistory";
import WithdrawalDetails from "./WithdrawDetails";

interface BankAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
}

export default function Withdraw() {
  const [amount, setAmount] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [updatedBalance, setUpdatedBalance] = useState("");

  const [selectedWithdrawalId, setSelectedWithdrawalId] = useState("");

  const withdrawalMutation = useCreateWithdraw();

  const {
    data: bankData,
    isLoading: isBankLoading,
    isError: isBankError,
    refetch: refetchBankAccounts,
  } = useGetAllBankAccounts();

  // Assumes the API returns { bankAccounts: BankAccount[] }
  const bankAccounts: BankAccount[] = bankData?.bankAccounts ?? [];

  // Find the account selected by the user.
  const selectedBank = bankAccounts.find(
    (account) => account.id === bankAccountId
  );

  const isValidAmount =
    /^\d+$/.test(amount) &&
    Number.isSafeInteger(Number(amount)) &&
    Number(amount) > 0 &&
    Number(amount) <= 1_000_000;

  const handleWithdraw = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!isValidAmount || !bankAccountId || !selectedBank) {
      return;
    }

    setSuccessMessage("");
    setUpdatedBalance("");

    // Reuse the same key when retrying the same request.
    const key = idempotencyKey ?? crypto.randomUUID();

    setIdempotencyKey(key);

    try {
      const result = await withdrawalMutation.mutateAsync({
        payload: {
          amount: String(amount),
          bankAccountId,
        },
        idempotencyKey: key,
      });

      setSuccessMessage(result.message);
      setUpdatedBalance(result.balance);

      // Clear the form after successful processing.
      setAmount("");
      setBankAccountId("");
      setIdempotencyKey(null);
    } catch (error) {
      console.error("Withdrawal failed:", error);
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setIdempotencyKey(null);
    setSuccessMessage("");
  };

  const handleBankChange = (value: string) => {
    setBankAccountId(value);
    setIdempotencyKey(null);
    setSuccessMessage("");
  };

  const error = withdrawalMutation.error as
    | {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    | null;

  const errorMessage =
    error?.response?.data?.message ||
    "Something went wrong. Please try again.";

  return (
    <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">

      {/* Header */}
      <div className="mb-7">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19V5" />
              <path d="m5 12 7-7 7 7" />
            </svg>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Withdraw Money
            </h2>
            <p className="text-sm text-gray-500">
              Transfer money from your wallet.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleWithdraw} className="space-y-6">

        {/* Withdrawal Amount */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Withdrawal Amount
          </label>

          <div className="flex items-center rounded-xl border border-gray-200 px-4 dark:border-gray-800">
            <span className="text-lg font-medium text-gray-500">
              ₹
            </span>

            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full bg-transparent px-3 py-4 text-lg font-semibold text-gray-900 outline-none dark:text-white"
              disabled={withdrawalMutation.isPending}
            />
          </div>

          {amount && !isValidAmount && (
            <p className="mt-2 text-xs text-red-500">
              Enter a whole amount between ₹1 and ₹10,00,000.
            </p>
          )}
        </div>

        {/* Bank Account Selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Withdraw To
          </label>

          {isBankLoading ? (
            <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-800">
              Loading bank accounts...
            </div>
          ) : isBankError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
              <p className="text-sm text-red-600 dark:text-red-400">
                Failed to load bank accounts.
              </p>

              <button
                type="button"
                onClick={() => refetchBankAccounts()}
                className="mt-2 text-sm font-medium text-blue-600 hover:underline"
              >
                Try Again
              </button>
            </div>
          ) : bankAccounts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-5 text-center dark:border-gray-700">
              <p className="text-sm text-gray-500">
                No bank accounts available.
              </p>
            </div>
          ) : (
            <select
              value={bankAccountId}
              onChange={(e) => handleBankChange(e.target.value)}
              disabled={withdrawalMutation.isPending}
              required
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-4 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            >
              <option value="" disabled>
                Select a bank account
              </option>

              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bankName} •••• {account.accountNumber.slice(-4)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected Bank Details */}
        {selectedBank && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-gray-900 dark:text-white">
                {selectedBank.bankName}
              </p>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700 dark:bg-green-950 dark:text-green-400">
                Selected
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">
                  Account Holder
                </span>

                <span className="text-right text-gray-900 dark:text-white">
                  {selectedBank.accountHolder}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">
                  Account Number
                </span>

                <span className="text-gray-900 dark:text-white">
                  •••• {selectedBank.accountNumber.slice(-4)}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">
                  IFSC Code
                </span>

                <span className="text-gray-900 dark:text-white">
                  {selectedBank.ifscCode}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Error */}
        {withdrawalMutation.isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        {/* Withdrawal Success */}
        {successMessage && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
            <p className="font-semibold text-green-700 dark:text-green-400">
              {successMessage}
            </p>

            {updatedBalance && (
              <p className="mt-2 text-sm text-green-700 dark:text-green-400">
                Updated wallet balance: ₹{updatedBalance}
              </p>
            )}
          </div>
        )}

        {/* Withdrawal Summary */}
        {isValidAmount && selectedBank && (
          <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Withdrawal Amount
              </span>

              <span className="font-semibold text-gray-900 dark:text-white">
                ₹{Number(amount).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="mt-3 flex justify-between text-sm">
              <span className="text-gray-500">
                Destination
              </span>

              <span className="font-medium text-gray-900 dark:text-white">
                {selectedBank.bankName}
              </span>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={
            !isValidAmount ||
            !bankAccountId ||
            !selectedBank ||
            isBankLoading ||
            isBankError ||
            withdrawalMutation.isPending
          }
          className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-4 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {withdrawalMutation.isPending
            ? "Processing Withdrawal..."
            : "Withdraw Money"}
        </button>

      </form>

      <div className="mt-8 space-y-6">
  <WithdrawalHistory
    selectedWithdrawalId={selectedWithdrawalId}
    onSelectWithdrawal={setSelectedWithdrawalId}
  />

  {selectedWithdrawalId && (
    <WithdrawalDetails
      withdrawalId={selectedWithdrawalId}
      onClose={() => setSelectedWithdrawalId("")}
    />
  )}
</div>
    </div>
  );
}
