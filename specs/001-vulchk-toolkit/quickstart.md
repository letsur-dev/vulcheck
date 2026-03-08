# Quickstart: VulChk Security Analysis Toolkit

## Installation

```bash
npm install -g vulchk
```

## Project Setup

```bash
cd your-project
vulchk init
```

The interactive wizard asks:
- **Report Language**: en / ko / ja (determines output language)

After init, the following files are created:

```
your-project/
├── .vulchk/
│   └── config.json           # Project configuration
├── .claude/
│   ├── skills/
│   │   ├── vulchk-codeinspector/
│   │   │   └── SKILL.md      # Code inspection skill
│   │   └── vulchk-hacksimulator/
│   │       └── SKILL.md      # Hack simulator skill
│   └── agents/
│       ├── vulchk-dependency-auditor.md
│       ├── vulchk-code-pattern-scanner.md
│       ├── vulchk-secrets-scanner.md
│       ├── vulchk-git-history-auditor.md
│       ├── vulchk-container-security-analyzer.md
│       ├── vulchk-attack-planner.md
│       └── vulchk-attack-executor.md
└── ...
```

## Usage

### Code Inspection

Open Claude Code in your project and run:

```
/vulchk.codeinspector
```

The tool will:
1. Detect your tech stack (frameworks, dependencies, databases)
2. Display the analysis plan
3. Run parallel sub-agents for CVE lookup, code scanning,
   secrets detection, git history audit, container security
4. Generate a report at `./security-report/codeinspector-{timestamp}.md`

### Penetration Testing

```
/vulchk.hacksimulator https://your-app.com
```

Or without a URL:

```
/vulchk.hacksimulator
```

The tool will:
1. Ask for scan intensity (passive / active / aggressive)
2. Reference prior codeinspector reports if available
3. Present an attack plan for your approval
4. Execute approved tests via browser (Playwright) and HTTP
5. Generate a report at `./security-report/hacksimulator-{timestamp}.md`

### Browser Testing (requires Playwright)

If Playwright is not installed, the hack simulator will prompt:

```
Playwright is required for browser-based analysis but was not found.
Please install Playwright:

  npm install playwright
  npx playwright install chromium
```

Without Playwright, testing falls back to HTTP-only methods.

## Report Location

All reports are saved to `./security-report/` in your project root:

```
security-report/
├── codeinspector-2026-03-01-143022.md
├── hacksimulator-2026-03-01-150512.md
└── ...
```

## Configuration

`.vulchk/config.json`:

```json
{
  "language": "en",
  "version": "1.0.0"
}
```

- `language`: Report output language (en/ko/ja)
- `version`: VulChk version that initialized this project
