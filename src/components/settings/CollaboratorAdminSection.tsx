"use client";

import { useActionState, useEffect, useState } from "react";
import { ShieldPlus, UserRoundPlus } from "lucide-react";
import {
  createCollaborator,
  type CreateCollaboratorActionState,
} from "@/app/actions/collaborators";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Select";
import {
  useDepartments,
  useMembers,
  usePermissions,
  useWorkspaceSync,
} from "@/lib/store";

const initialState: CreateCollaboratorActionState = {};

export default function CollaboratorAdminSection() {
  const { departments } = useDepartments();
  const { members } = useMembers();
  const { currentRole, canManageCollaborators } = usePermissions();
  const { refreshWorkspace } = useWorkspaceSync();
  const [state, action, pending] = useActionState(createCollaborator, initialState);
  const [departmentId, setDepartmentId] = useState("");
  const [role, setRole] = useState<"collaborator" | "manager">("collaborator");

  useEffect(() => {
    if (!state.success) {
      return;
    }

    void refreshWorkspace();
  }, [refreshWorkspace, state.success]);

  if (!canManageCollaborators) {
    return (
      <section className="surface-card rounded-[30px] border border-white/60 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <ShieldPlus className="mt-1 h-5 w-5 text-slate-400" />
          <div>
            <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
              Administration des collaborateurs
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Cet espace est reserve aux managers et owners.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const roleOptions = [
    { value: "collaborator", label: "Collaborateur" },
    ...(currentRole === "owner" ? [{ value: "manager", label: "Manager" }] : []),
  ];

  return (
    <section className="surface-card rounded-[30px] border border-white/60 p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-600 text-white shadow-[0_16px_32px_rgba(79,70,229,0.2)]">
              <UserRoundPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                Ajouter un collaborateur
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Cree automatiquement le compte Auth, la fiche collaborateur et un mot
                de passe temporaire a transmettre une seule fois.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
          {members.length} collaborateur(s) charges dans le workspace
        </div>
      </div>

      <form action={action} className="mt-6 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-slate-700">
              Nom complet
            </label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="Ex. Bilal Dupont"
              required
              className="h-11 rounded-2xl border-slate-200"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Adresse e-mail
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nom@asworldtech.com"
              required
              className="h-11 rounded-2xl border-slate-200"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Departement
            </label>
            <SelectField
              id="departmentId"
              name="departmentId"
              options={departments.map((department) => ({
                value: department.id,
                label: department.name,
              }))}
              required
              value={departmentId}
              onChange={setDepartmentId}
              placeholder="Selectionnez un departement"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Role
            </label>
            <SelectField
              id="role"
              name="role"
              options={roleOptions}
              required
              value={role}
              onChange={(value) => setRole(value as "collaborator" | "manager")}
            />
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-4">
          <p className="text-sm font-medium text-slate-700">
            Regles appliquees
          </p>
          <ul className="mt-2 space-y-1 text-sm text-slate-500">
            <li>Creation du compte dans Supabase Auth avec e-mail confirme.</li>
            <li>Creation de la ligne metier dans `collaborators`.</li>
            <li>Generation d&apos;un mot de passe temporaire a communiquer en direct.</li>
          </ul>
        </div>

        {state.error ? (
          <p className="rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}

        {state.success ? (
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
            <p className="font-semibold">
              Compte cree pour {state.success.fullName} ({state.success.roleLabel})
            </p>
            <p className="mt-2">
              E-mail : <span className="font-medium">{state.success.email}</span>
            </p>
            <p className="mt-2">
              Mot de passe temporaire :{" "}
              <span className="rounded bg-white/80 px-2 py-1 font-semibold text-slate-900">
                {state.success.temporaryPassword}
              </span>
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200/80 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Une fois valide, le compte Auth, la fiche collaborateur et le mot de passe
            temporaire seront crees.
          </p>
          <Button
            type="submit"
            disabled={pending}
            size="lg"
            className="w-full rounded-full sm:w-auto"
          >
            {pending ? "Creation..." : "Valider et creer le collaborateur"}
          </Button>
        </div>
      </form>
    </section>
  );
}
