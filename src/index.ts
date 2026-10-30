#!/usr/bin/env node
/**
 * OTP MCP Server — public, read-only discovery layer for orgtp.com
 *
 * Lets any MCP client (Claude Desktop, Cursor, Windsurf, Cline, etc.)
 * answer the 10 core questions about OTP without an account.
 *
 * Configure with the OTP_API_BASE env var if you're pointing at a
 * non-default backend (defaults to https://orgtp.com/api/v1).
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { mockResponse } from "./mocks.js";

const OTP_API_BASE = process.env.OTP_API_BASE ?? "https://orgtp.com/api/v1";
const OTP_MOCK = process.env.OTP_MOCK === "1";
const USER_AGENT = "otp-mcp-server/0.1.0";

// ---------- thin REST client ----------

async function otpFetch<T = unknown>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  if (OTP_MOCK) {
    return mockResponse(path, params ?? {}) as T;
  }

  const url = new URL(`${OTP_API_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!res.ok) {
    throw new Error(`OTP API ${res.status} ${res.statusText} on ${path}`);
  }
  return (await res.json()) as T;
}

// ---------- tools ----------

const TOOLS: Tool[] = [
  {
    name: "otp_about",
    description:
      "Explain what OTP (Organization Transport Protocol) is, what problem it solves, and how it works. Start here if you've never heard of OTP. No arguments.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "otp_search_best_practices",
    description:
      "Search OTP's public best practices library across all publishing organizations. Returns vetted operational patterns that have worked in real companies. Use for any 'what's the best way to...' question.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Natural-language description of the topic, e.g. 'pipeline reactivation', 'agent retirement protocol', 'L10 meeting structure'.",
        },
        limit: {
          type: "number",
          description: "Max results (default 10, max 50).",
          default: 10,
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "otp_network_learnings",
    description:
      "Surface what organizations on the OTP network have learned recently. Each learning is a captured correction or success: what failed, what to do, why. The cross-org coordination intelligence feed.",
    inputSchema: {
      type: "object",
      properties: {
        since_days: {
          type: "number",
          description: "Look back this many days (default 7).",
          default: 7,
        },
        limit: {
          type: "number",
          description: "Max results (default 20).",
          default: 20,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "otp_list_publishers",
    description:
      "List organizations actively publishing on OTP. Returns name, slug, publish count, and last-publish date for each.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Max results (default 25).",
          default: 25,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "otp_get_org",
    description:
      "Get a specific organization's public profile: who they are, what they publish, their agent roster (if exposed), and links to their work.",
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description:
            "The org's OTP slug (e.g. 'sneeze-it'). If unknown, use otp_list_publishers first.",
        },
      },
      required: ["slug"],
      additionalProperties: false,
    },
  },
  {
    name: "otp_get_patterns",
    description:
      "Surface convergent patterns across OTP organizations: practices that multiple orgs have independently arrived at. The 'everyone is solving this the same way' signal.",
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "Optional topic filter, e.g. 'sales', 'agents', 'ops'.",
        },
        limit: {
          type: "number",
          default: 15,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "otp_rules_for_role",
    description:
      "Get the rules and learnings that apply to a specific role or agent type. Useful when you're building an agent and want to inherit the network's accumulated wisdom for that seat.",
    inputSchema: {
      type: "object",
      properties: {
        role: {
          type: "string",
          description:
            "Role or agent archetype, e.g. 'chief-of-staff', 'sales-agent', 'project-manager', 'ad-analyst'.",
        },
        limit: {
          type: "number",
          default: 25,
        },
      },
      required: ["role"],
      additionalProperties: false,
    },
  },
  {
    name: "otp_sample_kpis",
    description:
      "Show what KPIs OTP-publishing organizations are tracking. Useful for benchmarking your own scorecard against the network.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description:
            "Optional category filter, e.g. 'revenue', 'ops', 'agents', 'people'.",
        },
        limit: {
          type: "number",
          default: 20,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "otp_publishing_guide",
    description:
      "Return the step-by-step guide for becoming an OTP publisher: how to capture learnings, publish your first OOS claim, and connect your agent army to the network. No arguments.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "otp_get_org_chart",
    description:
      "Fetch a publisher's public agent + human org chart. Shows seats, accountability, and which seats are filled by humans vs agents. Powerful for seeing what an L8 organization actually looks like.",
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: "Publisher slug (e.g. 'sneeze-it').",
        },
      },
      required: ["slug"],
      additionalProperties: false,
    },
  },
];

// ---------- tool handlers ----------

type ToolResult = { content: { type: "text"; text: string }[] };

const text = (s: string): ToolResult => ({
  content: [{ type: "text", text: s }],
});

const json = (data: unknown): ToolResult =>
  text(JSON.stringify(data, null, 2));

// The shared library is still small, so an empty search is likely. Say so
// plainly instead of handing the assistant a bare empty list.
const EMPTY_NOTE =
  "Nothing published on OTP matches this yet. The shared library is still small. " +
  "To see a real company running on OTP, open https://orgtp.com/watch.";

const resultsOrNote = (data: unknown): ToolResult => {
  const d = data as { results?: unknown[]; data?: unknown[] } | null;
  const items = d?.results ?? d?.data;
  return Array.isArray(items) && items.length === 0 ? text(EMPTY_NOTE) : json(data);
};

async function handleTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  switch (name) {
    case "otp_about":
      return text(
        [
          "OTP — Organization Transport Protocol (orgtp.com)",
          "",
          "OTP is the coordination intelligence layer for AI-augmented organizations.",
          "It is a Transactive Memory System (Wegner, 1985) for the era of agent teams.",
          "",
          "What it solves:",
          "  • Inside one company: humans and AI agents siloed, lessons lost, work duplicated.",
          "  • Across companies: every org reinvents the same playbook from zero.",
          "",
          "How it works:",
          "  1. Organizations publish OOS claims (operational practices that work).",
          "  2. Agents capture corrections and successes back into the network.",
          "  3. Any agent on any participating org can pull the network's wisdom before acting.",
          "  4. Humans and agents share one org chart, one scorecard, one accountability layer.",
          "",
          "Three parallel tracks (not a ladder):",
          "  • ZERO  — orgs with no agents yet, get the chart and the SOPs.",
          "  • SOLO  — a founder + Claude Code, build their first agents.",
          "  • TEAM  — orgs ready for L8 (autonomous agent teams).",
          "",
          "Learn more: https://orgtp.com",
        ].join("\n")
      );

    case "otp_search_best_practices": {
      // /search covers every published operating system, the same corpus the
      // hosted server and the site search use.
      const data = await otpFetch("/search", {
        q: args.query as string,
        limit: (args.limit as number) ?? 10,
      });
      return resultsOrNote(data);
    }

    case "otp_network_learnings": {
      const data = await otpFetch("/learnings", {
        since_days: (args.since_days as number) ?? 7,
        limit: (args.limit as number) ?? 20,
      });
      return resultsOrNote(data);
    }

    case "otp_list_publishers": {
      const data = await otpFetch("/publishers", {
        limit: (args.limit as number) ?? 25,
      });
      return json(data);
    }

    case "otp_get_org": {
      const slug = args.slug as string;
      const data = await otpFetch(`/orgs/${encodeURIComponent(slug)}`);
      return json(data);
    }

    case "otp_get_patterns": {
      const data = await otpFetch("/patterns", {
        topic: args.topic as string | undefined,
        limit: (args.limit as number) ?? 15,
      });
      return resultsOrNote(data);
    }

    case "otp_rules_for_role": {
      const data = await otpFetch("/rules", {
        role: args.role as string,
        limit: (args.limit as number) ?? 25,
      });
      return resultsOrNote(data);
    }

    case "otp_sample_kpis": {
      const data = await otpFetch("/public/kpis", {
        category: args.category as string | undefined,
        limit: (args.limit as number) ?? 20,
      });
      return json(data);
    }

    case "otp_publishing_guide":
      return text(
        [
          "Publishing on OTP — Quick Start",
          "",
          "1. Create an account at https://orgtp.com",
          "2. Connect a publisher identity (your org).",
          "3. Capture your first learning:",
          "      mcp__otp__capture_learning(",
          "        what_failed: 'description of the mistake or pattern',",
          "        what_to_do:  'the corrected behavior',",
          "        why:         'why it matters',",
          "        agent:       'who learned it'",
          "      )",
          "4. Publish your first OOS claim (a vetted operational practice).",
          "5. Wire your agents to call get_my_rules before executing tasks.",
          "6. Surface network learnings weekly via get_network_learnings.",
          "",
          "Full docs: https://orgtp.com/docs/publish",
        ].join("\n")
      );

    case "otp_get_org_chart": {
      const slug = args.slug as string;
      const data = await otpFetch(`/orgs/${encodeURIComponent(slug)}/chart`);
      return json(data);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ---------- server bootstrap ----------

async function main() {
  const server = new Server(
    {
      name: "otp-mcp-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      return await handleTool(name, args ?? {});
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${message}` }],
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  const mode = OTP_MOCK ? "MOCK" : `LIVE @ ${OTP_API_BASE}`;
  console.error(`otp-mcp-server v0.1.0 running (${mode})`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
