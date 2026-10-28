"use client";

import { useLinkBankAccount } from "@/src/hooks/useBank";
import { useState, type FormEvent, type ChangeEvent } from "react";

interface BankAccountFormData {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
}

const initialForm: BankAccountFormData = {
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  ifscCode: "",
};

const banks = [
  { value: "SBI", label: "State Bank of India (SBI)" },
  { value: "HDFC", label: "HDFC Bank" },
  { value: "ICICI", label: "ICICI Bank" },
  { value: "AXIS", label: "Axis Bank" },
  { value: "KOTAK", label: "Kotak Mahindra Bank" },
];

export default function LinkBankAccountForm() {
  const [form, setForm] = useState(initialForm);
  const [successMessage, setSuccessMessage] = useState("");

  const linkAccount = useLinkBankAccount();

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSuccessMessage("");
    linkAccount.reset();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage("");

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

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Link a bank account
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Add a bank account to your Finora profile.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Bank Selection */}
        <div>
          <label
            htmlFor="bankName"
            className="text-sm font-medium text-gray-700"
          >
            Select bank
          </label>

          <select
            id="bankName"
            name="bankName"
            value={form.bankName}
            onChange={handleChange}
            className={`${inputClass} cursor-pointer`}
            required
          >
            <option value="" disabled>
              Choose your bank
            </option>

            {banks.map((bank) => (
              <option key={bank.value} value={bank.value}>
                {bank.label}
              </option>
            ))}
          </select>
        </div>

        {/* Account Holder */}
        <div>
          <label
            htmlFor="accountHolder"
            className="text-sm font-medium text-gray-700"
          >
            Account holder
          </label>

          <input
            id="accountHolder"
            name="accountHolder"
            value={form.accountHolder}
            onChange={handleChange}
            placeholder="Enter account holder's name"
            className={inputClass}
            autoComplete="name"
            required
          />
        </div>

        {/* Account Number */}
        <div>
          <label
            htmlFor="accountNumber"
            className="text-sm font-medium text-gray-700"
          >
            Account number
          </label>

          <input
            id="accountNumber"
            name="accountNumber"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={form.accountNumber}
            onChange={handleChange}
            placeholder="Enter account number"
            className={inputClass}
            required
          />
        </div>

        {/* IFSC Code */}
        <div>
          <label
            htmlFor="ifscCode"
            className="text-sm font-medium text-gray-700"
          >
            IFSC code
          </label>

          <input
            id="ifscCode"
            name="ifscCode"
            value={form.ifscCode}
            onChange={handleChange}
            placeholder="e.g. SBIN0001234"
            className={inputClass}
            maxLength={11}
            autoCapitalize="characters"
            required
          />
        </div>

        {/* Error Message */}
        {linkAccount.isError && (
          <p role="alert" className="text-sm text-red-600">
            {(
              linkAccount.error as {
                response?: {
                  data?: { message?: string };
                };
              }
            )?.response?.data?.message ??
              "Unable to link the bank account. Please try again."}
          </p>
        )}

        {/* Success Message */}
        {successMessage && (
          <p
            role="status"
            className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
          >
            {successMessage}
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={linkAccount.isPending}
          className="w-full rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {linkAccount.isPending
            ? "Linking account..."
            : "Link Bank Account"}
        </button>
      </form>
    </section>
  );
}