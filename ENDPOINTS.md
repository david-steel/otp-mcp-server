# OTP Public REST API — Endpoint Specs

**Audience:** whoever builds the read-only public surface on orgtp.com that the OTP MCP server consumes.

**Goal:** ship a tiny, anonymous, rate-limited JSON API that returns 8 well-defined resources. No auth, no writes, no fancy features.

**Once these are live, the MCP server flips from `OTP_MOCK=1` to live by simply removing the env var.**

---

## Common conventions

### Base
- **Base URL:** `https://orgtp.com/api/v1`
- **Versioning:** path-based. Breaking changes ship under `/v2`.

### Transport
- **Method:** `GET` only on this surface.
- **Content-Type:** `application/json; charset=utf-8`
- **CORS:** `Access-Control-Allow-Origin: *`. No credentials.
- **Compression:** gzip + brotli.

### Auth
- **None.** This is a public discovery surface. Auth lives on the writer/publisher API, not here.

### Rate limiting
- **Per IP:** 60 requests / minute, burst 20.
- Return `429` with `Retry-After` header on breach.
- Optional: anonymous API key for higher limits in v1.1, not required for v1.0.

### Pagination
- v1: `limit` only. No cursor.
- Default and max documented per endpoint.
- Future-proof: response objects always wrap arrays in `results` so a `next_cursor` field can be added without a breaking change.

### Filtering
- All filter params are optional unless marked required.
- Empty/missing params behave as "no filter."
- Unknown params are ignored, not rejected.

### Caching
- All endpoints emit `Cache-Control: public, max-age=60, stale-while-revalidate=300`.
- ETag support encouraged.
- Patterns endpoint can cache longer (5 min) since the underlying data is computed on a schedule.

### Errors
Standard envelope:

```json
{
  "error": {
    "code": "not_found",
    "message": "No publisher with slug 'foo'",
    "details": {}
  }
}
```

Status codes:

| Code | Meaning |
|---|---|
| 200 | Success |
| 400 | Bad params (validation failure) |
| 404 | Resource not found or not public |
| 429 | Rate limit exceeded |
| 500 | Server error |
| 503 | Backend dependency down (DB, search, etc.) |

### Privacy
- Endpoints expose ONLY data that publishers have explicitly marked public.
- Each resource has a `public: bool` column or equivalent in the DB. Default to `false`.
- Never leak a publisher's private learnings, KPI values, or non-public agents.

---

## Endpoint 1 — Search best practices

### Purpose
Full-text search across all published, public best practices on the network. The lowest-friction discovery path.

### Spec
```
GET /api/v1/best-practices/search
```

**Query params:**

| Name | Type | Required | Default | Max | Notes |
|---|---|---|---|---|---|
| `q` | string | yes | — | 200 chars | Search query. |
| `limit` | int | no | 10 | 50 | |
| `publisher` | string | no | — | — | Optional slug filter. |
| `tag` | string | no | — | — | Optional tag filter. |

**Response:**
```json
{
  "query": "agent retirement",
  "count": 1,
  "results": [
    {
      "id": "bp-003",
      "title": "Agent retirement protocol",
      "publisher": "sneeze-it",
      "summary": "No agent is retired without a hearing...",
      "body": "Optional longer markdown body.",
      "tags": ["agents", "governance", "ethics"],
      "published_at": "2026-04-13",
      "verified_outcomes": 1,
      "url": "https://orgtp.com/p/sneeze-it/agent-retirement-protocol"
    }
  ]
}
```

**Implementation notes:**
- Postgres full-text search with `ts_rank` over (title, summary, body, tags). pg_trgm fallback for typo tolerance.
- Index: `WHERE public = true AND status = 'published'`.
- Sort: relevance, then `verified_outcomes DESC`, then `published_at DESC`.

---

## Endpoint 2 — Network learnings

### Purpose
The cross-org coordination intelligence feed. Each entry is a captured correction or success: what failed, what to do, why.

### Spec
```
GET /api/v1/learnings
```

**Query params:**

