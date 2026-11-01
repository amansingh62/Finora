
import Deposit from "@/components/deposit/Deposit";

export default function DepositPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-black sm:px-6">
      <div className="mx-auto max-w-5xl">

        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-blue-600">
            FINORA / WALLET
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Deposit Money
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Add funds to your wallet from your linked bank account.
          </p>
        </div>

        <Deposit />
      </div>
    </main>
  );
}
