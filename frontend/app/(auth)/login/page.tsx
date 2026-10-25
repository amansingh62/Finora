"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import api from "@/lib/api";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      setEmail("");
      setPassword("");

      router.push("/dashboard");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.message || "Login failed."
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white p-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-[#387ED1]/[0.08] blur-[140px]" />

      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[420px] w-[420px] rounded-full bg-[#387ED1]/[0.06] blur-[140px]" />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-3"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#387ED1] text-white shadow-[0_0_25px_-5px_rgba(56,126,209,0.35)]">
            <svg
              width="22"
              height="22"
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

          <span className="text-xl font-semibold tracking-wide text-gray-900">
            Finora
            <span className="text-[#387ED1]">.</span>
          </span>
        </Link>

        {/* Login form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-200/60"
        >
          <h1 className="text-center text-2xl font-semibold text-gray-900">
            Welcome back
          </h1>

          <p className="mt-2 text-center text-sm text-gray-500">
            Log in to your trading account
          </p>

          <div className="mt-8 space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-medium text-gray-600"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[#387ED1] disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-medium text-gray-600"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 pr-12 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[#387ED1] disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-900"
                >
                  {showPassword ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                      <path d="M9.9 4.2A9.1 9.1 0 0112 4c5 0 9 4.5 10 8a11.8 11.8 0 01-4 5.3" />
                      <path d="M6.2 6.2A12.7 12.7 0 002 12c1 3.5 5 8 10 8a10.5 10.5 0 005.1-1.3" />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Forgot password */}
              <div className="mt-3 flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#387ED1] transition-colors hover:text-blue-700"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600"
              >
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#387ED1] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#2F6FBD] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </div>

          {/* Register link */}
          <p className="mt-7 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-[#387ED1] transition-colors hover:text-blue-700"
            >
              Sign up
            </Link>
          </p>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs leading-5 text-gray-500">
          Secure access to your trading dashboard.
          <br />
          Built for your Finora clone project.
        </p>
      </div>
    </div>
  );
}