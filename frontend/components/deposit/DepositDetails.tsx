
"use client";

import { useGetDeposit } from "@/src/hooks/useDeposit";

interface DepositDetailsProps {
  depositId: string;
  onClose: () => void;
}

export default function DepositDetails({
  depositId,
  onClose,
}: DepositDetailsProps) {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetDeposit(depositId);

  const deposit = data?.deposit;

  return (
    <section className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Deposit Details
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Detailed information about this deposit.
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
          Loading deposit details...
        </p>
      ) : isError || !deposit ? (
        <div className="py-6 text-center">
          <p className="text-sm text-red-500">
            Failed to load deposit details.
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

          {/* Amount */}
          <div className="rounded-xl bg-gray-50 p-5 text-center dark:bg-gray-900">
            <p className="text-sm text-gray-500">
              Deposit Amount
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              ₹{Number(deposit.amount).toLocaleString("en-IN")}
            </p>

            <span className="mt-3 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
              {deposit.status}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-4 text-sm">

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Deposit ID</span>

              <span className="break-all text-right text-gray-900 dark:text-white">
                {deposit.id}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Reference ID</span>

              <span className="break-all text-right text-gray-900 dark:text-white">
                {deposit.referenceId || "Pending"}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">From Bank</span>

              <span className="text-right text-gray-900 dark:text-white">
                {deposit.bankAccount?.bankName || "N/A"}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Requested At</span>

              <span className="text-right text-gray-900 dark:text-white">
                {deposit.requestedAt
                  ? new Date(deposit.requestedAt).toLocaleString("en-IN")
                  : "N/A"}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Completed At</span>

              <span className="text-right text-gray-900 dark:text-white">
                {deposit.completedAt
                  ? new Date(deposit.completedAt).toLocaleString("en-IN")
                  : "Not completed"}
              </span>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
