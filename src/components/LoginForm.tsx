"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="flex flex-col gap-4 text-ink">
      <label className="flex flex-col gap-1.5 text-sm font-bold text-ink-muted">
        Admin password
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="min-h-11 rounded-lg border border-ivory-line bg-white px-3 text-ink focus:border-brass-dark focus:outline-none"
        />
      </label>
      {state.error && <p className="text-sm font-semibold text-chip-dark">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-full bg-felt px-7 font-bold text-ivory hover:bg-felt-light disabled:opacity-50"
      >
        {pending ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
