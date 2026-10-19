"use client";

import { deleteSession } from "@/app/admin/actions";

export function DeleteSessionButton({ sessionId, label }: { sessionId: number; label: string }) {
  return (
    <form
      action={deleteSession}
      onSubmit={(e) => {
        if (!confirm(`Delete the session of ${label}? This can't be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <button
        type="submit"
        className="min-h-10 rounded-full px-4 text-sm font-bold text-chip-dark hover:bg-chip/15"
      >
        Delete
      </button>
    </form>
  );
}
