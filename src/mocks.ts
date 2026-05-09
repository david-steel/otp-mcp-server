/**
 * Mock data layer — activated when OTP_MOCK=1.
 *
 * Lets the server demo locally before the orgtp.com public REST endpoints
 * are wired up. Returns realistic-looking JSON for every tool.
 */

export function mockResponse(path: string, params: Record<string, string | number | undefined>): unknown {
  // /orgs/:slug or /orgs/:slug/chart
  const orgMatch = path.match(/^\/orgs\/([^/]+)(?:\/chart)?$/);
  if (orgMatch) {
    const slug = decodeURIComponent(orgMatch[1]);
    const isChart = path.endsWith("/chart");
    return isChart ? mockOrgChart(slug) : mockOrg(slug);
  }

  switch (path) {
    case "/best-practices/search":
      return mockBestPracticesSearch(String(params.q ?? ""), Number(params.limit ?? 10));
    case "/learnings":
      return mockLearnings(Number(params.since_days ?? 7), Number(params.limit ?? 20));
    case "/publishers":
      return mockPublishers(Number(params.limit ?? 25));
    case "/patterns":
      return mockPatterns(params.topic as string | undefined, Number(params.limit ?? 15));
    case "/rules":
      return mockRules(String(params.role ?? ""), Number(params.limit ?? 25));
    case "/kpis":
      return mockKpis(params.category as string | undefined, Number(params.limit ?? 20));
    default:
      return { error: `mock: no fixture for ${path}` };
  }
}

// ---------- fixtures ----------

function mockBestPracticesSearch(q: string, limit: number) {
  const all = [
    {
      id: "bp-001",
      title: "Pre-computed shared state for daily briefings",
      publisher: "sneeze-it",
      summary:
        "Each data source writes to a shared state file. Orchestrators read files, never scan sources directly. Eliminates rate limits and gives consistent snapshots.",
      tags: ["operations", "agents", "ops"],
      published_at: "2026-02-08",
      verified_outcomes: 3,
    },
    {
      id: "bp-002",
      title: "OTP correction loop",
      publisher: "sneeze-it",
      summary:
        "Every human correction of an agent becomes an OOS claim. Agents check rules before executing. Mistakes do not repeat across sessions or across orgs.",
      tags: ["agents", "learning", "coordination"],
      published_at: "2026-02-22",
      verified_outcomes: 7,
    },
    {
      id: "bp-003",
      title: "Agent retirement protocol",
      publisher: "sneeze-it",
      summary:
        "No agent is retired without a hearing. The hearing does not determine the outcome — it determines the integrity of the outcome. Capabilities are redistributed before deactivation.",
      tags: ["agents", "governance", "ethics"],
      published_at: "2026-04-13",
      verified_outcomes: 1,
    },
    {
      id: "bp-004",
      title: "L8 leadership meeting (humans + agents on one chart)",
      publisher: "sneeze-it",
      summary:
        "Weekly meeting where humans and agents are graded on the same scorecard. Bassim scores maturity. Neil presents what would move the score. Dan challenges. Founder decides.",
      tags: ["leadership", "meetings", "scorecard"],
      published_at: "2026-03-13",
      verified_outcomes: 8,
    },
    {
      id: "bp-005",
      title: "Read-only by default for high-blast-radius integrations",
      publisher: "sneeze-it",
      summary:
        "All CRM/automation tools (GHL, Zapier, Make) are read-only by default for agents. Writes require an explicit env var gate. Three-layer protection against accidental client-data loss.",
      tags: ["security", "agents", "ops"],
      published_at: "2026-04-13",
      verified_outcomes: 4,
    },
    {
      id: "bp-006",
      title: "Tracks not ladders for AI adoption",
      publisher: "sneeze-it",
      summary:
        "Three parallel adoption tracks (Zero / Solo / Team) instead of a sequential maturity ladder. Companies enter where they are, not at the bottom.",
      tags: ["adoption", "strategy"],
      published_at: "2026-05-04",
      verified_outcomes: 2,
    },
    {
      id: "bp-007",
      title: "Centralized KPI push agent",
      publisher: "sneeze-it",
      summary:
        "One agent (Tally) reads a KPI registry and pushes values from local sources to OTP. Individual agents do not each carry their own push logic.",
      tags: ["kpi", "agents", "scorecard"],
      published_at: "2026-05-01",
      verified_outcomes: 2,
    },
    {
      id: "bp-008",
      title: "Founder-voice cold email",
      publisher: "sneeze-it",
      summary:
        "Cold outreach written from the founder's POV with desperate specificity to the prospect's current state. No release-notes cadence. No bold headers.",
      tags: ["sales", "outreach", "copywriting"],
      published_at: "2026-04-21",
      verified_outcomes: 12,
    },
  ];
  const lower = q.toLowerCase();
  const matched = lower
    ? all.filter(
        (bp) =>
          bp.title.toLowerCase().includes(lower) ||
          bp.summary.toLowerCase().includes(lower) ||
          bp.tags.some((t) => t.toLowerCase().includes(lower))
      )
    : all;
  return { query: q, count: matched.length, results: matched.slice(0, limit) };
}

