
"use client";

import { useGetWithdrawal } from "@/src/hooks/useWithdraw";

interface WithdrawalDetailsProps {
  withdrawalId: string;
  onClose: () => void;
}

export default function WithdrawalDetails({
  withdrawalId,
  onClose,
}: WithdrawalDetailsProps) {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetWithdrawal(withdrawalId);

  const withdrawal = data?.withdrawal;

  return (
    <section className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Withdrawal Details
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Detailed information about this withdrawal.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-gray-500 hover:text-red-500"
        >
          Close
        </button>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-sm text-gray-500">
          Loading withdrawal details...
        </p>
      ) : isError || !withdrawal ? (
        <div className="py-6 text-center">
          <p className="text-sm text-red-500">
            Failed to load withdrawal details.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 text-sm font-medium text-blue-600 hover:underline"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="space-y-4">

          <div className="rounded-xl bg-gray-50 p-5 text-center dark:bg-gray-900">
            <p className="text-sm text-gray-500">
              Withdrawal Amount
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              ₹{Number(withdrawal.amount).toLocaleString("en-IN")}
            </p>
            <span className="mt-3 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
              {withdrawal.status}
            </span>
          </div>

          <div className="space-y-4 text-sm">

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Withdrawal ID</span>
              <span className="break-all text-right text-gray-900 dark:text-white">
                {withdrawal.id}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Reference ID</span>
              <span className="break-all text-right text-gray-900 dark:text-white">
                {withdrawal.referenceId || "Pending"}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Requested At</span>
              <span className="text-right text-gray-900 dark:text-white">
                {withdrawal.requestedAt
                  ? new Date(withdrawal.requestedAt).toLocaleString("en-IN")
                  : "N/A"}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Completed At</span>
              <span className="text-right text-gray-900 dark:text-white">
                {withdrawal.completedAt
                  ? new Date(withdrawal.completedAt).toLocaleString("en-IN")
                  : "Not completed"}
              </span>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
