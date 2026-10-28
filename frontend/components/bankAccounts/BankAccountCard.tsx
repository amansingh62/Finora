"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useMakePrimaryAccount, useUnlinkAccount } from "@/src/hooks/useBank";
import type { BankAccount } from "@/types/bank";

interface BankAccountCardProps {
  account: BankAccount;
}

const dialogCss = `
@keyframes unlink-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes unlink-pop {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.unlink-backdrop { animation: unlink-fade 0.15s ease-out; }
.unlink-dialog { animation: unlink-pop 0.2s ease-out; }
@media (prefers-reduced-motion: reduce) {
  .unlink-backdrop, .unlink-dialog { animation: none; }
}
`;

export default function BankAccountCard({ account }: BankAccountCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const makePrimary = useMakePrimaryAccount();
  const unlink = useUnlinkAccount();

  const unlinkButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const isMakingPrimary =
    makePrimary.isPending && makePrimary.variables === account.id;

  const isUnlinking = unlink.isPending && unlink.variables === account.id;

  const lastFour = account.accountNumber.slice(-4);
  const primary = account.isPrimary;

  const closeConfirm = () => {
    if (unlink.isPending) return;
    setShowConfirm(false);
  };

  const handleUnlink = () => {
    unlink.mutate(account.id, {
      onSuccess: () => {
        setShowConfirm(false);
      },
    });
  };

  // While the dialog is open: lock page scroll, focus the safe option,
  // close on Escape, and return focus to the Unlink button afterwards.
  useEffect(() => {
    if (!showConfirm) return;

    const trigger = unlinkButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && !unlink.isPending) {
        setShowConfirm(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [showConfirm, unlink.isPending]);

  // Keep Tab inside the dialog
  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      "button:not(:disabled)"
    );
    if (!focusable || focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      {/* The primary account is the filled navy card; the rest stay white */}
      <article
        className={`flex flex-col rounded-2xl border p-6 transition-colors duration-300 motion-reduce:transition-none ${
          primary
            ? "border-[#0E2747] bg-[#0E2747] text-white"
            : "border-slate-200 bg-white text-slate-900"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="min-w-0 truncate text-base font-semibold">
            {account.bankName}
          </h3>

          {primary && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-[#9CC6F5]">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              Primary
            </span>
          )}
        </div>

        {/* Masked number is the hero of the card */}
        <p className="mt-8 text-[26px] font-medium leading-none tabular-nums tracking-[0.18em]">
          <span aria-hidden="true">•••• •••• {lastFour}</span>
          <span className="sr-only">Account number ending in {lastFour}</span>
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="min-w-0">
            <dt className={primary ? "text-[#B9CCE6]" : "text-slate-500"}>
              Account holder
            </dt>
            <dd className="mt-1 truncate font-medium">
              {account.accountHolder}
            </dd>
          </div>

          <div>
            <dt className={primary ? "text-[#B9CCE6]" : "text-slate-500"}>
              IFSC
            </dt>
            <dd className="mt-1 font-medium tabular-nums">
              {account.ifscCode}
            </dd>
          </div>
        </dl>

        <div
          className={`mt-6 flex items-center gap-2 border-t pt-4 ${
            primary ? "border-white/10" : "border-slate-100"
          }`}
        >
          {!primary && (
            <button
              type="button"
              disabled={makePrimary.isPending}
              onClick={() => makePrimary.mutate(account.id)}
              className="rounded-lg bg-[#387ED1] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2F6FBD] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#387ED1] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isMakingPrimary ? "Updating" : "Make primary"}
            </button>
          )}

          <button
            ref={unlinkButtonRef}
            type="button"
            disabled={unlink.isPending}
            onClick={() => setShowConfirm(true)}
            className={`ml-auto rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              primary
                ? "text-rose-300 hover:bg-white/10 focus-visible:outline-white"
                : "text-rose-600 hover:bg-rose-50 focus-visible:outline-rose-500"
            }`}
          >
            {isUnlinking ? "Unlinking" : "Unlink"}
          </button>
        </div>

        {makePrimary.isError && (
          <p
            role="alert"
            className={`mt-3 text-sm ${
              primary ? "text-rose-300" : "text-rose-600"
            }`}
          >
            Couldn&apos;t update your primary account. Try again.
          </p>
        )}

        {unlink.isError && !showConfirm && (
          <p
            role="alert"
            className={`mt-3 text-sm ${
              primary ? "text-rose-300" : "text-rose-600"
            }`}
          >
            Couldn&apos;t unlink this account. Try again.
          </p>
        )}
      </article>

      {showConfirm && (
        <div
          className="unlink-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={closeConfirm}
        >
          <style>{dialogCss}</style>

          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="unlink-title"
            aria-describedby="unlink-description"
            onKeyDown={trapFocus}
            onClick={(e) => e.stopPropagation()}
            className="unlink-dialog w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-7"
          >
            <h2
              id="unlink-title"
              className="text-xl font-semibold text-slate-900"
            >
              Unlink this account?
            </h2>

            {/* Confirm which account is being removed */}
            <div className="mt-4 flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-4 py-3">
              <span className="truncate text-sm font-medium text-slate-900">
                {account.bankName}
              </span>
              <span className="shrink-0 text-sm tabular-nums text-slate-600">
                •••• {lastFour}
              </span>
            </div>

            <p
              id="unlink-description"
              className="mt-4 text-sm leading-6 text-slate-500"
            >
              It will be removed from Finora. To use it again, you&apos;ll need to
              link it again.
            </p>

            {unlink.isError && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                Couldn&apos;t unlink this account. Try again.
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                ref={cancelButtonRef}
                type="button"
                disabled={unlink.isPending}
                onClick={closeConfirm}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#387ED1] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={unlink.isPending}
                onClick={handleUnlink}
                className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {unlink.isPending ? "Unlinking" : "Unlink account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}