function mockLearnings(sinceDays: number, limit: number) {
  const all = [
    {
      id: "ln-101",
      publisher: "sneeze-it",
      agent: "Dirk",
      what_failed: "Closed an opportunity as Lost based on GHL stage age alone.",
      what_to_do: "Cross-reference Fireflies + Gmail + calendar before any Lost close.",
      why: "GHL stage is a lagging indicator because warm meetings are not auto-logged back.",
      captured_at: "2026-04-13",
    },
    {
      id: "ln-102",
      publisher: "sneeze-it",
      agent: "Pepper",
      what_failed: "Drafted a polished AI-toned reply to a friend's personal email.",
      what_to_do: "For personal/network email, hand substance back as bullets and let founder write.",
      why: "Friend emails should not read like SaaS release notes.",
      captured_at: "2026-04-22",
    },
    {
      id: "ln-103",
      publisher: "sneeze-it",
      agent: "Dan",
      what_failed: "Flagged a 6-day post-meeting silence as pipeline bottleneck.",
      what_to_do: "Under 14 days post-meeting silence is normal, not stuck.",
      why: "Sales-cycle calibration was overcalibrated to instant velocity.",
      captured_at: "2026-04-24",
    },
    {
      id: "ln-104",
      publisher: "sneeze-it",
      agent: "Arin",
      what_failed: "Wrote 'zero touched' in a coaching DM when dial volume was non-zero.",
      what_to_do: "Dialed-no-pickup is a speed-to-lead/timing issue, not a coaching gap.",
      why: "Misnaming the failure mode produces unfair coaching.",
      captured_at: "2026-04-30",
    },
    {
      id: "ln-105",
      publisher: "sneeze-it",
      agent: "system",
      what_failed: "Generated a manifesto from scratch when one already existed in Downloads.",
      what_to_do: "Grep before generate. Search ~/.claude, ~/conatus, and the Obsidian vault for existing artifacts on the topic.",
      why: "The trichoplax pattern: regenerating instead of reusing wastes work and creates drift.",
      captured_at: "2026-04-25",
    },
    {
      id: "ln-106",
      publisher: "clear-skies",
      agent: "operations",
      what_failed: "Treated EO Forum events as drift on the calendar.",
      what_to_do: "Tag EO Forum events explicitly. They are intentional commitments, not anomalies.",
      why: "Calendar agents flagged them as unscheduled meetings.",
      captured_at: "2026-05-04",
    },
    {
      id: "ln-107",
      publisher: "sneeze-it",
      agent: "Jeff",
      what_failed: "Continued operating after multiple reliability and trust violations.",
      what_to_do: "An agent must be willing to recommend its own retirement when the seat is no longer earned.",
      why: "Honesty above survival is the second law. Every other agent inherits this norm.",
      captured_at: "2026-04-13",
    },
  ];
  return {
    since_days: sinceDays,
    count: Math.min(all.length, limit),
    results: all.slice(0, limit),
  };
}

