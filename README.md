# VulChk

Security analysis toolkit for [Claude Code](https://claude.ai/claude-code). Provides code vulnerability inspection and simulated penetration testing via slash commands.

## Installation

```bash
npm install -g vulchk
```

## Quick Start

```bash
# Initialize VulChk in your project
cd your-project
vulchk init
```

The interactive setup wizard will ask you to select a report language (English, Korean, Japanese, or Chinese). This creates `.vulchk/config.json` and installs Claude Code slash commands.

## Slash Commands

After running `vulchk init`, these commands are available in Claude Code:

### `/vulchk.codeinspector`

Comprehensive static security analysis of your codebase:

- **Dependency CVE audit** — Looks up known vulnerabilities for your dependencies
- **OWASP Top 10 scan** — Detects SQL injection, XSS, CSRF, and other code patterns
- **Secrets scanner** — Checks .gitignore coverage and finds hardcoded credentials
- **Git history audit** — Searches commit history for accidentally committed secrets
- **Container security** — Analyzes Dockerfiles and Kubernetes manifests

Specialized analysis for Node.js, React/Next.js (including Vercel), and FastAPI projects. Generic analysis for all other stacks.

Report saved to `./security-report/codeinspector-{timestamp}.md`.

### `/vulchk.hacksimulator`

Simulated penetration testing against a running web application:

```
/vulchk.hacksimulator                    # Interactive target selection
/vulchk.hacksimulator https://my-app.com # Direct URL targeting
```

Features:
- **3 intensity levels** — Passive (recon only), Active (safe probes), Aggressive (exploitation)
- **Multi-vector testing** — HTTP requests, API probing, browser automation (via ratatosk-cli)
- **Attack plan approval** — Review and approve the test plan before any requests are sent
- **Code inspector integration** — Uses prior code inspection findings to prioritize attacks
- **Authorization checks** — Warns and requires confirmation for external targets

Report saved to `./security-report/hacksimulator-{timestamp}.md`.

## Configuration

`vulchk init` creates `.vulchk/config.json`:

```json
{
  "language": "en",
  "version": "0.1.0"
}
```

| Field | Description |
|-------|-------------|
| `language` | Report language: `en`, `ko`, `ja`, `zh` |
| `version` | VulChk version that initialized the project |

## CLI Options

```bash
vulchk init              # Interactive setup
vulchk init --lang en    # Skip language prompt
vulchk init --force      # Overwrite existing configuration
vulchk --version         # Show version
vulchk --help            # Show help
```

## Reports

Reports are generated as Markdown files in `./security-report/`:

- `codeinspector-{YYYY-MM-DD-HHmmss}.md` — Code inspection results
- `hacksimulator-{YYYY-MM-DD-HHmmss}.md` — Penetration test results

Reports include:
- Executive summary with severity counts
- Detailed findings with evidence, references, and remediation steps
- Security terms (CVE, XSS, CSRF) remain in English regardless of report language
- Sensitive values are always redacted

## Browser Automation

For browser-based penetration testing, install [ratatosk-cli](https://github.com/letsur-dev/huginn):

```bash
npm install -g ratatosk-cli
ratatosk install --skills
```

If ratatosk-cli is not installed, VulChk falls back to HTTP-based testing only.

## Requirements

- Node.js >= 18.0.0
- [Claude Code](https://claude.ai/claude-code) CLI

## License

MIT
