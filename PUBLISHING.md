# Publishing the OTP MCP Server

Once the orgtp.com REST endpoints are wired (see "Backend prerequisites" at bottom), ship in this order.

---

## Step 1 — Build & smoke test

```bash
cd /Users/dsteel/otp-mcp-server
npm install
npm run build

# smoke test the binary directly
node dist/index.js
# (Press Ctrl+D to send EOF and watch it exit cleanly.)
```

Then test against a real MCP client. In Claude Desktop config:

```json
{
  "mcpServers": {
    "otp-local": {
      "command": "node",
      "args": ["/Users/dsteel/otp-mcp-server/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop. Ask: *"Use the OTP MCP to tell me what OTP is."* If `otp_about` returns the manifesto, the wiring works.

---

## Step 2 — Publish to npm (mandatory — every other registry pulls from here)

Create the npm scope first:

```bash
npm login
npm org create orgtp           # creates @orgtp scope; or use a personal scope
```

Then publish:

```bash
cd /Users/dsteel/otp-mcp-server
npm publish --access public
```

Verify:

```bash
npx -y @orgtp/mcp-server
```

If `npx` boots the server, the install path works for every downstream registry.

---

## Step 3 — Push to GitHub

```bash
cd /Users/dsteel/otp-mcp-server
git init
git add .
git commit -m "Initial public OTP MCP server"
gh repo create sneeze-it/otp-mcp-server --public --source=. --remote=origin --push
```

Tag a release so registries auto-detect:

```bash
git tag v0.1.0
git push --tags
gh release create v0.1.0 --generate-notes
```

---

## Step 4 — Submit to the registries

### 4a. Anthropic's official MCP servers list
Open a PR against [`modelcontextprotocol/servers`](https://github.com/modelcontextprotocol/servers) adding OTP under the "Community Servers" section of the README. Highest-signal placement.

### 4b. Smithery (smithery.ai)
1. Go to https://smithery.ai/new
2. Connect the GitHub repo
3. Smithery auto-generates the `smithery.yaml` — review and merge the PR it opens
4. The server appears at `smithery.ai/server/@orgtp/mcp-server`

### 4c. Glama (glama.ai/mcp/servers)
1. Glama crawls npm + GitHub automatically — usually appears within 24h of npm publish
2. To accelerate: open https://glama.ai/mcp/servers and submit via the "Add a server" form
3. Verify ownership by adding the GitHub repo URL

### 4d. mcp.so
1. Go to https://mcp.so/submit
2. Paste the GitHub URL
3. Filled out: Name (OTP), Category (Knowledge / Coordination), Tags (agents, best-practices, transactive-memory)

### 4e. PulseMCP (pulsemcp.com)
1. https://pulsemcp.com/submit
2. Same metadata as mcp.so

### 4f. mcp-get (CLI registry)
```bash
npx @michaellatman/mcp-get@latest install @orgtp/mcp-server
# verifies the package resolves; mcp-get auto-indexes from npm
```

---

## Step 5 — Discoverability boost

Once live, do these in the same week:

1. **Add the Anthropic MCP server badge to README** (after acceptance into `modelcontextprotocol/servers`).
2. **Cross-link from orgtp.com** — homepage footer + dedicated `/mcp` page with copy-paste configs for each client.
3. **Post to:**
   - r/ClaudeAI — "We built a public MCP for cross-org best practices"
   - r/mcp — same
   - X / LinkedIn — David's accounts, lead with the install snippet
   - Hacker News — "Show HN: An MCP server for sharing operational learnings across companies"
4. **Embed the install snippet on every OTP marketing surface** — landing page, video description, deck appendix, conference handout.

The MCP is the demo. Every install is a free trial.

---

## Backend prerequisites

For the server to return real data, orgtp.com needs these public read-only REST endpoints:

| Endpoint | Returns |
|---|---|
| `GET /api/v1/best-practices/search?q=&limit=` | Search results |
| `GET /api/v1/learnings?since_days=&limit=` | Recent network learnings |
| `GET /api/v1/publishers?limit=` | List of publishing orgs |
| `GET /api/v1/orgs/:slug` | Public org profile |
| `GET /api/v1/orgs/:slug/chart` | Public agent org chart |
| `GET /api/v1/patterns?topic=&limit=` | Convergent patterns |
| `GET /api/v1/rules?role=&limit=` | Rules for role/agent type |
| `GET /api/v1/kpis?category=&limit=` | Sample KPIs |

All endpoints should be:
- Anonymous (no auth)
- Rate-limited (suggest 60 req/min/IP)
- Returning JSON
- CORS-open (so browser-based MCP clients work too)

If any endpoint isn't ready yet, the corresponding tool will surface a clean error to the user, not crash the server. You can ship before all endpoints exist — just don't promote tools that 404.

---

## Maintenance

- Bump `version` in `package.json` on every change
- `npm publish` after each `git tag`
- Smithery and Glama re-index automatically on new releases
- mcp.so / PulseMCP may need a manual ping for major updates

---

## One-line shipping summary

```bash
npm install && npm run build && npm publish --access public && \
git init && git add . && git commit -m "v0.1.0" && \
gh repo create sneeze-it/otp-mcp-server --public --source=. --remote=origin --push && \
git tag v0.1.0 && git push --tags && gh release create v0.1.0 --generate-notes
```

Then submit to the 5 registries above. Total time: ~30 minutes once endpoints are live.