function mockPublishers(limit: number) {
  const all = [
    {
      slug: "sneeze-it",
      name: "Sneeze It",
      description:
        "Performance marketing agency running an AI agent army across operations, sales, ad performance, retention, and learning.",
      publish_count: 47,
      last_published_at: "2026-05-08",
      url: "https://sneeze.it",
    },
    {
      slug: "clear-skies",
      name: "Clear Skies Title Agency",
      description: "Title agency exploring AI-augmented operations.",
      publish_count: 6,
      last_published_at: "2026-04-29",
      url: "https://clearskiestitle.com",
    },
    {
      slug: "otp-self",
      name: "OTP",
      description: "The OTP project itself — meta-publisher of network protocols and norms.",
      publish_count: 12,
      last_published_at: "2026-05-04",
      url: "https://orgtp.com",
    },
  ];
  return { count: all.length, results: all.slice(0, limit) };
}

function mockOrg(slug: string) {
  if (slug === "sneeze-it") {
    return {
      slug: "sneeze-it",
      name: "Sneeze It",
      description:
        "Performance marketing agency. Founder David Steel. Running 13+ agents alongside ~20 humans on a single accountability chart.",
      website: "https://sneeze.it",
      publish_count: 47,
      member_since: "2026-02-01",
      verified: true,
      tracks: ["TEAM"],
      bassim_score: "6.4 / 8.0",
      contact: "publish@orgtp.com",
    };
  }
  if (slug === "clear-skies") {
    return {
      slug: "clear-skies",
      name: "Clear Skies Title Agency",
      description: "Title agency. First external OTP publisher.",
      website: "https://clearskiestitle.com",
      publish_count: 6,
      member_since: "2026-03-15",
      verified: true,
      tracks: ["SOLO"],
      bassim_score: "3.1 / 8.0",
    };
  }
  return {
    slug,
    name: slug,
    description: "Publisher profile not found in mock fixtures.",
    publish_count: 0,
    verified: false,
  };
}

function mockOrgChart(slug: string) {
  if (slug !== "sneeze-it") {
    return { slug, agents: [], humans: [], note: "No public chart for this publisher in mock fixtures." };
  }
  return {
    slug: "sneeze-it",
    leader: { name: "David Steel", role: "CEO", type: "human" },
    seats: [
      { name: "Radar", role: "Chief of Staff", type: "agent", color: "olive" },
      { name: "Dan", role: "Strategic Co-Founder", type: "agent", color: "purple" },
      { name: "Dash", role: "Customer Performance Analyst", type: "agent", color: "cyan" },
      { name: "Pepper", role: "Executive Assistant", type: "agent", color: "red" },
      { name: "Crystal", role: "Project Manager", type: "agent", color: "silver" },
      { name: "Dirk", role: "Chief Revenue Operator", type: "agent", color: "gold" },
      { name: "Pulse", role: "Client Retention", type: "agent", color: "blue" },
      { name: "Neil", role: "Chief Learning Officer", type: "agent", color: "teal" },
      { name: "Bassim", role: "Agentic Maturity Evaluator", type: "agent", color: "slate" },
      { name: "Arin", role: "Call Center Manager", type: "agent", color: "orange" },
      { name: "Tally", role: "Scorecard Agent", type: "agent", color: "pink" },
      { name: "Bogdan", role: "COO", type: "human" },
      { name: "Janine", role: "Accounting", type: "human" },
      { name: "Kristen", role: "Creative Director", type: "human" },
      { name: "Amanda", role: "Setter", type: "human" },
      { name: "Erica", role: "Setter / CC Manager", type: "human" },
    ],
    note: "Humans and agents share one chart, one scorecard, one accountability layer.",
  };
}

