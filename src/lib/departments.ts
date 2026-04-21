import type { Department } from '@/lib/types';

export const departmentCatalog: Department[] = [
  {
    id: 'secretariat-administratif',
    name: 'Secretariat Administratif',
    slug: 'secretariat-administratif',
  },
  {
    id: 'technique-maintenance-reparation',
    name: 'Maintenance et Reparation',
    slug: 'technique-maintenance-reparation',
  },
  {
    id: 'technique-conception-logicielle-design',
    name: 'Conception logicielle et Design',
    slug: 'technique-conception-logicielle-design',
  },
  {
    id: 'service-achat-stock-controle',
    name: 'Service achat, stock / controle',
    slug: 'service-achat-stock-controle',
  },
];

const procurementSlugVariants = new Set([
  'service-achat-stock-controle',
  'service-achat-stock-contr_le',
]);

export function normalizeDepartmentSlug(slug: string) {
  if (procurementSlugVariants.has(slug)) {
    return 'service-achat-stock-controle';
  }

  return slug;
}

export function getDepartmentCatalog() {
  return departmentCatalog;
}

export function getDepartmentById(departmentId?: string | null) {
  if (!departmentId) {
    return null;
  }

  return departmentCatalog.find((department) => department.id === departmentId) ?? null;
}

