## Prisma & Database Guide

### 1. What is Prisma?

Prisma is the **ORM** we use to talk to our PostgreSQL database.  
Instead of writing raw SQL, we define our data model in a schema file, and Prisma generates a type-safe client that we use in our TypeScript code.

### 2. Where to Find the Relevant Files

- **Prisma schema (DB structure)**: `prisma/schema.prisma`  
- **Seed script (test/initial data)**: `prisma/seed.ts`  
- **Prisma client setup**: `src/lib/prisma.ts`  
- **Database env vars**: `.env` (`DATABASE_URL`, `DIRECT_URL`)  

You should edit **`schema.prisma`** when you want to change the shape of the database (tables, columns, relations), and **`seed.ts`** when you want to change the initial/example data that gets inserted.

---

### 3. How to Change the Database Schema (Current Flow: `db push`)

Because we don’t have a production / UVE server yet, we use **`prisma db push`** in development instead of full migrations.

#### 3.1. Steps to update the schema

1. **Edit the schema**
   - Open `prisma/schema.prisma`
   - Add/change fields, models, or relations as needed

2. **Drop the existing schema**
   ```bash
   npx prisma migrate reset --no-seed
   ```

   This wil drop all tables in the database

3. **Push the new schema to the database**

   ```bash
   npx prisma db push
   ```

   This will:
   - Update the database structure to match `schema.prisma`
   - Regenerate the Prisma Client


#### 3.2. Important notes about `db push`

- `db push` **does not create migration files** – it just makes the database match your schema.  
- This is perfect for **local development** and early-stage work.  
- Once we have a real shared / production environment, we should switch to **migrations** (see section 5).

---

### 4. How to Update Seed Data

Seed data is defined in `prisma/seed.ts`. This script is responsible for inserting initial or test data into the database.

The current seed script:

- Clears existing data (calls `deleteMany` on all the main tables)  
- Recreates storage locations (`Sloc`), inventory holders (`IH`), requesters, loggies, items, loan requests, and loan item details  
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
- Run:

  ```bash
  npx prisma db push
  npx prisma db seed
  ```

  whenever you’ve changed both structure and data.

---

### 5. Migrations (For Later Production Use)

For now we mostly use `prisma db push`, but **Prisma Migrate** is what we’ll use once we have a stable environment / prod DB. It creates versioned SQL migration files that can be applied consistently across environments.

#### 5.1. Quick explanation

- **`prisma migrate dev`**: In development, creates a new migration from your schema changes **and** applies it.  
- **`prisma migrate deploy`**: In production/staging, applies **existing** migrations (no new ones are created).  
- **Migration files live in**: `prisma/migrations/*/migration.sql`

#### 5.2. Typical migration workflow (when we start using it)

1. Edit `prisma/schema.prisma`  
2. Create + apply a migration:

   ```bash
   npx prisma migrate dev --name describe_the_change
   ```

3. Commit the new `prisma/migrations/...` folder to git.  
4. In production or other shared environments, run:

   ```bash
   npx prisma migrate deploy
   ```

For a deeper dive into Prisma Migrate and troubleshooting, see the official Prisma docs.

---

### 6. Troubleshooting

- **"Database schema is not in sync" / shape mismatch**
  - Re-run:

    ```bash
    npx prisma db push
    ```

- **Seed fails after schema change**
  - Ensure `prisma/seed.ts` is updated to match any new/renamed fields.  
  - Re-run:

    ```bash
    npx prisma db push
    npx prisma db seed
    ```


