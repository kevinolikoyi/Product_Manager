export interface Department {
  id: string;
  name: string;
  slug: string;
}

export const mockDepartments: Department[] = [
  {
    id: "dep-product",
    name: "Produit",
    slug: "product",
  },
  {
    id: "dep-engineering",
    name: "Engineering",
    slug: "engineering",
  },
  {
    id: "dep-design",
    name: "Design",
    slug: "design",
  },
  {
    id: "dep-operations",
    name: "Operations",
    slug: "operations",
  },
  {
    id: "dep-compliance",
    name: "Conformite",
    slug: "compliance",
  },
  {
    id: "dep-performance",
    name: "Performance",
    slug: "performance",
  },
];
