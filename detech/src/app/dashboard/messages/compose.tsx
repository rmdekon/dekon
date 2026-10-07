"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";

import { Input, Label, Select, Textarea } from "@/components/ui";
import { sendMessageAction, type ActionState } from "@/lib/actions/communication";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9.5 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:bg-brand-400"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Sending…
        </>
      ) : (
        <>
          <Send className="h-4 w-4" /> Send message
        </>
      )}
    </button>
  );
}

export function MessageComposer({
  recipients,
}: {
  recipients: { id: string; name: string; role: string }[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    sendMessageAction,
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
        <Label htmlFor="recipientId">To</Label>
        <Select id="recipientId" name="recipientId" required defaultValue="">
          <option value="" disabled>
            Choose a recipient…
          </option>
          {recipients.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.role.toLowerCase()})
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" name="subject" required placeholder="Subject line" />
      </div>

      <div>
        <Label htmlFor="body">Message</Label>
        <Textarea id="body" name="body" rows={5} required placeholder="Write your message…" />
      </div>

      <SubmitButton />
    </form>
  );
}
