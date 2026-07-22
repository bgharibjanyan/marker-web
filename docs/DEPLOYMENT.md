# Marker Web deployment runbook

## Supported topology

Run Marker Web on Node.js 20 or a newer LTS release with MongoDB configured as a replica set. Transactions used by event, task, post, profile, and subscription workflows require replica-set or sharded MongoDB deployments.

A single writable application instance can use the current local upload directories. Horizontal scaling, ephemeral containers, and serverless deployments require replacing `public/uploads` with durable S3-compatible object storage before launch.

## Required configuration

| Variable | Requirement |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string for the target environment |
| `APP_ORIGIN` | Canonical HTTPS origin used for mutation-origin validation |
| `ADMIN_BOOTSTRAP_EMAIL` | Account promoted only by the P0 migration |
| `ENABLE_API_DOCS` | Keep `false` in production unless API docs should be public |
| `SERVICE_NAME` | Service label included in structured JSON logs |
| `LOG_LEVEL` | `debug`, `info`, `warn`, or `error` |
| `HEALTHCHECK_TIMEOUT_MS` | Readiness database timeout, clamped to 250–10000 ms |

Never commit real connection strings or environment files.

## Release procedure

1. Back up MongoDB and confirm the deployment targets the intended database.
2. Install exactly locked dependencies with `npm ci`.
3. Run `npm run quality:check`.
4. Run `npm run build`.
5. Apply migrations in order:
   - `npm run auth:migrate -- --apply`
   - `npm run api:p1:migrate -- --apply`
   - `npm run api:search:migrate -- --apply`
6. Start with `npm run start`.
7. Wait for `GET /api/health/ready` to return HTTP 200 before receiving traffic.
8. Exercise login, task creation, event subscription, post upload, and administrator access.

Migrations are designed for explicit execution. Run their dry-run form first when deploying to a new database.

## Health probes

- `GET /api/health/live`: process liveness. Restart the instance when it fails.
- `GET /api/health/ready`: configuration and MongoDB readiness. Remove the instance from traffic when it returns 503.

Use a probe interval of 10–30 seconds and a failure threshold of at least three attempts.

## Logs and monitoring

API requests emit one-line JSON records containing timestamp, severity, event, service, environment, request ID, route, method, status, and duration. Forward stdout/stderr to the deployment platform's log collector.

Recommended alerts:

- readiness failures for more than two minutes;
- HTTP 5xx rate above 2% for five minutes;
- sustained HTTP 429 responses;
- p95 API latency above the product SLO;
- MongoDB connection or transaction errors;
- disk usage growth while local uploads remain enabled.

The `x-request-id` response header can be used to correlate a client failure with server logs.

## Rollback

Application code can be rolled back independently because the P0/P1 indexes are backward compatible. Do not drop indexes during an incident unless an index is proven to be the cause. Restore database data from backup if a release performed an incompatible data mutation.

Uploaded files and MongoDB must be backed up together while local storage is used; otherwise restored documents may reference missing media.

## Pre-production limitation

Durable object storage remains mandatory before running multiple application replicas or deploying to an ephemeral filesystem. The application should stay on a persistent single-instance volume until that storage adapter is implemented and verified.
