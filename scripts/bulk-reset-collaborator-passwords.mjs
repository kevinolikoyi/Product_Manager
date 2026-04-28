#!/usr/bin/env node

import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function parseArgs(argv) {
  const args = {
    dryRun: false,
    workspace: "",
    output: "",
    roles: [],
  };

  for (const rawArg of argv) {
    if (rawArg === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (rawArg.startsWith("--workspace=")) {
      args.workspace = rawArg.slice("--workspace=".length).trim();
      continue;
    }

    if (rawArg.startsWith("--output=")) {
      args.output = rawArg.slice("--output=".length).trim();
      continue;
    }

    if (rawArg.startsWith("--roles=")) {
      args.roles = rawArg
        .slice("--roles=".length)
        .split(",")
        .map((role) => role.trim())
        .filter(Boolean);
    }
  }

  return args;
}

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

async function loadEnvFile(filePath) {
  try {
    const raw = await readFile(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = stripWrappingQuotes(trimmed.slice(separatorIndex + 1).trim());

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return;
    }

    throw error;
  }
}

async function loadLocalEnv(cwd) {
  await loadEnvFile(path.join(cwd, ".env"));
  await loadEnvFile(path.join(cwd, ".env.local"));
}

function requireEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${name}`);
  }

  return value;
}

function timestampForFileName(date = new Date()) {
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    "-",
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ];

  return parts.join("");
}

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(10);
  let body = "";

  for (const byte of bytes) {
    body += alphabet[byte % alphabet.length];
  }

  return `Temp-${body}`;
}

async function listAllAuthUsers(supabase) {
  const users = [];
  const perPage = 200;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    const currentPageUsers = data?.users ?? [];
    users.push(...currentPageUsers);

    if (currentPageUsers.length < perPage) {
      break;
    }

    page += 1;
  }

  return users;
}

async function loadWorkspaceContext(supabase, workspaceSlug) {
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, slug, name")
    .eq("slug", workspaceSlug)
    .maybeSingle();

  if (workspaceError) {
    throw workspaceError;
  }

  if (!workspace) {
    throw new Error(`Workspace introuvable pour le slug "${workspaceSlug}".`);
  }

  const [{ data: collaborators, error: collaboratorsError }, { data: departments, error: departmentsError }] =
    await Promise.all([
      supabase
        .from("collaborators")
        .select("id, full_name, email, role, department_id")
        .eq("workspace_id", workspace.id)
        .order("full_name", { ascending: true }),
      supabase
        .from("departments")
        .select("id, name, slug")
        .eq("workspace_id", workspace.id),
    ]);

  if (collaboratorsError) {
    throw collaboratorsError;
  }

  if (departmentsError) {
    throw departmentsError;
  }

  const departmentMap = new Map((departments ?? []).map((department) => [department.id, department]));

  return {
    workspace,
    collaborators: (collaborators ?? []).map((collaborator) => ({
      ...collaborator,
      department: collaborator.department_id
        ? departmentMap.get(collaborator.department_id) ?? null
        : null,
    })),
  };
}

async function writeReport(outputPath, payload) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function main() {
  const cwd = process.cwd();
  const args = parseArgs(process.argv.slice(2));

  await loadLocalEnv(cwd);

  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const workspaceSlug =
    args.workspace || requireEnv("NEXT_PUBLIC_SUPABASE_WORKSPACE_SLUG");

  const timestamp = timestampForFileName();
  const outputPath = args.output
    ? path.resolve(cwd, args.output)
    : path.resolve(
        cwd,
        ".generated",
        `collaborator-password-reset-${workspaceSlug}-${timestamp}.json`,
      );

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const [{ workspace, collaborators }, authUsers] = await Promise.all([
    loadWorkspaceContext(supabase, workspaceSlug),
    listAllAuthUsers(supabase),
  ]);

  const authUserMap = new Map(
    authUsers
      .filter((user) => user.email)
      .map((user) => [user.email.trim().toLowerCase(), user]),
  );
  const allowedRoles = new Set(args.roles);
  const results = [];

  for (const collaborator of collaborators) {
    const email = collaborator.email?.trim() ?? "";
    const normalizedEmail = email.toLowerCase();

    if (!email) {
      results.push({
        collaboratorId: collaborator.id,
        fullName: collaborator.full_name,
        email: null,
        role: collaborator.role,
        department: collaborator.department?.name ?? null,
        status: "skipped_missing_email",
      });
      continue;
    }

    if (allowedRoles.size > 0 && !allowedRoles.has(collaborator.role)) {
      results.push({
        collaboratorId: collaborator.id,
        fullName: collaborator.full_name,
        email,
        role: collaborator.role,
        department: collaborator.department?.name ?? null,
        status: "skipped_role_filter",
      });
      continue;
    }

    const authUser = authUserMap.get(normalizedEmail) ?? null;

    if (!authUser) {
      results.push({
        collaboratorId: collaborator.id,
        fullName: collaborator.full_name,
        email,
        role: collaborator.role,
        department: collaborator.department?.name ?? null,
        status: "skipped_missing_auth_user",
      });
      continue;
    }

    const temporaryPassword = generateTemporaryPassword();

    if (args.dryRun) {
      results.push({
        collaboratorId: collaborator.id,
        authUserId: authUser.id,
        fullName: collaborator.full_name,
        email,
        role: collaborator.role,
        department: collaborator.department?.name ?? null,
        status: "dry_run_ready_to_reset",
        temporaryPassword,
      });
      continue;
    }

    const { data, error } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: temporaryPassword,
      email_confirm: true,
    });

    if (error || !data.user) {
      results.push({
        collaboratorId: collaborator.id,
        authUserId: authUser.id,
        fullName: collaborator.full_name,
        email,
        role: collaborator.role,
        department: collaborator.department?.name ?? null,
        status: "failed_reset_password",
        error: error?.message ?? "Reinitialisation du mot de passe impossible.",
      });
      continue;
    }

    results.push({
      collaboratorId: collaborator.id,
      authUserId: authUser.id,
      fullName: collaborator.full_name,
      email,
      role: collaborator.role,
      department: collaborator.department?.name ?? null,
      status: "reset_password",
      temporaryPassword,
    });
  }

  const summary = results.reduce(
    (accumulator, result) => {
      accumulator.total += 1;
      accumulator[result.status] = (accumulator[result.status] ?? 0) + 1;
      return accumulator;
    },
    { total: 0 },
  );

  const payload = {
    generatedAt: new Date().toISOString(),
    dryRun: args.dryRun,
    workspace: {
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
    },
    filters: {
      roles: args.roles,
    },
    summary,
    results,
  };

  await writeReport(outputPath, payload);

  console.log(`Rapport ecrit dans ${outputPath}`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
