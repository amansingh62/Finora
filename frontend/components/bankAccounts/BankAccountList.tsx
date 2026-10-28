"use client";

import type { BankAccount } from "@/types/bank";
import BankAccountCard from "./BankAccountCard";
import { useGetAllBankAccounts } from "@/src/hooks/useBank";

export default function BankAccountList() {
  const {
    data,
    isPending,
    isError,
    refetch,
  } = useGetAllBankAccounts();

  if (isPending) {
    return (
      <div className="py-12 text-center text-gray-500">
        Loading your bank accounts...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 p-6 text-center">
        <p className="text-red-600">
          Unable to load your bank accounts.
        </p>

        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

const accounts: BankAccount[] = data?.bankAccounts ?? [];

  if (accounts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          No bank accounts linked
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Link a bank account to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {accounts.map((account) => (
        <BankAccountCard
          key={account.id}
          account={account}
        />
      ))}
    </div>
  );
}