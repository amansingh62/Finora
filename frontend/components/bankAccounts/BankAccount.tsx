"use client";

import { useState } from "react";
import BankAccountList from "./BankAccountList";
import LinkBankAccountForm from "./LinkBankAccountForm";

export default function BankAccounts() {
  const [showForm, setShowForm] = useState(false);

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-10 md:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Bank Accounts
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Manage your linked accounts and primary bank account.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((previous) => !previous)}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            {showForm ? "Close Form" : "+ Link Bank Account"}
          </button>
        </header>

        {showForm && (
          <div className="mb-8">
            <LinkBankAccountForm />
          </div>
        )}

        <section>
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Accounts
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              View and manage your linked bank accounts.
            </p>
          </div>

          <BankAccountList />
        </section>
      </div>
    </main>
  );
}