import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { getAuthenticatedUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.16),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[32px] border border-white/60 bg-white/85 shadow-[0_32px_80px_rgba(15,23,42,0.12)] backdrop-blur xl:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden border-r border-slate-200/70 bg-slate-950 px-8 py-10 text-slate-100 xl:block">
            <div className="max-w-sm space-y-6">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                AS WORLD TECH
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">
                  Project Management System
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Connectez-vous avec votre compte collaborateur pour consulter
                  l&apos;etat des tests, vos taches et l&apos;avancement des projets.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  "Connexion par adresse e-mail",
                  "Acces pilote par role et perimetre",
                  "Session serveur compatible App Router",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <div className="mx-auto max-w-md">
              <div className="mb-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Authentification
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                  Connexion
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Utilisez l&apos;adresse e-mail et le mot de passe fournis pour
                  acceder a votre espace de travail.
                </p>
              </div>

              <LoginForm />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
