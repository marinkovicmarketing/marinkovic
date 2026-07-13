"use client";

import { useActionState } from "react";
import { unlockVip } from "./actions";

const initialState: { error?: string } = {};

export function UnlockForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => unlockVip(formData),
    initialState,
  );

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        name="code"
        placeholder="Unesi VIP kod"
        required
        className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm outline-none focus:border-emerald-500"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-neutral-950 hover:bg-emerald-400 disabled:opacity-60"
      >
        {pending ? "Proveravam..." : "Otključaj"}
      </button>
      {state.error && (
        <p className="basis-full text-sm text-red-400" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
