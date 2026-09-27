# NestJS TypeORM CRUD API

REST API built with NestJS, TypeORM, PostgreSQL (Neon), JWT, dotenv and Swagger.

## Features

- JWT authentication: register, login and current user
- Refresh-token rotation and server-side logout revocation
- CRUD: users, categories, products, blogs and uploads
- Password hashing with bcrypt
- DTO validation and UUID route validation
- Product/category and blog/category/author relations
- Local file upload for images/PDF (max 5 MB)
- Swagger UI with persistent Bearer authorization

## Run locally

```bash
npm install
cp .env.example .env # skip this when .env is already configured
npm run start:dev
```

- API: `http://localhost:3000/api`
- Health: `http://localhost:3000/api/health`
- Swagger: `http://localhost:3000/docs`

Register at `POST /api/auth/register`, copy `accessToken`, then use Swagger's
**Authorize** button to call protected endpoints.

Authentication endpoints:

- `POST /api/auth/register`: create an account and return access/refresh tokens.
- `POST /api/auth/login`: return access/refresh tokens.
- `GET /api/auth/me`: return the current account from the database.
- `POST /api/auth/refresh`: rotate a valid refresh token.
- `POST /api/auth/logout`: revoke refresh access for the current account.

Refresh tokens are hashed before being stored. Run
`scripts/add-refresh-token-column.sql` against an existing production database
before deploying this version. New development databases using
`DB_SYNCHRONIZE=true` create the column automatically.

## Pagination

All list endpoints support `page` and `limit` query parameters. Defaults are
`page=1` and `limit=10`; the maximum limit is 100.

```text
GET /api/products?page=1&limit=10
```

List responses use the same envelope:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "statusCode": 200,
  "message": "Products retrieved successfully"
}
```

## Environment

See `.env.example`. `DB_SYNCHRONIZE=true` is convenient for local development.
Set it to `false` and use TypeORM migrations in production. Change `JWT_SECRET`
before deploying.

Uploaded files are stored in `uploads/` and served from `/uploads/<filename>`.

Database tables use the `api_` prefix so they do not collide with existing
tables in a shared database.

## Deploy to Vercel

Vercel detects this project as NestJS and deploys it as one Vercel Function.
The deployment configuration is in `vercel.json`.

1. Push the repository to GitHub.
2. Import the repository at <https://vercel.com/new>.
3. Keep the detected **NestJS** framework preset. Do not set a custom output
   directory or override the build command.
4. Add these environment variables for Production, Preview and Development:

   - `DATABASE_URL`: use the pooled PostgreSQL connection string when the
     provider offers one (for example, Neon pooled connection).
   - `JWT_SECRET`: a long random secret.
   - `JWT_REFRESH_SECRET`: a different long random secret.
   - `DB_SYNCHRONIZE=false`
   - `JWT_EXPIRES_IN=1d` (optional)

5. Deploy, then verify `/api/health` and `/docs` on the generated domain.

The local-disk upload module is intentionally disabled when `VERCEL=1` because
files written by a Vercel Function are not persistent. Other API modules remain
available. Migrate uploads to Vercel Blob or another object store before
enabling upload routes on Vercel.
