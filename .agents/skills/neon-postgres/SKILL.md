---
name: neon-postgres
description: >-
  Guides and best practices for working with Lakebase Postgres on Neon:
  connections, pooled vs direct, schema migrations, branching, autoscaling,
  scale-to-zero, instant restore, read replicas, IP allow lists, logical
  replication, and Lakebase Search. Use when the work is an existing
  DATABASE_URL, SQL, schema, inspect, or search. New backends, Auth, files,
  Functions, and LLM calls go to the parent `neon` skill. Live queries, reactive
  UIs, and realtime data go to `neon-realtime`. Also use for
  "@neondatabase/serverless", "@neondatabase/neon-js", "neon inspect db",
  "semantic search", "vector search", "full-text search", "BM25", or
  "hybrid search".
metadata:
  parent: neon
  source: https://github.com/neondatabase/agent-skills/tree/main/skills/neon-postgres
---

# Lakebase Postgres

Lakebase Postgres is the database at the core of Neon. It runs on the lakebase architecture — OLTP built directly on cloud object storage — which decouples storage from compute to offer autoscaling, branching, instant restore, and scale-to-zero. It's fully compatible with Postgres and works with any language, framework, or ORM that supports Postgres.

## Connection Guidelines

### When to use pooled vs direct connections

| Use case | Connection type |
| --- | --- |
| Web applications, serverless functions, API backends | Pooled (-pooler) |
| Schema migrations, DDL, alembic / prisma / drizzle migrations | Direct |
| pg_dump / pg_restore | Direct |
| Logical replication | Direct |
| LISTEN / NOTIFY | Direct |

For Python async backends (FastAPI with SQLAlchemy asyncpg):
Use `postgresql+asyncpg://...` format. If using pooled connection with asyncpg, ensure `prepared_statement_cache_size=0` or `statement_cache_size=0` if PgBouncer is in transaction mode, or use direct connection for schema DDL migrations.
