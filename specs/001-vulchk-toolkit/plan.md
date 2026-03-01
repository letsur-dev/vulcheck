# Implementation Plan: VulChk Security Analysis Toolkit

**Branch**: `001-vulchk-toolkit` | **Date**: 2026-03-01 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-vulchk-toolkit/spec.md`

## Summary

VulChk is an npm CLI tool that, upon `vulchk init`, installs Claude
Code skills and agents into a project, enabling two slash commands:
`/vulchk.codeinspector` (static code security analysis) and
`/vulchk.hacksimulator` (simulated penetration testing). The tool
uses sub-agents for parallel analysis, ratatosk-cli for browser
automation, and outputs structured Markdown reports to
`./security-report/`.

## Technical Context

**Language/Version**: Node.js >= 18 (LTS)
**Primary Dependencies**: enquirer (interactive prompts), chalk (terminal colors), fs-extra (file operations), commander (CLI framework)
**Storage**: `.vulchk/config.json` (project config, JSON)
**Testing**: vitest (unit tests for CLI), manual testing for skills
**Target Platform**: macOS, Linux (Claude Code environments)
**Project Type**: CLI tool + Claude Code skills/agents (Markdown)
**Performance Goals**: `vulchk init` < 5s, skill files < 50KB each
**Constraints**: No network calls at init time (templates bundled), no elevated privileges
**Scale/Scope**: 2 skills, 5-7 sub-agents, ~15 template files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| 1. Security-First Design | PASS | Skills sanitize all inputs; reports redact secrets |
| 2. Authorized-Access-Only | PASS | Hack simulator requires user consent per session |
| 3. Modular Skill Architecture | PASS | Two independent skills + shared sub-agents |
| 4. Structured Reporting | PASS | `./security-report/` with severity + remediation |
| 5. Defense-in-Depth Analysis | PASS | Multi-layer analysis, ratatosk-cli for browser |
| 6. Plan-Driven Execution | PASS | codeinspector shows plan auto-proceed; hacksimulator requires approval |
| 7. Minimal Footprint | PASS | Only `./security-report/` and `.vulchk/` written; no external deps at runtime |
| 8. Transparent Methodology | PASS | Skills document all checks; findings cite CVE/CWE/OWASP |

## Project Structure

### Documentation (this feature)

```text
specs/001-vulchk-toolkit/
├── plan.md              # This file
├── research.md          # Technology decisions and rationale
├── data-model.md        # Entity relationships and config schema
├── quickstart.md        # Integration guide
└── tasks.md             # Phase-based implementation tasks
```

### Source Code (repository root)

```text
# CLI Tool (npm package)
src/
├── index.js             # CLI entry point (commander)
├── commands/
│   └── init.js          # vulchk init command (enquirer prompts)
├── templates/
│   ├── skills/
│   │   ├── vulchk-codeinspector/
│   │   │   └── SKILL.md       # Code inspector skill template
│   │   └── vulchk-hacksimulator/
│   │       └── SKILL.md       # Hack simulator skill template
│   ├── agents/
│   │   ├── vulchk-dependency-auditor.md
│   │   ├── vulchk-code-pattern-scanner.md
│   │   ├── vulchk-secrets-scanner.md
│   │   ├── vulchk-git-history-auditor.md
│   │   ├── vulchk-container-security-analyzer.md
│   │   ├── vulchk-attack-planner.md
│   │   └── vulchk-attack-executor.md
│   └── config.json      # Default config template
└── utils/
    └── file-ops.js      # File copy/template utilities

# Package config
package.json
bin/vulchk.js            # Bin entry point (shebang + import)

# Tests
tests/
├── init.test.js
└── templates.test.js
```

**Structure Decision**: Single npm package with bundled templates.
Templates are copied at `vulchk init` time. No network required.

## Complexity Tracking

No constitution violations to justify.
