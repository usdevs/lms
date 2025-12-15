# Prisma Migrations Guide

## Quick Answer

**Creating a migration file does NOT update your Supabase database automatically.** You need to apply it.

## How to Run All Migrations

### Development (with auto-creation)
```bash
# Creates new migrations from schema changes AND applies all pending migrations
npx prisma migrate dev
```

### Production/Staging (apply existing migrations only)
```bash
# Applies all pending migrations that haven't been run yet
npx prisma migrate deploy
```

### Check Migration Status
```bash
# See which migrations have been applied to your database
npx prisma migrate status
```

## Complete Workflow

### Scenario 1: You modify schema.prisma

1. **Edit `prisma/schema.prisma`** (add field, change type, etc.)
2. **Run:**
   ```bash
   npx prisma migrate dev --name add_new_field
   ```
3. **What happens:**
   - Prisma creates migration file: `prisma/migrations/YYYYMMDDHHMMSS_add_new_field/migration.sql`
   - Prisma applies it to your Supabase database (using DIRECT_URL)
   - Prisma Client is regenerated
   - Migration is marked as applied

### Scenario 2: You manually create a migration file

1. **Create migration file manually** in `prisma/migrations/YYYYMMDDHHMMSS_name/migration.sql`
2. **Apply it:**
   ```bash
   npx prisma migrate dev
   # OR for production:
   npx prisma migrate deploy
   ```

### Scenario 3: Multiple team members / Fresh setup

If someone else created migrations or you're setting up fresh:

```bash
# 1. Pull latest code (migrations are in git)
git pull

# 2. Apply all pending migrations
npx prisma migrate deploy

# 3. Generate Prisma Client
npx prisma generate
```

## Migration Commands Reference

| Command | When to Use | What It Does |
|---------|-------------|--------------|
| `prisma migrate dev` | Development | Creates migration from schema changes + applies it |
| `prisma migrate dev --name x` | Development | Creates named migration + applies it |
| `prisma migrate dev --create-only` | Development | Creates migration file but doesn't apply |
| `prisma migrate deploy` | Production/Staging | Applies all pending migrations (doesn't create new ones) |
| `prisma migrate status` | Any | Shows which migrations are applied/pending |
| `prisma migrate reset` | Development only | ⚠️ Deletes all data, resets DB, applies all migrations |

## Important Notes

1. **Migrations use DIRECT_URL** - Prisma uses `DIRECT_URL` from your `.env` to apply migrations (not the pooling URL)

2. **Migration files are tracked in Git** - Always commit `prisma/migrations/` folder

3. **Migration lock file** - `prisma/migrations/migration_lock.toml` ensures only one migration runs at a time

4. **Order matters** - Migrations are applied in chronological order (by timestamp in folder name)

## Example: Following NUSCweb Style

NUSCweb has migrations like:
```
prisma/migrations/
  20250912110332_init/
    migration.sql
  20250914154047_organisation_telegram_url/
    migration.sql
  20250914161210_drop_organisation_slug/
    migration.sql
```

To create a similar migration:

```bash
# 1. Modify schema.prisma
# 2. Create and apply migration
npx prisma migrate dev --name add_item_category

# This creates:
# prisma/migrations/20250115120000_add_item_category/migration.sql
# AND applies it to Supabase
```

## Troubleshooting

### "Migration already applied"
If you see this, the migration was already run. Check status:
```bash
npx prisma migrate status
```

### "Database schema is not in sync"
Your database doesn't match your schema. Options:
```bash
# Option 1: Pull current DB state
npx prisma db pull

# Option 2: Create migration to sync
npx prisma migrate dev --name sync_schema
```

### "Migration failed"
```bash
# Mark as rolled back and try again
npx prisma migrate resolve --rolled-back migration_name
npx prisma migrate deploy
```

