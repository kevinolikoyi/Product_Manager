c# CollabFlow V2 - Le Responsable Features (Dashboard + Kanban + Reports)

## Plan Breakdown (Approved)

**1. Extend Data Models & Store** ✅
   - [x] Add mockFinances.ts
   - [x] Update mockTasks.ts (add assignee)
   - [x] Update store.tsx (finances slice, assignee in Task)

**2. Enhance Dashboard** ✅
   - [x] Update KPI.tsx (add trend)
   - [x] Update dashboard/page.tsx (financial KPIs, critical alerts/"courriers", quick actions buttons)

**3. Kanban Board** ✅
   - [x] Install @dnd-kit deps
   - [x] Create KanbanBoard.tsx
   - [x] Update tasks/page.tsx (toggle table/kanban)

**4. Report Generation**
   - [ ] Install jsPDF, html2canvas
   - [ ] Create ReportGenerator.tsx
   - [ ] Add to dashboard

**5. Notifications & Assignee**
   - [ ] Update TaskForm.tsx (assignee field)
   - [ ] Update TaskTable.tsx (show assignee)
   - [ ] Extend Toast for notifications

**6. Testing & Polish**
   - [ ] Run npm run dev, test all features
   - [ ] Update existing TODO progress

Progress tracked here. Each step checked on completion.