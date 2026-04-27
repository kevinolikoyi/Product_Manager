"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface LoginActionState {
  error?: string;
}

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function login(
  _previousState: LoginActionState | undefined,
  formData: FormData,
): Promise<LoginActionState | undefined> {
  const email = readField(formData, "email");
  const password = readField(formData, "password");

  if (!email || !password) {
    return {
      error: "L'adresse e-mail et le mot de passe sont requis.",
    };
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      error: "Supabase n'est pas configure.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: "Identifiants invalides ou session indisponible.",
    };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await getSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/login");
}
