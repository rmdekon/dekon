"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

import { loginAction, type LoginState } from "@/lib/actions/auth";
import { Input, Label } from "@/components/ui";

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@detech.school", password: "Admin@123" },
  { role: "Teacher", email: "teacher@detech.school", password: "Password@123" },
  { role: "Student", email: "student@detech.school", password: "Password@123" },
  { role: "Parent", email: "parent@detech.school", password: "Password@123" },
  { role: "Accountant", email: "accountant@detech.school", password: "Password@123" },
  { role: "Librarian", email: "librarian@detech.school", password: "Password@123" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:bg-brand-400"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Signing in…
        </>
      ) : (
        <>
          Sign in
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        {state.error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        ) : null}

        <div>
          <Label htmlFor="email">School email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={state.email ?? ""}
            placeholder="you@detech.school"
            className="h-11"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="h-11"
          />
        </div>

        <SubmitButton />
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-ink-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-[11px] tracking-wide text-ink-400 uppercase">
            Demo accounts
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {DEMO_ACCOUNTS.map((acct) => (
          <button
            key={acct.email}
            type="button"
            onClick={() => {
              const form = document.querySelector("form") as HTMLFormElement;
              (form.elements.namedItem("email") as HTMLInputElement).value =
                acct.email;
              (form.elements.namedItem("password") as HTMLInputElement).value =
                acct.password;
            }}
            className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-left transition-colors hover:border-brand-300 hover:bg-brand-50"
          >
            <span className="block text-xs font-semibold text-ink-800">
              {acct.role}
            </span>
            <span className="block truncate text-[10px] text-ink-500">
              {acct.email}
            </span>
          </button>
        ))}
      </div>
      <p className="text-center text-[11px] text-ink-400">
        Click a role to fill the form, then press “Sign in”.
      </p>
    </div>
  );
}