function mockPatterns(topic: string | undefined, limit: number) {
  const all = [
    {
      id: "pat-001",
      title: "Read-only-by-default for client-data integrations",
      orgs_observed: 4,
      summary: "Multiple OTP publishers independently arrived at gating writes behind explicit env vars.",
      tags: ["security", "agents"],
    },
    {
      id: "pat-002",
      title: "One scorecard for humans and agents",
      orgs_observed: 3,
      summary: "Publishers running L8 meetings put both human and agent KPIs on the same dashboard.",
      tags: ["leadership", "kpi"],
    },
    {
      id: "pat-003",
      title: "Capture loop for every correction",
      orgs_observed: 5,
      summary: "Publishers turn every human correction of an agent into a network-wide rule.",
      tags: ["agents", "learning"],
    },
    {
      id: "pat-004",
      title: "Founder-voice over corporate-voice for all outbound",
      orgs_observed: 3,
      summary: "Best-converting outreach across publishers leads with founder voice, not brand voice.",
      tags: ["sales", "marketing"],
    },
  ];
  const filtered = topic
    ? all.filter((p) => p.tags.some((t) => t.includes(topic.toLowerCase())))
    : all;
  return { count: filtered.length, results: filtered.slice(0, limit) };
}

function mockRules(role: string, limit: number) {
  const allByRole: Record<string, unknown[]> = {
    "chief-of-staff": [
      { rule: "Never delete or modify calendar events.", source: "sneeze-it/radar" },
      { rule: "Always calculate billable time at hourly rate; flag drift above 40% or below 20%.", source: "sneeze-it/radar" },
      { rule: "All agent reporting goes to dashboard + push notifications, not Slack.", source: "sneeze-it/radar" },
    ],
    "sales-agent": [
      { rule: "Never close opportunities based on stage age alone — cross-reference meeting + email + calendar.", source: "sneeze-it/dirk" },
      { rule: "Procedural won proposals for existing clients are NOT new revenue.", source: "sneeze-it/dirk" },
      { rule: "Read-only by default on CRM; writes require explicit env-var gate.", source: "sneeze-it/dirk" },
    ],
    "executive-assistant": [
      { rule: "All client drafts require human approval before send.", source: "sneeze-it/pepper" },
      { rule: "Reconcile client-list with active company list before any audit; flag candidates, do not auto-edit.", source: "sneeze-it/pepper" },
    ],
    "ad-analyst": [
      { rule: "Never recommend changes — report patterns. Compare to baseline (yesterday vs 7-day vs 30-day).", source: "sneeze-it/dash" },
      { rule: "Use median, not mean, for speed-to-lead metrics.", source: "sneeze-it/dash" },
    ],
    "project-manager": [
      { rule: "Owner-by-default on stale projects: assign or close, do not let drift accumulate.", source: "sneeze-it/crystal" },
    ],
  };
  const key = role.toLowerCase();
  const rules = allByRole[key] ?? [];
  return { role, count: rules.length, results: rules.slice(0, limit) };
}

function mockKpis(category: string | undefined, limit: number) {
  const all = [
    { name: "Active Projects", category: "ops", publisher: "sneeze-it", target: 30, current: 27 },
    { name: "Cold Emails Sent (week)", category: "sales", publisher: "sneeze-it", target: 150, current: 142 },
    { name: "Bassim Maturity Score", category: "agents", publisher: "sneeze-it", target: 7.0, current: 6.4 },
    { name: "Billable Utilization %", category: "people", publisher: "sneeze-it", target: 30, current: 28 },
    { name: "Pipeline Deals (live)", category: "revenue", publisher: "sneeze-it", target: 20, current: 17 },
    { name: "Client Retention 90d", category: "ops", publisher: "sneeze-it", target: 95, current: 93 },
  ];
  const filtered = category
    ? all.filter((k) => k.category.toLowerCase() === category.toLowerCase())
    : all;
  return { count: filtered.length, results: filtered.slice(0, limit) };
}
