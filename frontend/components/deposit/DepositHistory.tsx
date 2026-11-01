
"use client";

import { useGetAllDeposits } from "@/src/hooks/useDeposit";

interface DepositRecord {
  id: string;
  amount: string;
  status: string;
  referenceId: string | null;
  requestedAt: string;
  createdAt: string;
  bankAccount?: {
    bankName: string;
  } | null;
}

interface DepositHistoryProps {
  selectedDepositId: string;
  onSelectDeposit: (id: string) => void;
}

export default function DepositHistory({
  selectedDepositId,
  onSelectDeposit,
}: DepositHistoryProps) {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetAllDeposits();

  const deposits: DepositRecord[] = data?.deposits ?? [];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";

      case "FAILED":
        return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";

      case "PROCESSING":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400";

      default:
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400";
    }
  };

  return (
    <section className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Deposit History
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            View and track your previous deposits.
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
          Loading deposits...
        </p>
      ) : isError ? (
        <div className="py-6 text-center">
          <p className="text-sm text-red-500">
            Failed to load deposit history.
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 text-sm font-medium text-blue-600 hover:underline"
          >
            Try Again
          </button>
        </div>
      ) : deposits.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
          <p className="font-medium text-gray-700 dark:text-gray-300">
            No deposits yet
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Your deposit history will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {deposits.map((deposit) => (
            <button
              key={deposit.id}
              type="button"
              onClick={() => onSelectDeposit(deposit.id)}
              className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition ${
                selectedDepositId === deposit.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-gray-200 hover:border-blue-400 dark:border-gray-800"
              }`}
            >
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white">
                  ₹{Number(deposit.amount).toLocaleString("en-IN")}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {deposit.bankAccount?.bankName ?? "Bank account"}
                </p>

                <p className="mt-1 truncate text-xs text-gray-400">
                  {deposit.referenceId || "Reference pending"}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {new Date(
                    deposit.requestedAt || deposit.createdAt
                  ).toLocaleDateString("en-IN")}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                  deposit.status
                )}`}
              >
                {deposit.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
