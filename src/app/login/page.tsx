"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) setMessage("That sign-in link didn’t work. It may have expired – please try again.");
    if (params.get("deleted")) setMessage("Your account and all your data have been deleted.");
  }, []);

  const redirectTo = () => `${window.location.origin}/auth/callback`;

  async function signInWithGoogle() {
    setMessage(null);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) setMessage(error.message);
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("sending");
    setMessage(null);
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo() },
    });
    if (error) {
      setState("idle");
      setMessage(error.message);
    } else {
      setState("sent");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center px-5 py-10 pt-safe">
      <div className="mb-8 flex items-center gap-3">
        <img src="/icons/icon-192.png" alt="" width={44} height={44} className="rounded-xl" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daybook</h1>
          <p className="text-muted">Plan the day. Track the habits. See the year.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
        <button
          type="button"
          onClick={signInWithGoogle}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-card px-4 py-3 font-bold hover:bg-bg"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-sm text-muted">
          <span className="h-px flex-1 bg-line" />
          or use your email
          <span className="h-px flex-1 bg-line" />
        </div>

        {state === "sent" ? (
          <p className="rounded-xl bg-accent-soft p-4">
            Check your inbox. We’ve sent a sign-in link to <strong>{email}</strong>. Open it on this device.
          </p>
        ) : (
          <form onSubmit={sendLink} className="flex flex-col gap-3">
            <label htmlFor="email" className="text-sm font-bold">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-xl border border-line bg-bg px-4 py-3 outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={state === "sending"}
              className="rounded-xl bg-accent px-4 py-3 font-bold text-accent-ink disabled:opacity-60"
            >
              {state === "sending" ? "Sending…" : "Email me a sign-in link"}
            </button>
          </form>
        )}

        {message && <p className="mt-4 text-sm text-high">{message}</p>}
      </div>

      <p className="mt-6 text-center text-sm text-muted">Your data is private to your account.</p>
    </main>
  );
}
