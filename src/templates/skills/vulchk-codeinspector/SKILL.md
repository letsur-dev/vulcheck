---
name: vulchk-codeinspector
description: "Run comprehensive code security analysis. Use when the user wants to scan their codebase for vulnerabilities, check dependencies for CVEs, audit git history for leaked secrets, or review container security. Triggers: /vulchk.codeinspector, 'scan code for vulnerabilities', 'security audit', 'check for CVEs'."
allowed-tools: [Bash, Read, Grep, Glob, WebSearch, WebFetch, Task]
---

# VulChk Code Inspector

<!-- Phase 2 will replace this placeholder with full analysis instructions -->

This skill performs comprehensive static security analysis of the current project.

## Capabilities (to be implemented)

- Technology stack detection
- Dependency CVE lookup
- OWASP Top 10 code pattern scanning
- Secrets exposure checks (.gitignore, env files)
- Git history audit for leaked credentials
- Container security analysis (Dockerfile, K8s manifests)
- Specialized rules for Node.js, React/Next.js, FastAPI
- Vercel deployment security checks for Next.js projects
- Co-located frontend + backend interaction analysis

## Output

Report written to `./security-report/codeinspector-{timestamp}.md`
