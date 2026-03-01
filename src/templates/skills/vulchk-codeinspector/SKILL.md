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

### Report Language Reference

Read the `language` field from `.vulchk/config.json`. Use the matching
column below for ALL report section headers, labels, and descriptions.
Security terms (CVE, XSS, CSRF, OWASP, CWE, SQLi, SSRF, IDOR) MUST
remain in English in ALL languages.

| English (en) | Korean (ko) | Japanese (ja) |
|---|---|---|
| Code Security Inspection Report | 코드 보안 점검 리포트 | コードセキュリティ検査レポート |
| Date | 날짜 | 日付 |
| Project | 프로젝트 | プロジェクト |
| Tech Stack | 기술 스택 | 技術スタック |
| Executive Summary | 요약 | エグゼクティブサマリー |
| security findings identified | 건의 보안 취약점이 발견되었습니다 | 件のセキュリティ問題が検出されました |
| Immediate action required | 즉시 조치 필요 | 即時対応が必要 |
| Address in next sprint | 다음 스프린트에서 해결 | 次のスプリントで対応 |
| Plan remediation | 개선 계획 수립 필요 | 改善計画の策定が必要 |
| Consider addressing | 검토 후 대응 | 対応を検討 |
| For awareness | 참고 사항 | 参考情報 |
| Findings Summary | 발견 사항 요약 | 検出事項サマリー |
| Severity | 심각도 | 深刻度 |
| Category | 분류 | カテゴリ |
| Location | 위치 | 位置 |
| Description | 설명 | 説明 |
| Detailed Findings | 상세 발견 사항 | 詳細な検出事項 |
| Evidence | 증거 | 証拠 |
| References | 참조 | 参照 |
| Remediation | 개선 방안 | 改善方法 |
| Analysis Coverage | 분석 범위 | 分析カバレッジ |
| Check | 검사 항목 | 検査項目 |
| Status | 상태 | ステータス |
| Files Scanned | 스캔된 파일 수 | スキャンファイル数 |
| Findings | 발견 수 | 検出数 |
| Dependency CVE Audit | 의존성 CVE 감사 | 依存関係CVE監査 |
| OWASP Code Patterns | OWASP 코드 패턴 | OWASPコードパターン |
| Secrets Exposure | 시크릿 노출 검사 | シークレット露出検査 |
| Git History Audit | Git 히스토리 감사 | Git履歴監査 |
| Container Security | 컨테이너 보안 | コンテナセキュリティ |
| Recommendations | 권장 사항 | 推奨事項 |
| Generated by VulChk Code Inspector | VulChk Code Inspector에 의해 생성됨 | VulChk Code Inspectorにより生成 |

### Severity Labels by Language

| en | ko | ja |
|---|---|---|
| Critical | Critical (치명적) | Critical (致命的) |
| High | High (높음) | High (高) |
| Medium | Medium (중간) | Medium (中) |
| Low | Low (낮음) | Low (低) |
| Informational | Informational (정보) | Informational (情報) |

### Report Structure

Use the language reference above to translate all section headers and
labels. The template below shows the English structure — replace each
heading and label with the corresponding translation from the table.

```markdown
# {Code Security Inspection Report}

**{Date}**: {YYYY-MM-DD HH:mm:ss}
**{Project}**: {project name from directory or package.json}
**{Tech Stack}**: {detected stack summary}
**VulChk Version**: {from .vulchk/config.json}

## {Executive Summary}

{total_findings} {security findings identified}:
- **Critical**: {count} — {Immediate action required}
- **High**: {count} — {Address in next sprint}
- **Medium**: {count} — {Plan remediation}
- **Low**: {count} — {Consider addressing}
- **Informational**: {count} — {For awareness}

{2-3 sentence summary of the most important findings, in report language}

## {Findings Summary}

| # | {Severity} | {Category} | {Location} | {Description} |
|---|----------|----------|----------|-------------|
{one row per finding, sorted by severity}

## {Detailed Findings}

{For each finding, include the full detail block from the sub-agent output:
- {Severity}
- {Category} (CVE / OWASP / Secrets / Git History / Container)
- {Location} (file:line)
- {Evidence} (code snippet or proof)
- {References} (CVE-ID, CWE-ID, OWASP category)
- {Remediation} (actionable fix steps, in report language)
}

## {Analysis Coverage}

| {Check} | {Status} | {Files Scanned} | {Findings} |
|-------|--------|---------------|----------|
| {Dependency CVE Audit} | {DONE/SKIPPED} | {count} | {count} |
| {OWASP Code Patterns} | {DONE/SKIPPED} | {count} | {count} |
| {Secrets Exposure} | {DONE/SKIPPED} | {count} | {count} |
| {Git History Audit} | {DONE/SKIPPED} | {count} | {count} |
| {Container Security} | {DONE/SKIPPED} | {count} | {count} |

## {Recommendations}

{Top 3-5 prioritized recommendations based on findings, in report language}

---
*{Generated by VulChk Code Inspector}*
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

## Redaction Rules

ALL sensitive values MUST be redacted before writing to the report.
Never display full secrets in any output — redact to show only the
first 4 and last 4 characters with `****` in between.

### Redaction Patterns

| Type | Example Raw | Redacted |
|---|---|---|
| API Key | `sk-abc123def456ghi789xyz` | `sk-a****...****9xyz` |
| AWS Key | `AKIAIOSFODNN7EXAMPLE` | `AKIA****...****MPLE` |
| Password | `MyS3cretP@ssw0rd!` | `MyS3****...****0rd!` |
| Token | `ghp_1234567890abcdef1234567890abcdef12345678` | `ghp_****...****5678` |
| Private Key | `-----BEGIN RSA PRIVATE KEY-----\nMIIE...` | `[PRIVATE KEY REDACTED]` |
| Connection String | `postgres://user:pass@host/db` | `postgres://user:****@host/db` |
| JWT | `eyJhbG...payload...signature` | `eyJh****...****ture` |

### Redaction Application Rules

- Apply redaction in ALL output: report file, user summary, evidence snippets
- For values shorter than 8 characters, show only first 2 and last 2
- For private keys and certificates, replace entirely with `[PRIVATE KEY REDACTED]`
- For connection strings, redact only the password portion
- NEVER redact file paths, line numbers, CVE IDs, or CWE references
- Test fixture values (e.g., `password = "test"`) may be shown unredacted
  with a note that they are test values

## Important Rules

- ALL sub-agents MUST be launched in parallel where possible
- If a sub-agent fails or times out, note it in the report coverage
  table and continue with other results
- Do not halt on any single check failure — always produce a report
- The analysis plan is displayed but does NOT require user approval
  (code inspection is non-destructive)
- If no vulnerabilities are found, still produce a report noting the
  clean result and which checks were performed
