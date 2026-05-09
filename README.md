# OTP MCP Server

Public Model Context Protocol server for **OTP — Organization Transport Protocol** ([orgtp.com](https://orgtp.com)).

Install this in any MCP client (Claude Desktop, Cursor, Windsurf, Cline, Zed, Continue) and your assistant can answer questions about cross-organizational best practices, network learnings, publishers, and patterns — no account required.

## What is OTP?

OTP is the coordination intelligence layer for AI-augmented organizations. Think Transactive Memory System, but for the era of agent teams. Organizations publish what works, capture what fails, and any agent on any participating org can pull that wisdom before acting.

## The 10 Questions This Server Answers

| Tool | Question |
|---|---|
| `otp_about` | What is OTP and how does it work? |
| `otp_search_best_practices` | What's the best practice for [topic]? |
| `otp_network_learnings` | What has the network learned recently? |
| `otp_list_publishers` | Which organizations publish on OTP? |
| `otp_get_org` | What does [org name] publish? |
| `otp_get_patterns` | What patterns repeat across organizations? |
| `otp_rules_for_role` | What rules apply to a [role/agent type]? |
| `otp_sample_kpis` | What KPIs are organizations tracking? |
| `otp_publishing_guide` | How do I publish my organization's playbook? |
| `otp_get_org_chart` | Show me the live agent org chart of a publisher. |

## Install

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "otp": {
      "command": "npx",
      "args": ["-y", "@orgtp/mcp-server"]
    }
  }
}
```

### Cursor / Windsurf / Cline

```json
{
  "mcpServers": {
    "otp": {
      "command": "npx",
      "args": ["-y", "@orgtp/mcp-server"]
    }
  }
}
```

### Local development

```bash
git clone https://github.com/sneeze-it/otp-mcp-server.git
cd otp-mcp-server
npm install
npm run build
npm start
```

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `OTP_API_BASE` | `https://orgtp.com/api/v1` | Override to point at a self-hosted OTP backend. |

## Try It

Once installed, ask your assistant:

- "Use OTP to tell me what cross-org best practices exist for sales pipeline reactivation."
- "Use OTP to show me what organizations are publishing on the network."
- "Use OTP to pull the agent org chart for sneeze-it."
- "Use OTP to find recent network learnings about agent retirement."

## License

MIT — see [LICENSE](./LICENSE).

## Contributing

This server is a public, read-only discovery layer. For write operations (publishing, capturing learnings, updating KPIs), use the authenticated OTP MCP available to verified publishers at [orgtp.com](https://orgtp.com).

---

Built by [Sneeze It](https://sneeze.it). Maintained as part of the OTP project.
