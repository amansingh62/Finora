"use client";

import { useEffect, useRef, useState } from "react";
import BankAccountList from "./BankAccountList";
import LinkBankAccountForm from "./LinkBankAccountForm";

const panelCss = `
@keyframes bank-panel-in {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
.bank-panel-in { animation: bank-panel-in 0.25s ease-out; }
@media (prefers-reduced-motion: reduce) {
  .bank-panel-in { animation: none; }
}
`;

export default function BankAccounts() {
  const [showForm, setShowForm] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Move focus into the form when it opens so keyboard users can start typing
  useEffect(() => {
    if (!showForm) return;

    const firstField = panelRef.current?.querySelector<HTMLElement>(
      "input, select, textarea"
    );
    firstField?.focus();
  }, [showForm]);

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 md:px-10">
      <style>{panelCss}</style>

      <div className="mx-auto max-w-5xl">
        {/* Page header */}
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Bank Details
            </h1>

            <p className="mt-2 max-w-md text-[15px] leading-6 text-slate-500">
              The accounts you&apos;ve linked to Finora. Your primary account is
              the highlighted card.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((previous) => !previous)}
            aria-expanded={showForm}
            aria-controls="link-bank-account-panel"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#387ED1] px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#2F6FBD] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#387ED1]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
              className={`transition-transform duration-200 motion-reduce:transition-none ${
                showForm ? "rotate-45" : ""
              }`}
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            {showForm ? "Cancel" : "Link bank account"}
          </button>
        </header>

        {/* Link form: guidance on the left, fields on the right */}
        {showForm && (
          <div
            id="link-bank-account-panel"
            ref={panelRef}
            role="region"
            aria-labelledby="link-bank-account-title"
            onKeyDown={(event) => {
              if (event.key === "Escape") setShowForm(false);
            }}
            className="bank-panel-in mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
          >
            <div className="border-b border-slate-200 bg-slate-50 p-6 sm:p-8 md:border-b-0 md:border-r">
              <h2
                id="link-bank-account-title"
                className="text-lg font-semibold text-slate-900"
              >
                Link a bank account
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Keep these handy: the account holder&apos;s name, the account
                number and the branch IFSC code.
              </p>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                After linking, only the last four digits of the account number
                are shown.
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <LinkBankAccountForm />
            </div>
          </div>
        )}

        {/* Linked accounts */}
        <section aria-labelledby="linked-accounts-title" className="mt-10">
          <h2 id="linked-accounts-title" className="sr-only">
            Linked accounts
          </h2>

          <BankAccountList />
        </section>
      </div>
    </main>
  );
}