| Name | Type | Required | Default | Max | Notes |
|---|---|---|---|---|---|
| `since_days` | int | no | 7 | 365 | |
| `limit` | int | no | 20 | 100 | |
| `publisher` | string | no | — | — | Optional slug filter. |
| `agent` | string | no | — | — | Optional agent name filter. |
| `q` | string | no | — | 200 chars | Optional keyword search. |

**Response:**
```json
{
  "since_days": 7,
  "count": 3,
  "results": [
    {
      "id": "ln-101",
      "publisher": "sneeze-it",
      "agent": "Dirk",
      "what_failed": "Closed an opportunity as Lost based on stage age alone.",
      "what_to_do": "Cross-reference meeting + email + calendar before any Lost close.",
      "why": "Stage age is a lagging indicator.",
      "source_url": "https://orgtp.com/p/sneeze-it/dirk-stage-age-fix",
      "captured_at": "2026-04-13T14:22:00Z"
    }
  ]
}
```

**Implementation notes:**
- Backed by the same `learnings` table the writer/publisher API populates.
- Filter: `WHERE public = true AND captured_at >= NOW() - INTERVAL since_days DAY`.
- Sort: `captured_at DESC`.

---

## Endpoint 3 — List publishers

### Purpose
Roster of organizations actively publishing on the network.

### Spec
```
GET /api/v1/publishers
```

**Query params:**

| Name | Type | Required | Default | Max | Notes |
|---|---|---|---|---|---|
| `limit` | int | no | 25 | 100 | |
| `verified_only` | bool | no | false | — | If true, exclude unverified publishers. |
| `track` | string | no | — | — | Filter by track: `ZERO` / `SOLO` / `TEAM`. |

**Response:**
```json
{
  "count": 3,
  "results": [
    {
      "slug": "sneeze-it",
      "name": "Sneeze It",
      "description": "Performance marketing agency running an AI agent army.",
      "publish_count": 47,
      "last_published_at": "2026-05-08",
      "url": "https://sneeze.it",
      "verified": true,
      "tracks": ["TEAM"]
    }
  ]
}
```

**Implementation notes:**
- Filter: `WHERE public_profile = true`.
- Sort: `last_published_at DESC NULLS LAST, publish_count DESC`.
- Cache for 5 min.

---

## Endpoint 4 — Get org profile

### Purpose
Single publisher's public profile.

### Spec
```
GET /api/v1/orgs/{slug}
```

**Path params:**

| Name | Type | Required | Notes |
|---|---|---|---|
| `slug` | string | yes | URL-safe slug. |

**Response:**
```json
{
  "slug": "sneeze-it",
  "name": "Sneeze It",
  "description": "Performance marketing agency. Founder David Steel...",
  "website": "https://sneeze.it",
  "publish_count": 47,
  "member_since": "2026-02-01",
  "verified": true,
  "tracks": ["TEAM"],
  "bassim_score": "6.4 / 8.0",
  "agent_count": 13,
  "human_count": 18,
  "contact": "publish@orgtp.com"
}
```

**Errors:**
- `404` if slug not found OR `public_profile = false`.

---

## Endpoint 5 — Get org chart

### Purpose
A publisher's public agent + human accountability chart. The visual centerpiece — the slide that sells OTP.

### Spec
```
GET /api/v1/orgs/{slug}/chart
```

**Path params:**

| Name | Type | Required | Notes |
|---|---|---|---|
| `slug` | string | yes | |

**Response:**
```json
{
  "slug": "sneeze-it",
  "leader": {
    "name": "David Steel",
    "role": "CEO",
    "type": "human"
  },
  "seats": [
    { "name": "Radar", "role": "Chief of Staff", "type": "agent", "color": "olive" },
    { "name": "Bogdan", "role": "COO", "type": "human" }
  ],
  "note": "Humans and agents share one chart, one scorecard, one accountability layer."
}
```

**Seat object:**
| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | |
| `role` | string | yes | |
| `type` | enum | yes | `"human"` or `"agent"` |
| `color` | string | no | Optional brand color hint. |
| `reports_to` | string | no | Name of parent seat (for nested charts). |

**Errors:**
- `404` if org doesn't expose a public chart.

**Implementation notes:**
- Publisher controls per-seat visibility.
- Default to flat list. Nested support optional in v1.

