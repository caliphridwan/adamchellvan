"use client";

import { useFormState } from "react-dom";
import { login } from "@/app/admin/actions/auth";
import { FormMessage, SubmitButton, TextField } from "@/components/ui/form";
import { initialFormState } from "@/lib/validation";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useFormState(login, initialFormState);
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next} />
      <TextField name="email" type="email" label="Email" autoComplete="username" required state={state} />
      <TextField name="password" type="password" label="Password" autoComplete="current-password" required state={state} />
      <SubmitButton className="btn-primary w-full" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
