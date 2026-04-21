import {
  getDepartmentCatalog,
  normalizeDepartmentSlug,
} from '@/lib/departments';
import type { Member, Project } from '@/lib/types';

interface DepartmentRow {
  id: string | number;
  name: string;
  slug: string;
}

const hiddenDepartmentSlugs = new Set(['direction-operations', 'engineering', 'product']);
const fallbackDepartmentId = 'technique-conception-logicielle-design';

export function normalizeDepartments(rows: DepartmentRow[]) {
  const departmentCatalog = getDepartmentCatalog();
  const departmentBySlug = new Map(
    departmentCatalog.map((department) => [department.slug, department]),
  );
  const departmentIdMap = new Map<string, string>();
  const databaseDepartmentIdMap = new Map<string, number>();

  for (const row of rows) {
    const rowId = String(row.id);
    const normalizedSlug = normalizeDepartmentSlug(row.slug);

    if (hiddenDepartmentSlugs.has(normalizedSlug)) {
      continue;
    }

    const current = departmentBySlug.get(normalizedSlug);
    const mappedDepartmentId = current?.id ?? fallbackDepartmentId;

    departmentIdMap.set(rowId, mappedDepartmentId);

    if (current && !databaseDepartmentIdMap.has(current.id) && typeof row.id === 'number') {
      databaseDepartmentIdMap.set(current.id, row.id);
    }
  }

  for (const row of rows) {
    const rowId = String(row.id);

    if (departmentIdMap.has(rowId)) {
      continue;
    }

    departmentIdMap.set(rowId, fallbackDepartmentId);
  }

  return {
    departments: departmentCatalog,
    departmentIdMap,
    databaseDepartmentIdMap,
  };
}

export function remapProjectDepartments(
  projects: Project[],
  departmentIdMap: Map<string, string>,
) {
  return projects.map((project) => ({
    ...project,
    departmentId: departmentIdMap.get(project.departmentId) ?? project.departmentId,
  }));
}

export function remapMemberDepartments(
  members: Member[],
  departmentIdMap: Map<string, string>,
) {
  return members.map((member) => ({
    ...member,
    departmentId: departmentIdMap.get(member.departmentId) ?? member.departmentId,
  }));
}
