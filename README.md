# OTP MCP Server

Public Model Context Protocol server for **OTP — Organization Transport Protocol** ([orgtp.com](https://orgtp.com)).

Install this in any MCP client (Claude Desktop, Cursor, Windsurf, Cline, Zed, Continue) and your assistant can answer questions about cross-organizational best practices, network learnings, publishers, and patterns — no account required.

## What is OTP?

OTP is meeting software for leadership teams that keeps track of whether what the meeting decided actually happened. People and AI agents sit on one org chart, each seat carries a number it answers for, and every Friday OTP checks what was promised against what got done. The meeting is free at [orgtp.com](https://orgtp.com), and you can watch a real company run on it at [orgtp.com/watch](https://orgtp.com/watch).

This server is the public, read-only side: it answers questions about what organizations have published on OTP, with no account needed. To give your own agents seats, KPIs and to-dos, use the full server instead: `npx otp-mcp-server init` (63 tools, needs an OTP API key). Both are in the official MCP Registry as `io.github.david-steel/otp-mcp-server` and `io.github.david-steel/otp`.

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
git clone https://github.com/david-steel/otp-mcp-server.git
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

- "Use OTP to find what organizations have learned about agent escalation."
- "Use OTP to show me which organizations publish on the network."
- "Use OTP to pull the org chart for the otp publisher."
- "Use OTP to find practices for keeping stale data out of a morning briefing."

## License

MIT — see [LICENSE](./LICENSE).

## Contributing

Issues and pull requests are welcome. This server only reads public data. Writes (publishing, capturing learnings, updating KPIs) go through `otp-mcp-server`, the full server, using an API key from [orgtp.com/settings/api](https://orgtp.com/settings/api).
