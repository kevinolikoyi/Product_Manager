export interface Member {
  id: string;
  name: string;
  departmentId: string;
  role: "owner" | "manager" | "member";
  email?: string;
}

export const mockMembers: Member[] = [
  { id: "mem-alice", name: "Alice Martin", departmentId: "dep-product", role: "manager", email: "alice.martin@asworldtech.com" },
  { id: "mem-bilal", name: "Bilal Dupont", departmentId: "dep-engineering", role: "member", email: "bilal.dupont@asworldtech.com" },
  { id: "mem-nina", name: "Nina Costa", departmentId: "dep-engineering", role: "manager", email: "nina.costa@asworldtech.com" },
  { id: "mem-lucas", name: "Lucas Perrin", departmentId: "dep-engineering", role: "member", email: "lucas.perrin@asworldtech.com" },
  { id: "mem-claire", name: "Claire Moreau", departmentId: "dep-design", role: "member", email: "claire.moreau@asworldtech.com" },
  { id: "mem-mehdi", name: "Mehdi Kaci", departmentId: "dep-operations", role: "manager", email: "mehdi.kaci@asworldtech.com" },
  { id: "mem-sofia", name: "Sofia Bernard", departmentId: "dep-compliance", role: "member", email: "sofia.bernard@asworldtech.com" },
  { id: "mem-hugo", name: "Hugo Leroy", departmentId: "dep-performance", role: "member", email: "hugo.leroy@asworldtech.com" },
  { id: "mem-iris", name: "Iris Noel", departmentId: "dep-operations", role: "member", email: "iris.noel@asworldtech.com" },
  { id: "mem-sarah", name: "Sarah Giraud", departmentId: "dep-operations", role: "member", email: "sarah.giraud@asworldtech.com" },
  { id: "mem-yanis", name: "Yanis Roche", departmentId: "dep-engineering", role: "member", email: "yanis.roche@asworldtech.com" },
  { id: "mem-emma", name: "Emma Petit", departmentId: "dep-operations", role: "member", email: "emma.petit@asworldtech.com" },
];
