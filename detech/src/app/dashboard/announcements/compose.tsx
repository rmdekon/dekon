"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";

import { Input, Label, Select, Textarea } from "@/components/ui";
import {
  createAnnouncementAction,
  type ActionState,
} from "@/lib/actions/communication";
import { AUDIENCES } from "@/lib/enums";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9.5 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:bg-brand-400"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Publishing…
        </>
      ) : (
        <>
          <Send className="h-4 w-4" /> Publish
        </>
      )}
    </button>
  );
}

export function AnnouncementComposer() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createAnnouncementAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      ) : null}
      {state.ok ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {state.message}
        </div>
      ) : null}

      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required placeholder="e.g. Mid-term break dates" />
      </div>

      <div>
        <Label htmlFor="body">Message</Label>
        <Textarea id="body" name="body" rows={4} required placeholder="Write the notice…" />
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[10rem] flex-1">
          <Label htmlFor="audience">Audience</Label>
          <Select id="audience" name="audience" defaultValue="ALL">
            {AUDIENCES.map((a) => (
              <option key={a} value={a}>
                {a === "ALL" ? "Everyone" : a.charAt(0) + a.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </div>
        <label className="flex h-9.5 items-center gap-2 text-xs text-ink-700">
          <input
            type="checkbox"
            name="isPinned"
            className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />
          Pin to top
        </label>
        <SubmitButton />
      </div>
    </form>
  );
}
