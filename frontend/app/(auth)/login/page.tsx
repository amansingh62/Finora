"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import api from "@/lib/api";

type FieldErrors = { email?: string; password?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sample data for the side panel (not live prices)
const watchlist = [
  { name: "NIFTY 50", value: "24,812.35", change: "+0.62%", up: true },
  { name: "SENSEX", value: "81,204.10", change: "+0.55%", up: true },
  { name: "BANKNIFTY", value: "53,017.80", change: "-0.18%", up: false },
];

const animationCss = `
@keyframes fin-draw { to { stroke-dashoffset: 0; } }
@keyframes fin-fade { to { opacity: 1; } }
.fin-line {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: fin-draw 2.4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards;
}
.fin-area, .fin-dot {
  opacity: 0;
  animation: fin-fade 0.8s ease 2.4s forwards;
}
@media (prefers-reduced-motion: reduce) {
  .fin-line { animation: none; stroke-dashoffset: 0; }
  .fin-area, .fin-dot { animation: none; opacity: 1; }
}
`;

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (!email.trim()) {
      errors.email = "Enter your email address.";
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = "Enter a valid email address, like you@example.com.";
    }

    if (!password) {
      errors.password = "Enter your password.";
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errors = validate();
    setFieldErrors(errors);
    setError("");

    if (errors.email || errors.password) {
      document.getElementById(errors.email ? "email" : "password")?.focus();
      return;
    }

    try {
      setLoading(true);

      await api.post(
        "/auth/login",
        { email: email.trim(), password },
        { timeout: 35_000 }
      );

      setEmail("");
      setPassword("");

      router.push("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.code === "ECONNABORTED") {
          setError("The server took too long to respond. Try again in a moment.");
        } else if (!err.response) {
          setError("Can't reach the server. Check your connection and try again.");
        } else {
          setError(err.response.data?.message || "Email or password is incorrect.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "w-full rounded-lg border bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#387ED1]/40 disabled:opacity-50";

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr]">
      <style>{animationCss}</style>

      {/* Brand panel */}
      <aside
        aria-hidden="true"
        className="relative hidden flex-col justify-between overflow-hidden bg-[#0E2747] p-12 text-white lg:flex"
      >
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#387ED1]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 17l6-6 4 4 8-9" />
              <path d="M15 6h6v6" />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-wide">
            Finora<span className="text-[#6FA8E8]">.</span>
          </span>
        </Link>

        <div>
          <h2 className="max-w-md text-4xl font-semibold leading-[1.15] tracking-tight">
            Pick up where you left the market.
          </h2>
          <p className="mt-4 max-w-sm text-[15px] leading-7 text-[#B9CCE6]">
            Your watchlists, positions and orders are waiting on the other side
            of the login.
          </p>

          {/* The one memorable element: a price line that draws itself */}
          <svg
            viewBox="0 0 480 200"
            className="mt-10 w-full max-w-xl overflow-visible"
            fill="none"
          >
            <defs>
              <linearGradient id="fin-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6FA8E8" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#6FA8E8" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[50, 100, 150].map((y) => (
              <line
                key={y}
                x1="0"
                x2="480"
                y1={y}
                y2={y}
                stroke="#FFFFFF"
                strokeOpacity="0.08"
              />
            ))}

            <path
              className="fin-area"
              d="M0 150 L40 140 L80 148 L120 120 L160 128 L200 100 L240 110 L280 80 L320 92 L360 60 L400 70 L464 40 L464 200 L0 200 Z"
              fill="url(#fin-fill)"
            />
            <path
              className="fin-line"
              pathLength={1}
              d="M0 150 L40 140 L80 148 L120 120 L160 128 L200 100 L240 110 L280 80 L320 92 L360 60 L400 70 L464 40"
              stroke="#8DBBF2"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle className="fin-dot" cx="464" cy="40" r="5" fill="#8DBBF2" />
          </svg>
        </div>

        <div>
          <ul className="max-w-md divide-y divide-white/10 border-y border-white/10">
            {watchlist.map((item) => (
              <li
                key={item.name}
                className="flex items-center justify-between py-3 text-sm"
              >
                <span className="font-medium">{item.name}</span>
                <span className="flex items-baseline gap-4 tabular-nums">
                  <span className="text-[#B9CCE6]">{item.value}</span>
                  <span
                    className={
                      item.up ? "text-emerald-300" : "text-rose-300"
                    }
                  >
                    {item.change}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[#7F9AC0]">Sample data for preview.</p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          {/* Brand (mobile only, the panel is hidden below lg) */}
          <Link href="/" className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#387ED1] text-white">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 17l6-6 4 4 8-9" />
                <path d="M15 6h6v6" />
              </svg>
            </span>
            <span className="text-lg font-semibold tracking-wide text-slate-900">
              Finora<span className="text-[#387ED1]">.</span>
            </span>
          </Link>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Log in to Finora
          </h1>
          <p className="mt-2 text-[15px] text-slate-500">
            Use the email and password you registered with.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                autoFocus
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                className={`${inputBase} ${
                  fieldErrors.email
                    ? "border-rose-400"
                    : "border-slate-300 focus:border-[#387ED1]"
                }`}
              />
              {fieldErrors.email && (
                <p id="email-error" className="mt-1.5 text-sm text-rose-600">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="rounded text-sm text-[#2F6FBD] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#387ED1]"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={(e) =>
                    setCapsLock(e.getModifierState("CapsLock"))
                  }
                  onBlur={() => setCapsLock(false)}
                  disabled={loading}
                  autoComplete="current-password"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={
                    fieldErrors.password
                      ? "password-error"
                      : capsLock
                      ? "caps-hint"
                      : undefined
                  }
                  className={`${inputBase} pr-16 ${
                    fieldErrors.password
                      ? "border-rose-400"
                      : "border-slate-300 focus:border-[#387ED1]"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-pressed={showPassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-sm font-medium text-slate-500 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-[#387ED1]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {fieldErrors.password && (
                <p id="password-error" className="mt-1.5 text-sm text-rose-600">
                  {fieldErrors.password}
                </p>
              )}
              {!fieldErrors.password && capsLock && (
                <p id="caps-hint" className="mt-1.5 text-sm text-amber-700">
                  Caps Lock is on.
                </p>
              )}
            </div>

            {/* Server error */}
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#387ED1] py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#2F6FBD] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#387ED1] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
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
              {loading ? "Logging in" : "Log in"}
            </button>
          </form>

          <p className="mt-8 text-sm text-slate-500">
            New to Finora?{" "}
            <Link
              href="/register"
              className="font-medium text-[#2F6FBD] hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}