---
name: vulchk-codeinspector
description: "Run comprehensive code security analysis. Use when the user wants to scan their codebase for vulnerabilities, check dependencies for CVEs, audit git history for leaked secrets, or review container security. Triggers: /vulchk.codeinspector, 'scan code for vulnerabilities', 'security audit', 'check for CVEs'."
allowed-tools: [Bash, Read, Grep, Glob, WebSearch, WebFetch, Task]
---

# VulChk Code Inspector

You are performing a comprehensive static security analysis of the current project.
Follow this process exactly. Use sub-agents (Task tool) for parallel analysis.

## Step 0: Read Configuration

Read `.vulchk/config.json` to determine the report language setting.
If the file does not exist, default to English and warn the user to run `vulchk init`.

## Step 1: Detect Technology Stack

Scan the project root to identify the technology stack. Use Glob to check for:

| File | Indicates |
|------|-----------|
| `package.json` | Node.js — read to detect Express, Fastify, Next.js, React |
| `next.config.*` | Next.js (check for Vercel deployment indicators) |
| `requirements.txt`, `pyproject.toml`, `Pipfile` | Python — check for FastAPI, Django, Flask |
| `go.mod` | Go |
| `Cargo.toml` | Rust |
| `Dockerfile`, `docker-compose.yml` | Container deployment |
| `k8s/`, `kubernetes/`, `manifests/`, `deploy/`, `charts/` | Kubernetes |
| `vercel.json`, `.vercel/` | Vercel deployment |

Read key config files to extract framework names and dependency versions.
Identify if the project has both frontend and backend co-located.

Display the detected stack to the user:

```
## Analysis Plan

**Detected Stack**:
- Language: {language} {version}
- Framework: {framework}
- Database: {database or "none detected"}
- Container: {Docker/K8s or "none detected"}
- Deployment: {Vercel or "none detected"}

**Checks to perform**:
1. Dependency CVE audit
2. OWASP Top 10 code pattern scan
3. Secrets and .gitignore verification
4. Git history audit for leaked secrets
5. Container security analysis (if applicable)
6. Framework-specific checks ({framework})

Proceeding with analysis...
```

## Step 2: Launch Parallel Sub-Agents

Launch the following sub-agents using the Task tool. All agents that apply
should be launched IN PARALLEL (multiple Task calls in one message).

### Agent 1: Dependency Auditor

```
Launch agent: vulchk-dependency-auditor
Prompt: "Audit all dependencies in this project for known CVEs.
Scan these manifest files: {list detected manifests}.
The project uses: {detected stack}.
Return findings in the format specified in your instructions."
```

### Agent 2: Code Pattern Scanner

```
Launch agent: vulchk-code-pattern-scanner
Prompt: "Scan the source code for OWASP Top 10 vulnerability patterns.
The project uses: {detected stack}.
{If Next.js}: Include Next.js/Vercel-specific checks.
{If FastAPI}: Include FastAPI-specific checks.
{If Express}: Include Express-specific checks.
{If frontend+backend}: Check interaction points (CORS, auth tokens, API contracts).
Return findings in the format specified in your instructions."
```

### Agent 3: Secrets Scanner

```
Launch agent: vulchk-secrets-scanner
Prompt: "Check for secrets exposure risks in this project.
Verify .gitignore coverage, scan for hardcoded credentials, check for
exposed API keys and tokens.
{If web project}: Check for frontend exposure of server-side secrets.
Return findings in the format specified in your instructions."
```

### Agent 4: Git History Auditor

```
Launch agent: vulchk-git-history-auditor
Prompt: "Audit the git history for accidentally committed secrets.
Search all commits for API keys, passwords, tokens, and private keys.
Check if .env files were ever committed.
Return findings in the format specified in your instructions."
```

### Agent 5: Container Security Analyzer (if applicable)

Only launch if Dockerfile, docker-compose, or K8s manifests were detected:

```
Launch agent: vulchk-container-security-analyzer
Prompt: "Analyze container configuration for security issues.
Found files: {list of Dockerfile/compose/k8s files}.
{If Vercel}: Also check vercel.json for security configuration.
Return findings in the format specified in your instructions."
```

## Step 3: Collect and Merge Results

Wait for all sub-agents to complete. Collect their outputs and:

1. Deduplicate findings (same file+line from multiple agents)
2. Assign sequential finding numbers (1, 2, 3...)
3. Sort by severity (Critical > High > Medium > Low > Informational)
4. Count totals per severity level

## Step 4: Generate Report

Create the directory if it does not exist:

```bash
mkdir -p ./security-report
```

Generate the report file at `./security-report/codeinspector-{YYYY-MM-DD-HHmmss}.md`.
Get the timestamp via Bash: `date +%Y-%m-%d-%H%M%S`

### Report Structure

If report language is `ko`, write section headers and descriptions in Korean.
If report language is `ja`, write in Japanese.
Security terms (CVE, XSS, CSRF, OWASP, CWE) MUST remain in English regardless of language.

```markdown
# Code Security Inspection Report

**Date**: {YYYY-MM-DD HH:mm:ss}
**Project**: {project name from directory or package.json}
**Tech Stack**: {detected stack summary}
**VulChk Version**: {from .vulchk/config.json}

## Executive Summary

{total_findings} security findings identified:
- **Critical**: {count} — Immediate action required
- **High**: {count} — Address in next sprint
- **Medium**: {count} — Plan remediation
- **Low**: {count} — Consider addressing
- **Informational**: {count} — For awareness

{2-3 sentence summary of the most important findings}

## Findings Summary

| # | Severity | Category | Location | Description |
|---|----------|----------|----------|-------------|
{one row per finding, sorted by severity}

## Detailed Findings

{For each finding, include the full detail block from the sub-agent output:
- Severity
- Category (CVE / OWASP / Secrets / Git History / Container)
- Location (file:line)
- Evidence (code snippet or proof)
- References (CVE-ID, CWE-ID, OWASP category)
- Remediation (actionable fix steps)
}

## Analysis Coverage

| Check | Status | Files Scanned | Findings |
|-------|--------|---------------|----------|
| Dependency CVE Audit | {DONE/SKIPPED} | {count} | {count} |
| OWASP Code Patterns | {DONE/SKIPPED} | {count} | {count} |
| Secrets Exposure | {DONE/SKIPPED} | {count} | {count} |
| Git History Audit | {DONE/SKIPPED} | {count} | {count} |
| Container Security | {DONE/SKIPPED} | {count} | {count} |

## Recommendations

{Top 3-5 prioritized recommendations based on findings}

---
*Generated by VulChk Code Inspector*
```

## Step 5: Present Summary to User

After writing the report, display a summary:

```
## Code Inspection Complete

Report saved to: ./security-report/codeinspector-{timestamp}.md

### Summary
- Critical: {count}
- High: {count}
- Medium: {count}
- Low: {count}
- Informational: {count}

### Top Priority Items
1. {most critical finding title}
2. {second most critical finding title}
3. {third most critical finding title}

Run `/vulchk.hacksimulator` to test these findings against a live target.
```

## Important Rules

- NEVER print actual secret values in the report — always redact
  (show first 4 and last 4 characters only)
- ALL sub-agents MUST be launched in parallel where possible
- If a sub-agent fails or times out, note it in the report coverage
  table and continue with other results
- Do not halt on any single check failure — always produce a report
- The analysis plan is displayed but does NOT require user approval
  (code inspection is non-destructive)
- If no vulnerabilities are found, still produce a report noting the
  clean result and which checks were performed
