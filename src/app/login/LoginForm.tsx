"use client";

import { useActionState } from "react";
import { login, type LoginActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const initialState: LoginActionState = {};

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState);
  const errorMessage = state?.error;

  return (
    <form action={action} className="space-y-5">
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Adresse e-mail
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nom@entreprise.com"
          required
          className="h-11 rounded-2xl border-slate-200"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Mot de passe
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Mot de passe"
          required
          className="h-11 rounded-2xl border-slate-200"
        />
      </div>

      {errorMessage ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="h-11 w-full rounded-2xl">
        {pending ? "Connexion..." : "Se connecter"}
      </Button>
    </form>
  );
}
