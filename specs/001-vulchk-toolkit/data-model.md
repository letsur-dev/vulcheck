# Data Model: VulChk Security Analysis Toolkit

## Entities

### Config (`.vulchk/config.json`)

```json
{
  "language": "en | ko | ja",
  "version": "string (vulchk version that initialized)"
}
```

Stored at project root under `.vulchk/config.json`. Read by skills
at runtime to determine report language.

### Skill File (`.claude/skills/<name>/SKILL.md`)

```yaml
---
name: vulchk-codeinspector | vulchk-hacksimulator
description: "Trigger description for Claude Code routing"
allowed-tools: [Bash, Read, Grep, Glob, WebSearch, WebFetch, Task]
---

# Skill body (Markdown instructions)
```

Two skill files deployed to the target project by `vulchk init`.

### Agent File (`.claude/agents/<name>.md`)

```yaml
---
name: "agent-name"
description: "When to use this agent"
model: sonnet
tools:
  - search
  - edit
---

Agent instructions (Markdown body)
```

Seven agent files deployed to the target project by `vulchk init`.

### Security Report (`./security-report/<name>.md`)

Generated at runtime by skills. Not a static artifact.

**Code Inspector Report Structure**:

```markdown
# Code Security Inspection Report
**Date**: YYYY-MM-DD HH:mm:ss
**Project**: <detected project name>
**Tech Stack**: <detected stack>

## Executive Summary
<high-level findings overview, total counts by severity>

## Findings Summary
| # | Severity | Category | Location | Description |
|---|----------|----------|----------|-------------|
| 1 | Critical | CVE      | package.json | ... |

## Detailed Findings

### Finding 1: <title>
- **Severity**: Critical | High | Medium | Low | Informational
- **Category**: CVE | OWASP | Secrets | Config | Container
- **Location**: file:line
- **Evidence**: <code snippet or proof>
- **References**: CVE-XXXX-XXXXX, CWE-XXX, OWASP A0X
- **Remediation**: <actionable fix steps>

## Analysis Coverage
<list of checks performed and their results>
```

**Hack Simulator Report Structure**:

```markdown
# Penetration Test Report
**Date**: YYYY-MM-DD HH:mm:ss
**Target**: <URL>
**Intensity**: passive | active | aggressive

## Executive Summary

## Attack Plan
<approved plan summary>

## Findings Summary
| # | Severity | Vector | Endpoint | Description |

## Detailed Findings
### Finding 1: <title>
- **Severity**: ...
- **Vector**: browser | http-fetch | api-probe
- **Endpoint**: <URL/path>
- **Request**: <payload sent>
- **Response**: <relevant response data>
- **Evidence**: <screenshot path or response snippet>
- **References**: CWE-XXX, OWASP A0X
- **Remediation**: ...

## Attack Log
| # | Timestamp | Vector | Endpoint | Payload | Status |
|---|-----------|--------|----------|---------|--------|

## Coverage Notes
<what was tested, what was skipped and why>
```

### Attack Plan (in-memory, displayed to user)

```markdown
## Attack Plan for <target>
**Intensity**: <selected level>
**Based on**: codeinspector report (if available)

### Phase 1: Reconnaissance
- [ ] Technology fingerprinting
- [ ] Directory enumeration
- [ ] SSL/TLS configuration check

### Phase 2: Vulnerability Probing
- [ ] XSS injection points
- [ ] SQL injection points
- [ ] Authentication bypass attempts
...

### Phase 3: Exploitation (aggressive only)
- [ ] Chained exploit attempts
- [ ] Session manipulation
...

Approve this plan? (Y/n)
```

## Entity Relationships

```
vulchk CLI
  │
  ├── vulchk init ──→ .vulchk/config.json
  │                ──→ .claude/skills/vulchk-codeinspector/SKILL.md
  │                ──→ .claude/skills/vulchk-hacksimulator/SKILL.md
  │                ──→ .claude/agents/vulchk-*.md (7 agents)
  │
  └── (no other CLI commands)

/vulchk.codeinspector (skill)
  │
  ├── reads ──→ .vulchk/config.json (language)
  ├── spawns ──→ vulchk-dependency-auditor (agent)
  ├── spawns ──→ vulchk-code-pattern-scanner (agent)
  ├── spawns ──→ vulchk-secrets-scanner (agent)
  ├── spawns ──→ vulchk-git-history-auditor (agent)
  ├── spawns ──→ vulchk-container-security-analyzer (agent)
  └── writes ──→ ./security-report/codeinspector-{timestamp}.md

/vulchk.hacksimulator (skill)
  │
  ├── reads ──→ .vulchk/config.json (language)
  ├── reads ──→ ./security-report/codeinspector-*.md (if exists)
  ├── checks ──→ Playwright availability
  ├── spawns ──→ vulchk-attack-planner (agent)
  ├── spawns ──→ vulchk-attack-executor (agent)
  └── writes ──→ ./security-report/hacksimulator-{timestamp}.md
```
