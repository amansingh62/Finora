
import Withdraw from "@/components/withdraw/Withdraw";

export default function WithdrawPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-black sm:px-6">
      <div className="mx-auto max-w-5xl">

        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-blue-600">
            FINORA / WALLET
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Withdraw Money
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Withdraw funds from your wallet to your linked bank account.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">

          <section>
            <Withdraw />
          </section>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Withdrawal Information
              </h2>

              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    Processing
                  </p>
                  <p className="mt-1 text-gray-500">
                    Your withdrawal request is processed by Finora.
                  </p>
                </div>

                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    Bank Account
                  </p>
                  <p className="mt-1 text-gray-500">
                    Select a bank account linked to your profile.
                  </p>
                </div>

                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    Transaction History
                  </p>
                  <p className="mt-1 text-gray-500">
                    Track your withdrawal status and reference ID.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/30">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300">
                Security Reminder
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-blue-700 dark:text-blue-400">
                Always verify your destination bank account before confirming a withdrawal.
              </p>
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}
