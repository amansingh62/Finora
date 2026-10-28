"use client";

import { useLinkBankAccount } from "@/src/hooks/useBank";
import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

interface BankAccountFormData {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
}

type FormErrors = Partial<Record<keyof BankAccountFormData, string>>;

const initialForm: BankAccountFormData = {
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  ifscCode: "",
};

const banks = [
  { value: "SBI", label: "State Bank of India (SBI)", short: "SBI", ifsc: "SBIN" },
  { value: "HDFC", label: "HDFC Bank", short: "HDFC Bank", ifsc: "HDFC" },
  { value: "ICICI", label: "ICICI Bank", short: "ICICI Bank", ifsc: "ICIC" },
  { value: "AXIS", label: "Axis Bank", short: "Axis Bank", ifsc: "UTIB" },
  { value: "KOTAK", label: "Kotak Mahindra Bank", short: "Kotak", ifsc: "KKBK" },
];

const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const fieldOrder: (keyof BankAccountFormData)[] = [
  "bankName",
  "accountHolder",
  "accountNumber",
  "ifscCode",
];

const inputBase =
  "w-full rounded-lg border bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#387ED1]/40 disabled:opacity-50";

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      {children}

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-rose-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-sm text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export default function LinkBankAccountForm() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState("");

  const linkAccount = useLinkBankAccount();

  const borderFor = (name: keyof BankAccountFormData) =>
    errors[name] ? "border-rose-400" : "border-slate-300 focus:border-[#387ED1]";

  const describedBy = (name: keyof BankAccountFormData, hasHint = false) =>
    errors[name] ? `${name}-error` : hasHint ? `${name}-hint` : undefined;

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    let next = value;
    if (name === "accountNumber") next = value.replace(/\D/g, "");
    if (name === "ifscCode") {
      next = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    }

    setForm((previous) => ({ ...previous, [name]: next }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));

    setSuccessMessage("");
    linkAccount.reset();
  };

  const validate = (): FormErrors => {
    const found: FormErrors = {};
    const bank = banks.find((item) => item.value === form.bankName);
    const accountNumber = form.accountNumber.trim();
    const ifsc = form.ifscCode.trim();

    if (!form.bankName) {
      found.bankName = "Choose your bank.";
    }

    if (!form.accountHolder.trim()) {
      found.accountHolder = "Enter the account holder's name.";
    }

    if (!accountNumber) {
      found.accountNumber = "Enter the account number.";
    } else if (accountNumber.length < 9 || accountNumber.length > 18) {
      found.accountNumber = "Account numbers are 9 to 18 digits long.";
    }

    if (!ifsc) {
      found.ifscCode = "Enter the IFSC code.";
    } else if (!IFSC_PATTERN.test(ifsc)) {
      found.ifscCode =
        "IFSC codes are 11 characters: 4 letters, a zero, then 6 letters or digits.";
    } else if (bank && !ifsc.startsWith(bank.ifsc)) {
      found.ifscCode = `This code doesn't look like a ${bank.short} IFSC. Check it against your cheque book or passbook.`;
    }

    return found;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage("");

    const found = validate();
    setErrors(found);

    const firstInvalid = fieldOrder.find((field) => found[field]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    try {
      const response = await linkAccount.mutateAsync({
        bankName: form.bankName,
        accountHolder: form.accountHolder.trim(),
        accountNumber: form.accountNumber.trim(),
        ifscCode: form.ifscCode.trim().toUpperCase(),
      });

      setSuccessMessage(
        response?.message ?? "Bank account linked successfully."
      );

      setForm(initialForm);
    } catch {
      // The mutation error is displayed below.
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Bank */}
      <Field id="bankName" label="Bank" error={errors.bankName}>
        <div className="relative">
          <select
            id="bankName"
            name="bankName"
            value={form.bankName}
            onChange={handleChange}
            disabled={linkAccount.isPending}
            aria-invalid={!!errors.bankName}
            aria-describedby={describedBy("bankName")}
            className={`${inputBase} ${borderFor(
              "bankName"
            )} cursor-pointer appearance-none pr-11 ${
              form.bankName ? "" : "text-slate-400"
            }`}
          >
            <option value="" disabled>
              Choose your bank
            </option>

            {banks.map((bank) => (
              <option key={bank.value} value={bank.value} className="text-slate-900">
                {bank.label}
              </option>
            ))}
          </select>

          <svg
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </Field>

      {/* Account holder */}
      <Field
        id="accountHolder"
        label="Account holder name"
        error={errors.accountHolder}
        hint="Enter it exactly as it appears on the account."
      >
        <input
          id="accountHolder"
          name="accountHolder"
          value={form.accountHolder}
          onChange={handleChange}
          disabled={linkAccount.isPending}
          placeholder="Full name"
          autoComplete="name"
          aria-invalid={!!errors.accountHolder}
          aria-describedby={describedBy("accountHolder", true)}
          className={`${inputBase} ${borderFor("accountHolder")}`}
        />
      </Field>

      {/* Account number + IFSC */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="accountNumber"
          label="Account number"
          error={errors.accountNumber}
        >
          <input
            id="accountNumber"
            name="accountNumber"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={18}
            value={form.accountNumber}
            onChange={handleChange}
            disabled={linkAccount.isPending}
            placeholder="Digits only"
            aria-invalid={!!errors.accountNumber}
            aria-describedby={describedBy("accountNumber")}
            className={`${inputBase} ${borderFor("accountNumber")} tabular-nums`}
          />
        </Field>

        <Field
          id="ifscCode"
          label="IFSC code"
          error={errors.ifscCode}
          hint="11 characters, on your cheque book."
        >
          <input
            id="ifscCode"
            name="ifscCode"
            value={form.ifscCode}
            onChange={handleChange}
            disabled={linkAccount.isPending}
            placeholder="SBIN0001234"
            maxLength={11}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={!!errors.ifscCode}
            aria-describedby={describedBy("ifscCode", true)}
            className={`${inputBase} ${borderFor("ifscCode")} tabular-nums`}
          />
        </Field>
      </div>

      {/* Server error */}
      {linkAccount.isError && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {(
            linkAccount.error as {
              response?: { data?: { message?: string } };
            }
          )?.response?.data?.message ??
            "We couldn't link this account. Check the details and try again."}
        </div>
      )}

      {/* Success */}
      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <svg
            className="h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          {successMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={linkAccount.isPending}
        aria-busy={linkAccount.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#387ED1] px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#2F6FBD] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#387ED1] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {linkAccount.isPending && (
          <svg
            className="h-4 w-4 animate-spin motion-reduce:animate-none"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeWidth="3"
            />
            <path
              d="M21 12a9 9 0 00-9-9"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        )}
        {linkAccount.isPending ? "Linking account" : "Link account"}
      </button>
    </form>
  );
}