"use client";

import { useActionState, useId } from "react";
import { signUp, type SignUpState } from "@/app/sessions/actions";

/**
 * Public sign-up: one name field with the known players as suggestions. An existing name or
 * alias signs that player up; a new name creates the player.
 */
export function SignUpForm({ sessionId, suggestions }: { sessionId: number; suggestions: string[] }) {
  const [state, action, pending] = useActionState<SignUpState, FormData>(signUp, {});
  const listId = useId();
  return (
    <form action={action} className="flex flex-col gap-2 text-ink md:max-w-xl">
      <input type="hidden" name="sessionId" value={sessionId} />
      {/* Honeypot for bots; people never see or reach it. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <label htmlFor={`${listId}-name`} className="text-sm font-bold text-ink-muted">
        Your name
      </label>
      <div className="flex gap-2">
        <input
          id={`${listId}-name`}
          name="name"
          required
          maxLength={40}
          list={listId}
          autoComplete="off"
          placeholder="e.g. Tijs"
          className="min-h-12 min-w-0 flex-1 rounded-lg border border-ivory-line bg-white px-3 text-base text-ink focus:border-brass-dark focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 flex-none rounded-full bg-felt px-5 font-bold text-ivory hover:bg-felt-light disabled:opacity-50 md:px-7"
        >
          {pending ? "Dealing in…" : "Sign me up"}
        </button>
      </div>
      <datalist id={listId}>
        {suggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <p aria-live="polite" className="min-h-5 text-sm">
        {state.error ? (
          <span className="font-semibold text-chip-dark">{state.error}</span>
        ) : state.message ? (
          <span className="font-semibold text-win-dark">{state.message}</span>
        ) : (
          <span className="text-ink-muted">New here? Just type your name.</span>
        )}
      </p>
    </form>
  );
}