---

## Endpoint 6 — Patterns

### Purpose
Convergent patterns: practices that multiple publishers have independently arrived at. The "everyone is solving this the same way" signal.

### Spec
```
GET /api/v1/patterns
```

**Query params:**

| Name | Type | Required | Default | Max | Notes |
|---|---|---|---|---|---|
| `topic` | string | no | — | — | Optional tag/topic filter. |
| `limit` | int | no | 15 | 50 | |
| `min_orgs` | int | no | 2 | — | Minimum number of publishers observing. |

**Response:**
```json
{
  "count": 1,
  "results": [
    {
      "id": "pat-001",
      "title": "Read-only-by-default for client-data integrations",
      "orgs_observed": 4,
      "summary": "Multiple publishers independently arrived at gating writes behind explicit env vars.",
      "tags": ["security", "agents"],
      "example_publishers": ["sneeze-it", "clear-skies"],
      "first_observed_at": "2026-03-10"
    }
  ]
}
```

**Implementation notes:**
- Patterns are **derived data**, not user-published. Generated by a scheduled job (suggest hourly) that clusters similar best-practices and learnings across publishers.
- Clustering approach v1: tag overlap + embedding similarity (cosine ≥ 0.85). Group when ≥ `min_orgs` distinct publishers contribute.
- Persist to a `patterns` table with regeneration timestamp.
- Cache aggressively: this endpoint can serve from materialized view.

---

## Endpoint 7 — Rules for role

### Purpose
Return the rules and learnings that apply to a specific role or agent archetype. Powers "what should my new agent know?" before it executes.

### Spec
```
GET /api/v1/rules
```

**Query params:**

| Name | Type | Required | Default | Max | Notes |
|---|---|---|---|---|---|
| `role` | string | yes | — | — | Role/archetype, e.g. `chief-of-staff`. |
| `limit` | int | no | 25 | 100 | |
| `publisher` | string | no | — | — | Optional slug filter. |

**Response:**
```json
{
  "role": "sales-agent",
  "count": 2,
  "results": [
    {
      "rule": "Never close opportunities based on stage age alone.",
      "source": "sneeze-it/dirk",
      "tags": ["sales", "data-integrity"],
      "captured_at": "2026-04-13"
    }
  ]
}
```

**Implementation notes:**
- Rules table has a `roles` text array column. Filter: `WHERE 'sales-agent' = ANY(roles) AND public = true`.
- Maintain a canonical role taxonomy. Document the allowed list in `/docs/roles`.
- Sort: most-corroborated first (count of distinct publishers asserting it), then `captured_at DESC`.

---

## Endpoint 8 — Sample KPIs

### Purpose
Show what KPIs publishers track. Powers benchmarking — "is what I'm measuring what others measure?"

### Spec
```
GET /api/v1/kpis
```

**Query params:**

| Name | Type | Required | Default | Max | Notes |
|---|---|---|---|---|---|
| `category` | string | no | — | — | Filter by category, e.g. `revenue`, `ops`, `agents`, `people`. |
| `limit` | int | no | 20 | 100 | |
| `publisher` | string | no | — | — | Optional slug filter. |

**Response:**
```json
{
  "count": 1,
  "results": [
    {
      "name": "Active Projects",
      "category": "ops",
      "publisher": "sneeze-it",
      "target": 30,
      "current": 27,
      "unit": "count"
    }
  ]
}
```

**Field semantics:**
- `target` and `current` are nullable. Some publishers expose names only.
- `unit` is free-form (e.g. `count`, `percent`, `usd`, `score-out-of-8`).
- Publishers can opt out of exposing values per KPI (name-only mode).

**Implementation notes:**
- Filter: `WHERE public = true`.
- Sort: `category ASC, name ASC` for stable display.

---

## TypeScript types (paste into shared types package)

