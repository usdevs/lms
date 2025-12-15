## Setup Guide

### 1. Prerequisites

- **Node.js**: Download [here](https://nodejs.org/en/download)
- **Docker**: Download [here](https://www.docker.com/products/docker-desktop/)
- **Git**: Download [here](https://git-scm.com/install/)  

### 2. Clone the Repository

In you terminal:
```bash
git clone https://github.com/usdevs/lms.git
cd lms
```

### 3. Install Dependencies

```bash
npm install
```

This will also run `prisma generate` automatically via the `postinstall` script.

### 4. Database Setup

The app uses **PostgreSQL** with **Prisma** as the ORM. You can either:

For local dev, we will run the Postgres locally with Docker using the provided `docker-compose.yaml`

From the project root:

```bash
docker compose up -d
```

This starts a Postgres 17 container with:

- **Host port**: `5432`
- **User**: `postgres`
- **Password**: `postgres123`
- **Database**: `lms_dev`

#### 4.2. Configure Environment Variables

Create a `.env` file in the project root (if it doesn’t exist yet) and define the Prisma connection URLs.

At minimum, you should have:

```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/lms_dev?schema=public"
DIRECT_URL="postgresql://postgres:postgres123@localhost:5432/lms_dev?schema=public"
```

- **`DATABASE_URL`**: Used by Prisma Client at runtime  
- **`DIRECT_URL`**: Used by Prisma Migrate to apply migrations directly

If you are not using Docker, adjust the host, port, user, password, and database to match your own Postgres instance.

### 5. Run Prisma Migrations

Once the database is running and `.env` is configured:

```bash
npx prisma migrate dev --name init
```

This will:

- Create the database schema defined in [here](prisma/schema.prisma)
- Apply all migrations to your Postgres instance
- Regenerate the Prisma Client

For more detail on migration workflows, see [here](guides/DB_GUIDE.md)

### 6. Seed Data (Optional)

To seed the database with test data as defined [here](prisma\seed.ts),

```bash
npx prisma db seed
```

### 7. Run the App in Development

Start the Next.js dev server:

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.
 

### 8. Troubleshooting

- **Database connection errors**  
  - Ensure Docker is running (if using Docker)  
  - Check that `DATABASE_URL` and `DIRECT_URL` in `.env` are correct  
  - Confirm Postgres is listening on the expected host/port  

- **Prisma migration issues**  
  - See `DB GUIDE.md` for detailed instructions on migrations and common errors

### 9. Others

For more information on the design, read [here](guides/DESIGN_GUIDE.md)

For more information on the functionality plans, read [here](guides/PLAN_GUIDE.md)



