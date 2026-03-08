# Research: VulChk Security Analysis Toolkit

## Decision Log

### D1: CLI Framework — Commander.js

**Options considered**: commander, yargs, oclif, meow
**Decision**: commander
**Rationale**: Lightweight, widely adopted, simple subcommand
registration. oclif is overkill for a single-subcommand CLI.
yargs has a heavier API surface. meow lacks built-in subcommands.

### D2: Interactive Prompts — Enquirer

**Options considered**: enquirer, inquirer, prompts
**Decision**: enquirer (per user requirement)
**Rationale**: User explicitly requested enquirer for the interactive
init wizard. Enquirer is lighter than inquirer and has better prompt
composability.

### D3: Template Distribution — Bundled in npm package

**Options considered**: GitHub Release download (spec-mix pattern),
bundled in package, git clone
**Decision**: Bundled in npm package
**Rationale**: Unlike spec-mix (which supports 15+ AI agents x 2
script types = 30+ variants), VulChk targets Claude Code only.
A single set of templates can ship directly in the npm package
under `src/templates/`. No network dependency at init time.

### D4: Skill Architecture — Two skills + shared sub-agents

**Decision**: Two top-level skills (`vulchk-codeinspector`,
`vulchk-hacksimulator`) that orchestrate shared sub-agents.

**Sub-agent decomposition**:

| Agent | Purpose | Used By |
|-------|---------|---------|
| `vulchk-dependency-auditor` | CVE lookup for dependencies | codeinspector |
| `vulchk-code-pattern-scanner` | OWASP Top 10 pattern matching | codeinspector |
| `vulchk-secrets-scanner` | .gitignore, env files, git history | codeinspector |
| `vulchk-git-history-auditor` | Committed secrets in git log | codeinspector |
| `vulchk-container-security-analyzer` | Dockerfile, k8s manifests | codeinspector |
| `vulchk-attack-planner` | Build attack plan from recon | hacksimulator |
| `vulchk-attack-executor` | Execute approved attack vectors | hacksimulator |

**Rationale**: Sub-agents enable parallel execution within Claude
Code's Task tool. The dependency-auditor, code-pattern-scanner,
secrets-scanner, git-history-auditor, and container-security-analyzer
can all run concurrently for codeinspector. The attack-planner and
attack-executor run sequentially for hacksimulator (plan must be
approved before execution).

### D5: Specialized Stack Detection — Tiered approach

**Decision**: Three tiers of analysis depth:

1. **Specialized** (Node.js, React/Next.js, FastAPI):
   Framework-specific vulnerability patterns, Vercel deployment
   checks for Next.js, known Express/Fastify middleware issues.

2. **Generic** (all other stacks): OWASP Top 10 patterns,
   dependency CVE checks, secrets scanning, container security.

3. **Minimal** (unrecognized projects): Git history audit,
   secrets scanning, .gitignore verification.

### D6: Report Language — Config-driven with i18n templates

**Decision**: Report sections and descriptions are localized based
on `.vulchk/config.json` language setting. Security terms (CVE,
XSS, CSRF, etc.) always remain in English. Skill instructions
themselves are always in English.

### D7: Attack Intensity Levels

**Decision**: Three levels, selected per-run via skill interaction:

| Level | Description | Techniques |
|-------|-------------|------------|
| **Passive** | Information gathering only | Header analysis, directory enumeration, cookie inspection, technology fingerprinting, SSL/TLS check |
| **Active** | Basic vulnerability probing | XSS/SQLi payload testing, CSRF token validation, auth bypass attempts, IDOR checks, file upload testing |
| **Aggressive** | Full penetration attempt | Brute-force paths, parameter fuzzing, session manipulation, race conditions, chained exploits |

### D8: Playwright Integration Pattern

**Decision**: The hack simulator skill checks for Playwright
availability at runtime. It does NOT bundle or install Playwright.

**Flow**:
1. Skill runs `npx playwright --version` via Bash tool
2. If found, checks browser binaries are installed
3. If browsers missing, prompts user to run `npx playwright install chromium`
4. If Playwright not found, prompts installation and falls back
5. Browser tests use Playwright for navigation,
   DOM interaction, network interception, and screenshot capture

### D9: Config Schema

```json
{
  "language": "en",
  "version": "1.0.0"
}
```

Minimal config. Attack intensity is per-run, not persisted.
Project type is auto-detected, not configured.
