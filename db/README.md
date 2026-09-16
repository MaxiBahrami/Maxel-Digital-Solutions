# PostgreSQL database

The application uses PostgreSQL via `pg`, with parameterized SQL. SQLite, D1 and ChatGPT authentication are not used.

## Existing hosted database

The previous hosted database was inspected on 2026-09-16:

- `inquiries`: 0 rows
- `studio_owner`: 0 rows

There were no customer or owner records to export. The schema and application behavior have been migrated. The former platform identity is replaced by an independently configured admin password and PostgreSQL-backed sessions.

## Migrations

Startup runs the files in `db/migrations/` in filename order. Each migration is applied transactionally and recorded in `schema_migrations`, together with a checksum. Never edit a migration after it has been applied; add a new numbered SQL file instead.

`inquiries` stores project requests. `admin_sessions` stores only hashes of random session tokens. Session cookies are HTTP-only, SameSite=Strict and marked Secure when APP_ORIGIN uses HTTPS.

Database records, passwords, database dumps and `.env` are **not** published to GitHub. The database runs locally or on your hosting provider. A GitHub repository stores the code and schema, not a running PostgreSQL server.

## Back up locally

```sh
mkdir -p backups
docker compose exec -T db pg_dump -U maxel -d maxel > backups/maxel.sql
```

Restore only into an appropriately prepared database; the dump contains private data. `backups/` and SQL dumps are ignored by Git. Normal `docker compose down` preserves the database volume. `docker compose down -v` deletes it — do not use that unless you intend to erase your data.
