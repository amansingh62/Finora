"use client";

import type { BankAccount } from "@/types/bank";
import BankAccountCard from "./BankAccountCard";
import { useGetAllBankAccounts } from "@/src/hooks/useBank";

function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 motion-reduce:animate-none"
    >
      <div className="h-4 w-32 rounded bg-slate-200" />
      <div className="mt-8 h-6 w-56 rounded bg-slate-200" />

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <div className="h-3 w-24 rounded bg-slate-100" />
          <div className="mt-2 h-4 w-32 rounded bg-slate-200" />
        </div>
        <div>
          <div className="h-3 w-10 rounded bg-slate-100" />
          <div className="mt-2 h-4 w-24 rounded bg-slate-200" />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4">
        <div className="h-9 w-28 rounded-lg bg-slate-200" />
        <div className="ml-auto h-9 w-16 rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}

export default function BankAccountList() {
  const { data, isPending, isError, isFetching, refetch } =
    useGetAllBankAccounts();

  if (isPending) {
    return (
      <div aria-busy="true">
        <span role="status" className="sr-only">
          Loading your bank accounts
        </span>

        <div className="grid gap-5 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-rose-200 bg-white p-8 text-center"
      >
        <h3 className="text-base font-semibold text-slate-900">
          We couldn&apos;t load your bank accounts
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Check your connection and try again.
        </p>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="mt-5 rounded-lg bg-[#387ED1] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2F6FBD] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#387ED1] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isFetching ? "Trying again" : "Try again"}
        </button>
      </div>
    );
  }

  const accounts: BankAccount[] = data?.bankAccounts ?? [];

  if (accounts.length === 0) {
    // An empty slot shaped like the cards that will fill it
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 sm:p-8">
        <p
          aria-hidden="true"
          className="text-[26px] font-medium leading-none tabular-nums tracking-[0.18em] text-slate-300"
        >
          •••• •••• ••••
        </p>

        <h3 className="mt-6 text-lg font-semibold text-slate-900">
          No bank accounts linked yet
        </h3>

        <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
          Use &ldquo;Link bank account&rdquo; at the top of the page to add one.
          Your first account becomes the primary account.
        </p>
      </div>
    );
  }

  // Primary account first, then the rest in their original order
  const sorted = [...accounts].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary)
  );

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {sorted.map((account) => (
        <BankAccountCard key={account.id} account={account} />
      ))}
    </div>
  );
}