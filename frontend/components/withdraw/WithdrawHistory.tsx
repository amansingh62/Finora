
"use client";

import { useGetAllWithdrawals } from "@/src/hooks/useWithdraw";

interface Withdrawal {
  id: string;
  amount: string;
  status: string;
  referenceId: string | null;
  requestedAt: string;
  completedAt: string | null;
  createdAt: string;

  bankAccount: {
    bankName: string
  } | null;
}

interface WithdrawalHistoryProps {
  onSelectWithdrawal: (id: string) => void;
  selectedWithdrawalId: string;
}

export default function WithdrawalHistory({
  onSelectWithdrawal,
  selectedWithdrawalId,
}: WithdrawalHistoryProps) {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetAllWithdrawals();

  const withdrawals: Withdrawal[] = data?.withdrawals ?? [];

  return (
    <section className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Withdrawal History
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View and track your previous withdrawals.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading}
          className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-sm text-gray-500">
          Loading withdrawals...
        </p>
      ) : isError ? (
        <div className="py-6 text-center">
          <p className="text-sm text-red-500">
            Failed to load withdrawal history.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 text-sm font-medium text-blue-600 hover:underline"
          >
            Try Again
          </button>
        </div>
      ) : withdrawals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
          <p className="font-medium text-gray-700 dark:text-gray-300">
            No withdrawals yet
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Your withdrawal history will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((withdrawal) => (
            <button
              key={withdrawal.id}
              type="button"
              onClick={() => onSelectWithdrawal(withdrawal.id)}
              className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition ${
                selectedWithdrawalId === withdrawal.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-gray-200 hover:border-blue-400 dark:border-gray-800"
              }`}
            >
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white">
                  ₹{Number(withdrawal.amount).toLocaleString("en-IN")}
                </p>

                <p className="mt-1 truncate text-xs text-gray-500">
                  {withdrawal.referenceId || "Reference pending"}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {new Date(
                    withdrawal.requestedAt || withdrawal.createdAt
                  ).toLocaleDateString("en-IN")}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  withdrawal.status === "SUCCESS"
                    ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                    : withdrawal.status === "FAILED"
                    ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                }`}
              >
                {withdrawal.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
