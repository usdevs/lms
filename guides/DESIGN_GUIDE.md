## Design & Structure Guide

This project is a **Next.js App Router** app.

As much as possible, the structure was designed to be roughly similar to the NUSCWeb repo. This goes for the UI design too.

### 1. Top-level structure

- **`src/app`**: Route structure and pages (UI entry points)
  - `layout.tsx`: Root layout, shared providers, theme, etc.
  - `page.tsx`: Home page / landing. Currently redirects to the catalogue page
  - `catalogue/page.tsx`: Route for the item catalogue.
- **`src/components`**: Reusable React components
  - `catalogue/*`: Components specific to the catalogue (e.g. `Catalogue`, `EditItemModal`, `DeleteItemButton`).
  - `ui/*`: Shared UI primitives (buttons, inputs, dialogs, etc. – largely ShadCN-style).
- **`src/lib`**: Domain logic and shared utilities
  - `actions/*`: Server actions for mutations / queries (e.g. `item` actions).
  - `schema/*`: Zod schemas / validation for domain objects.
  - `utils/*`: General utilities (client + server), with a `server` subfolder for purely server-side helpers.
  - `prisma.ts`: Prisma client singleton.
- **`prisma`**: Database layer
  - `schema.prisma`: Source of truth for DB structure.
  - `seed.ts`: Script for populating local/dev data.
- **`guides`**: Project documentation for onboarding:
  - `DB_GUIDE.md`: Prisma, schema, seeds, db push / migrations.
  - `DESIGN_GUIDE.md`: This file (structure & organisation).
  - `PLAN_GUIDE.md`: High‑level functionality roadmap/plans.

### 2. How to organise new features

(NOTE: This is just a rough guide, feel free to explore what works best)

When you add a new feature (e.g. “loans dashboard”, “IH management”):

- **Routing / pages**
  - Create a new route under `src/app` (e.g. `src/app/loans/page.tsx`).
  - Keep the page component focused on wiring data + composing components.

- **Feature components**
  - Put feature-specific components under `src/components/<feature>/`.
    - Example: `src/components/loans/LoansTable.tsx`, `LoansFilters.tsx`.
  - Only promote components into `src/components/ui` if they are:
    - Reusable across multiple features,
    - Pure UI primitives (buttons, inputs, cards, modals, etc.).

- **Server actions & domain logic**
  - Put server actions under `src/lib/actions/<feature>.ts` (e.g. `loans.ts`, `ih.ts`).
  - Keep these responsible for:
    - Validating input with Zod schemas (from `src/lib/schema`),
    - Talking to Prisma,
    - Handling errors and returning typed results.
  - If logic is reusable across actions, extract helpers into `src/lib/utils` or `src/lib/utils/server`.

- **Schemas / validation**
  - Define request/response/input schemas under `src/lib/schema/<feature>.ts` (like the existing `item` schema).
  - Reuse these schemas:
    - In server actions for validation,
    - In forms (via `react-hook-form` + `zod` resolvers).

### 3. UI layer conventions

- **`src/components/ui`** is the “design system” layer:
  - Don’t put feature-specific logic here (no Prisma, no server actions).
  - Keep it presentational and reusable.
  - As much as possible, let's try to keep a consistent design with the NUSC web app
- **Feature directories** (e.g. `catalogue`) can:
  - Fetch data via server components or actions.
  - Contain hooks and small utilities scoped to that feature.

### 4. How to use Git when adding new features

When you start working on a new feature, use this basic Git workflow:

1. **Update your local `master`**
   - `git checkout master`
   - `git pull origin master`
   You will now have the latest version of master available locally.

2. **Create a feature branch**
   - Use a descriptive name based on the feature you are adding, e.g. `your-name/loans-dashboard` or `your-name/catalogue-filter-bug`.
   - `git checkout -b your-name/your-feature-name`

3. **Make changes and stage them**
   - Edit code as needed.
   - See what changed: `git status` and `git diff`.
   - Stage files: `git add <file1> <file2>` or `git add .` to stage everything.

4. **Commit with a clear message**
   - `git commit -m "Add loans dashboard filters"`  
   - Aim for small, focused commits that each represent one logical change.

5. **Sync with `master` if needed**
   - If `master` was updated while you were working:
     - `git checkout main`
     - `git pull origin main`
     - `git checkout your-name/your-feature-name`
     - `git merge master`.

6. **Push your branch and open a PR**
   - `git push -u origin your-name/your-feature-name`
   - Open a PR against `main`, make sure checks pass, and request review.