```ts
export type Track = "ZERO" | "SOLO" | "TEAM";

export interface Publisher {
  slug: string;
  name: string;
  description: string;
  publish_count: number;
  last_published_at: string | null;
  url: string;
  verified: boolean;
  tracks: Track[];
}

export interface Org extends Publisher {
  member_since: string;
  bassim_score?: string;
  agent_count?: number;
  human_count?: number;
  contact?: string;
  website?: string;
}

export interface Seat {
  name: string;
  role: string;
  type: "human" | "agent";
  color?: string;
  reports_to?: string;
}

export interface OrgChart {
  slug: string;
  leader: Seat;
  seats: Seat[];
  note?: string;
}

export interface BestPractice {
  id: string;
  title: string;
  publisher: string;
  summary: string;
  body?: string;
  tags: string[];
  published_at: string;
  verified_outcomes: number;
  url: string;
}

export interface Learning {
  id: string;
  publisher: string;
  agent: string;
  what_failed: string;
  what_to_do: string;
  why: string;
  source_url?: string;
  captured_at: string;
}

export interface Pattern {
  id: string;
  title: string;
  orgs_observed: number;
  summary: string;
  tags: string[];
  example_publishers: string[];
  first_observed_at: string;
}

export interface Rule {
  rule: string;
  source: string;
  tags?: string[];
  captured_at?: string;
}

export interface KPI {
  name: string;
  category: string;
  publisher: string;
  target?: number;
  current?: number;
  unit?: string;
}
```

---

## Acceptance criteria

A reviewer should be able to check each box. The endpoint surface is "done" when all are true.

### Per-endpoint
- [ ] Returns 200 with a well-formed response for the happy path
- [ ] Returns 400 with the standard error envelope when a required param is missing or malformed
- [ ] Returns 404 with the standard error envelope for missing/private resources
- [ ] Honors `limit` and clamps to documented max
- [ ] Sorts as documented (deterministic order across requests)
- [ ] Excludes resources where `public = false`

### Cross-cutting
- [ ] All endpoints respond in < 200ms p95 for cached requests
- [ ] All endpoints respond in < 800ms p95 for cold requests
- [ ] CORS works from a browser on a different origin (test from a Codepen)
- [ ] Rate limiting fires at 60 req/min/IP and returns 429 with `Retry-After`
- [ ] OpenAPI 3.1 schema published at `/api/v1/openapi.json`
- [ ] Postman collection or `curl` examples in repo README

### Smoke test (full surface)
The MCP server's mock fixtures (`src/mocks.ts`) double as integration test fixtures. Each tool should return shape-equivalent data when run against the live API:

```bash
# After endpoints are live:
cd /Users/dsteel/otp-mcp-server
unset OTP_MOCK
node dist/index.js
# Send tools/call requests and verify each returns the same JSON shape as mocks.
```

---

## Out of scope for v1

These are deliberately deferred — do not block the launch on them:

- Auth / API keys
- Pagination cursors
- Webhook subscriptions
- Streaming endpoints
- Write surface (publishing, capturing) — lives on the authenticated publisher API
- Per-publisher analytics
- Internationalization

---

## Stretch (v1.1 candidates)

If endpoints come in fast, these multiply discoverability:

- `GET /api/v1/feed` — combined chronological feed (best practices + learnings + new publishers) for "what's new on OTP"
- `GET /api/v1/orgs/:slug/feed` — per-publisher feed
- `GET /api/v1/search` — unified search across all resource types
- `GET /api/v1/stats` — network-wide stats (publisher count, learnings count, patterns count) for the homepage

---

## Suggested implementation path

1. **Day 1:** Endpoints 3 (publishers), 4 (org profile), 5 (chart). Highest marketing weight.
2. **Day 2:** Endpoints 1 (best practices search), 2 (learnings), 7 (rules), 8 (KPIs).
3. **Day 3:** Endpoint 6 (patterns) including the clustering job. Patterns is the most complex; everything else is straight Postgres queries.
4. **Day 3.5:** OpenAPI spec, rate limiting, deploy.

Total: ~3 days for a focused builder. Probably 1.5 days if the underlying data already exists in the OTP DB (which most of it does).

---

**Hand-off:** drop this file into a Linear/Trello ticket titled "Build OTP public REST API v1." Assign to whoever's owning orgtp.com. The MCP server is the consumer of record — don't change the response shapes without bumping the MCP server version in lockstep.
