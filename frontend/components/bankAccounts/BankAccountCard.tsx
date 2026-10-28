"use client";

import { useState } from "react";
import { useMakePrimaryAccount, useUnlinkAccount } from "@/src/hooks/useBank";
import type { BankAccount } from "@/types/bank";

interface BankAccountCardProps {
  account: BankAccount;
}

export default function BankAccountCard({ account }: BankAccountCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const makePrimary = useMakePrimaryAccount();
  const unlink = useUnlinkAccount();

  const isMakingPrimary =
    makePrimary.isPending && makePrimary.variables === account.id;

  const isUnlinking = unlink.isPending && unlink.variables === account.id;

  const handleUnlink = () => {
    unlink.mutate(account.id, {
      onSuccess: () => {
        setShowConfirm(false);
      },
    });
  };

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {account.bankName}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {account.accountHolder}
            </p>

            <p className="mt-3 text-sm text-gray-700">
              Account ending in {account.accountNumber.slice(-4)}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              IFSC: {account.ifscCode}
            </p>
          </div>

          {account.isPrimary && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              Primary
            </span>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {!account.isPrimary && (
            <button
              type="button"
              disabled={makePrimary.isPending}
              onClick={() => makePrimary.mutate(account.id)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isMakingPrimary ? "Updating..." : "Make Primary"}
            </button>
          )}

          <button
            type="button"
            disabled={unlink.isPending}
            onClick={() => setShowConfirm(true)}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUnlinking ? "Unlinking..." : "Unlink"}
          </button>
        </div>

        {makePrimary.isError && (
          <p className="mt-3 text-sm text-red-600">
            Failed to update the primary account.
          </p>
        )}

        {unlink.isError && (
          <p className="mt-3 text-sm text-red-600">
            Failed to unlink the account.
          </p>
        )}
      </div>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            if (!unlink.isPending) {
              setShowConfirm(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="unlink-title"
            aria-describedby="unlink-description"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-6 w-6 text-red-600"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m0 3h.008v.008H12v-.008ZM10.29 3.86 1.82 18.14A2.25 2.25 0 0 0 3.75 21.5h16.5a2.25 2.25 0 0 0 1.93-3.36L13.71 3.86a2 2 0 0 0-3.42 0Z"
                />
              </svg>
            </div>

            <h2
              id="unlink-title"
              className="text-xl font-semibold text-gray-900"
            >
              Unlink bank account?
            </h2>

            <p
              id="unlink-description"
              className="mt-2 text-sm leading-6 text-gray-500"
            >
              Are you sure you want to unlink{" "}
              <span className="font-medium text-gray-800">
                {account.bankName}
              </span>
              , ending in{" "}
              <span className="font-medium text-gray-800">
                {account.accountNumber.slice(-4)}
              </span>
              ? This action cannot be undone from this screen.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={unlink.isPending}
                onClick={() => setShowConfirm(false)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={unlink.isPending}
                onClick={handleUnlink}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {unlink.isPending ? "Unlinking..." : "Yes, unlink"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
