# NestJS TypeORM CRUD API

REST API built with NestJS, TypeORM, PostgreSQL (Neon), JWT, dotenv and Swagger.

## Features

- JWT authentication: register, login and current user
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

## Environment

See `.env.example`. `DB_SYNCHRONIZE=true` is convenient for local development.
Set it to `false` and use TypeORM migrations in production. Change `JWT_SECRET`
before deploying.

Uploaded files are stored in `uploads/` and served from `/uploads/<filename>`.

Database tables use the `api_` prefix so they do not collide with existing
tables in a shared database.
