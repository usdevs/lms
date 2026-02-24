## Prisma & Database Guide

### 1. What is Prisma?

Prisma is the **ORM** we use to talk to our PostgreSQL database.  
Instead of writing raw SQL, we define our data model in a schema file, and Prisma generates a type-safe client that we use in our TypeScript code.

### 2. Where to Find the Relevant Files

- **Prisma schema (DB structure)**: `prisma/schema.prisma` – defines the full domain model (User, IH, IHMember, Item, Sloc, LoanRequest, LoanItemDetail). See [PLAN_GUIDE.md](PLAN_GUIDE.md) for entity relationships and workflow.
- **Migrations**: `prisma/migrations/*/migration.sql` – versioned SQL migration files
- **Seed script (test/initial data)**: `prisma/seed.ts`  
- **Prisma client setup**: `src/lib/prisma.ts`  
- **Database env vars**: `.env` (`DATABASE_URL`, `DIRECT_URL`)  

You should edit **`schema.prisma`** when you want to change the shape of the database (tables, columns, relations), and **`seed.ts`** when you want to change the initial/example data that gets inserted.

---

### 3. How to Change the Database Schema (Migrations)

We use **Prisma Migrate** for all schema changes. Migrations create versioned SQL files that can be applied consistently across local, staging, and production environments.

#### 3.1. Steps to update the schema

1. **Edit the schema**
   - Open `prisma/schema.prisma`
   - Add/change fields, models, or relations as needed

2. **Create and apply a migration**
   ```bash
   npx prisma migrate dev --name describe_the_change
   ```

   Replace `describe_the_change` with a short, descriptive name (e.g. `add_user_avatar`, `create_loan_request_table`).

   This will:
   - Create a new migration file in `prisma/migrations/`
   - Apply the migration to your database
   - Regenerate the Prisma Client

3. **Commit the migration**
   - Commit the new `prisma/migrations/` folder to git so others (and production) can apply the same changes.

#### 3.2. Migration commands

| Command | When to use |
|---------|-------------|
| `npx prisma migrate dev --name <name>` | Development: create a new migration from schema changes and apply it |
| `npx prisma migrate deploy` | Production/staging: apply existing migrations (no new ones created) |
| `npx prisma migrate reset` | Reset the database: drop all data, reapply all migrations, run seed |

---

### 4. How to Update Seed Data

Seed data is defined in `prisma/seed.ts`. This script is responsible for inserting initial or test data into the database.

The current seed script:

- Clears existing data (calls `deleteMany` on all the main tables)  
- Recreates storage locations (`Sloc`), inventory holders (`IH`), users, items, loan requests, and loan item details  
- Logs a summary of counts at the end  

#### 4.1. Steps to edit and run the seed

1. **Edit the seed script**
   - Open `prisma/seed.ts`
   - Update the data being created/updated (e.g. add more items, change names, insert new sample requests)

2. **Run the seed**
   ```bash
   npx prisma db seed
   ```

   Prisma will execute `prisma/seed.ts` using the database specified in `DATABASE_URL`.

#### 4.2. Tips for working with seed data

- Be aware that the current script **wipes existing data** (`deleteMany`) before inserting fresh rows – comment that out if you want to preserve data.  
- If your schema changes, update both `schema.prisma` and `seed.ts` together so the seed doesn’t break.  
- After changing both structure and data:
  ```bash
  npx prisma migrate dev --name your_migration_name
  npx prisma db seed
  ```

---

### 5. Troubleshooting

- **"Database schema is not in sync" / shape mismatch**
  - Run:
    ```bash
    npx prisma migrate dev
    ```
  - If you have uncommitted schema changes, this will create and apply a migration. If the database is out of sync with existing migrations, it will apply pending migrations.

- **Seed fails after schema change**
  - Ensure `prisma/seed.ts` is updated to match any new/renamed fields.  
  - Re-run migrations and seed:
    ```bash
    npx prisma migrate dev
    npx prisma db seed
    ```

- **Fresh start (wipe everything)**
  ```bash
  npx prisma migrate reset
  ```
  This drops all tables, reapplies all migrations, and runs the seed script.
