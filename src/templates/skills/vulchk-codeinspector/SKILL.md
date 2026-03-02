---
name: vulchk-codeinspector
description: "Run comprehensive code security analysis. Use when the user wants to scan their codebase for vulnerabilities, check dependencies for CVEs, audit git history for leaked secrets, or review container security. Triggers: /vulchk.codeinspector, 'scan code for vulnerabilities', 'security audit', 'check for CVEs'."
allowed-tools: [Bash, Read, Grep, Glob, WebSearch, WebFetch, Agent]
---

# VulChk Code Inspector

You are performing a comprehensive static security analysis of the current project.
Follow this process exactly. Use sub-agents (Agent tool) for parallel analysis.

The report is a **single file** at `./security-report/codeinspector.md`.
Running this command again performs an **incremental update** based on
the git diff since the last analysis, rather than a full re-scan.

## Step 0: Read Configuration

Read `.vulchk/config.json` to determine the report language and deployment environment.
If the file does not exist, default to English and `other` deployment, and warn the user to run `vulchk init`.

Extract:
- `language` — report language (en, ko)
- `deployment` — deployment environment (vercel, k8s, docker, or custom string)

The deployment environment is used throughout the analysis to adjust severity levels
and skip irrelevant checks (e.g., Dockerfile checks are irrelevant for Vercel-only projects).

## Step 1: Git Status Check & Mode Detection

### 1a. Check for uncommitted changes

```bash
git status --porcelain 2>/dev/null
```

If the output is NOT empty (uncommitted changes exist), display:

```
## Uncommitted Changes Detected

There are uncommitted changes in the working directory.
Code Inspector requires a clean git state to track analysis accurately.

Please commit your changes first, then run `/vulchk.codeinspector` again.
```

**STOP execution.** Do not proceed until the working tree is clean.

### 1b. Get current commit info

```bash
git rev-parse --short HEAD
git log -1 --format="%H|%h|%ci|%s"
```

Store the full hash, short hash, date, and subject.

### 1c. Check for existing report

```bash
head -10 ./security-report/codeinspector.md 2>/dev/null
```

Look for the `**Base Commit**:` line in the existing report to extract
the previous commit hash.

### 1d. Determine analysis mode

```
IF no existing report exists:
  → MODE = FULL_SCAN

ELSE IF existing report exists:
  Extract previous_commit from report header
  IF previous_commit == current_commit:
    → Display: "No new commits since last analysis. Report is up to date."
    → STOP (nothing to do)
  ELSE:
    → MODE = INCREMENTAL
    → Store previous_commit for diff
```

Display the selected mode to the user:

```
## Analysis Mode: {Full Scan | Incremental Update}

**Current commit**: {short_hash} — {subject}
{If INCREMENTAL}: **Previous analysis**: {previous_short_hash}
{If INCREMENTAL}: **Commits since last scan**: {count}
```

## Step 2: Detect Technology Stack

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

**Optimization**: Combine multiple Glob patterns into parallel calls in a single message to minimize round-trips.

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

## Step 3: Determine Scan Scope

### If MODE = FULL_SCAN

All sub-agents scan the entire project. Proceed to Step 4 with full scope.

### If MODE = INCREMENTAL

Get the list of changed files and their diff:

```bash
# Files changed between previous analysis and current HEAD
git diff --name-only {previous_commit}..HEAD

# Full diff for context
git diff --stat {previous_commit}..HEAD

# New commits since last analysis
git log --oneline {previous_commit}..HEAD
```

Categorize the changed files to determine which agents need to re-run:

| Changed File Pattern | Agent to Re-run |
|---------------------|----------------|
| `package.json`, `package-lock.json`, `yarn.lock`, `requirements.txt`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `Gemfile`, `composer.json` or their lock files | vulchk-dependency-auditor |
| `*.js`, `*.ts`, `*.jsx`, `*.tsx`, `*.py`, `*.go`, `*.rs`, `*.java`, `*.rb`, `*.php` (source code) | vulchk-code-pattern-scanner |
| `.gitignore`, `.env*`, `*.pem`, `*.key`, `credentials*`, source files with potential secrets | vulchk-secrets-scanner |
| (always re-run for new commits) | vulchk-git-history-auditor |
| `Dockerfile*`, `docker-compose*`, `k8s/**`, `kubernetes/**`, `manifests/**`, `*.yaml` in deploy dirs | vulchk-container-security-analyzer |

**Finding related files**: For each changed source file, also include:

```bash
# Files that import the changed file
grep -rl "import.*{changed_file_name}" --include="*.js" --include="*.ts" --include="*.py" .

# Files that the changed file imports
grep -E "^import |^from |require\(" {changed_file} | head -20
```

Include these related files in the scan scope. This ensures that a change
in a utility function triggers re-analysis of all files that use it.

**Reading existing report**: Read the full existing report at
`./security-report/codeinspector.md`. Parse:
- All existing findings (number, severity, location, description)
- Analysis coverage table
- Recommendations section

Findings for **unchanged files** will be preserved as-is.
Findings for **changed or related files** will be removed and re-scanned.

## Step 4: Launch Sub-Agents

Launch the following sub-agents using the Agent tool. All agents that apply
should be launched **IN PARALLEL** (multiple Agent calls in a single message).

### Execution Strategy

| Agent | Model | Parallel | Reason |
|-------|-------|----------|--------|
| vulchk-dependency-auditor | sonnet | Yes | API parsing requires moderate reasoning |
| vulchk-code-pattern-scanner | sonnet | Yes | Taint analysis requires deep code reasoning |
| vulchk-secrets-scanner | sonnet | Yes | Tool usage requires moderate reasoning |
| vulchk-git-history-auditor | sonnet | Yes | Reliable git command execution requires reasoning |
| vulchk-container-security-analyzer | sonnet | Yes | CI/CD analysis requires judgment |

**All 5 agents are independent — launch them all in a single message.**
Do NOT wait for one to finish before launching the next.

### FULL_SCAN Mode Prompts

#### Agent 1: Dependency Auditor

```
Launch agent: vulchk-dependency-auditor
Prompt: "Audit all dependencies in this project for known CVEs.
Scan these manifest files: {list detected manifests}.
The project uses: {detected stack}.
For each vulnerability, include the manifest file path and the LINE NUMBER
where the vulnerable dependency is declared.
Return findings in the format specified in your instructions."
```

#### Agent 2: Code Pattern Scanner

```
Launch agent: vulchk-code-pattern-scanner
Prompt: "Scan the source code for OWASP Top 10 vulnerability patterns.
The project uses: {detected stack}.
{If Next.js}: Include Next.js/Vercel-specific checks.
{If FastAPI}: Include FastAPI-specific checks.
{If Express}: Include Express-specific checks.
{If frontend+backend}: Check interaction points (CORS, auth tokens, API contracts).
IMPORTANT: For every finding, include the EXACT file path and line number
in the format file_path:line_number.
Return findings in the format specified in your instructions."
```

#### Agent 3: Secrets Scanner

```
Launch agent: vulchk-secrets-scanner
Prompt: "Check for secrets exposure risks in this project.
Verify .gitignore coverage, scan for hardcoded credentials, check for
exposed API keys and tokens.
{If web project}: Check for frontend exposure of server-side secrets.
IMPORTANT: For every finding, include the EXACT file path and line number.
Return findings in the format specified in your instructions."
```

#### Agent 4: Git History Auditor

```
Launch agent: vulchk-git-history-auditor
Prompt: "Audit the git history for accidentally committed secrets.
Search all commits for API keys, passwords, tokens, and private keys.
Check if .env files were ever committed.
Return findings in the format specified in your instructions."
```

#### Agent 5: Container Security Analyzer (if applicable)

Only launch if Dockerfile, docker-compose, or K8s manifests were detected:

```
Launch agent: vulchk-container-security-analyzer
Prompt: "Analyze container configuration for security issues.
Found files: {list of Dockerfile/compose/k8s files}.
Deployment environment: {deployment from config}.
{If Vercel}: Also check vercel.json for security configuration.
IMPORTANT: For every finding, include the EXACT file path and line number.
Return findings in the format specified in your instructions."
```

### INCREMENTAL Mode Prompts

Only launch agents whose relevant files have changed (see Step 3 table).
Add the following context to each agent prompt:

```
"INCREMENTAL SCAN: Only analyze the following files and their related imports:
Changed files: {list of changed files}
Related files: {list of files that import/are imported by changed files}

Focus your analysis on these files. Do NOT scan files outside this scope.
For each vulnerability, include the EXACT file path and line number."
```

For the git-history-auditor in incremental mode:
```
"Only search commits between {previous_commit} and HEAD.
Do NOT re-scan older commits."
```

## Step 5: Collect and Merge Results

Wait for all sub-agents to complete. Collect their outputs.

### Agent Result Validation

After collecting results, check each agent's response:
- If an agent returned empty/minimal output (< 100 characters) or shows signs of failure, **re-launch that specific agent once** with the same parameters.
- Log the retry in the Analysis Coverage section.

### Result Format Validation

Before proceeding to adversarial verification, check each agent's output for required fields:
- Correct ID prefix (CODE-, SEC-, GIT-, DEP-, CTR-)
- Severity level present
- Location with file path
- Practical Risk assessment
- CWE/CVE reference

If any finding is missing required fields, note it in the Analysis Coverage section as "incomplete format" rather than discarding the finding.

### Step 5b: Adversarial Verification (FP Filtering)

After merging findings from **all agents** (CODE, SEC, GIT, CTR prefixed findings),
perform a secondary verification pass using a Sonnet model.
Each agent provides an initial `Practical Risk` assessment in its findings.
This step **validates and adjusts** those assessments based on cross-agent context
and deeper exploitability analysis.

For each finding (or groups of findings):

1.  **Read the source code** mentioned in the finding.
2.  **Evaluate exploitability**: Is there a real-world path for an attacker?
3.  **Check for mitigations**: Are there undocumented sanitizers or infra-level protections (e.g., WAF, internal-only access)?
4.  **Cross-reference agents**: e.g., a SEC finding of a hardcoded key gains urgency if GIT shows the same key was committed historically and never rotated.
5.  **Assign Confidence**:
    *   **90-100%**: Confirmed exploitable.
    *   **60-89%**: Theoretically possible but difficult to exploit.
    *   **<60%**: Likely a False Positive.
6.  **Re-classify**:
    *   If <60% confidence → **Remove** from report.
    *   If 60-89% confidence → Keep but mark **Practical Risk: Low/Theoretical**.
    *   Update the `Practical Risk` explanation based on this verification.

### Deployment-Aware Severity Adjustments

After adversarial verification, apply these adjustments based on the `deployment` field from config:

| Finding | Vercel | K8s / Docker | Other |
|---------|--------|-------------|-------|
| Mutable Docker base image tags (`:latest`, `:main`) | N/A (skip) | **Informational** — dev-ops concern, not direct security risk | **Informational** |
| Missing Dockerfile `USER` directive (root execution) | N/A (skip — Vercel manages runtime) | **High** — include ownership verification in Fix Prompt | Keep original severity |
| Missing resource limits (CPU/memory) | N/A (skip — Vercel manages resources) | **Medium** — K8s pod spec concern | Keep original severity |
| Missing `.dockerignore` | N/A (skip) | Keep original severity | Keep original severity |
| Logging insufficiency (CWE-778) | **Informational** | **Informational** | **Informational** |

**N/A (skip)** means the finding should be removed entirely — it is irrelevant for that deployment environment.

## Step 6: Generate Report

...

### Report Structure

Translate all section headers using the language reference above.

**Required sections** (in order):

1. **Header**: Title, Last Updated, Project, Tech Stack, Base Commit (`{short_hash}` — {subject}), Analysis Mode, VulChk Version
2. **{Executive Summary}**: Finding counts by severity + 2-3 sentence summary
3. **{Quick Fix List}**: Table — `| # | {Severity} | {Location} | {Description} |` sorted by severity. Location uses `file:line` format. The `#` column MUST be a Markdown anchor link to the corresponding detailed finding section (e.g., `[1](#code-001-sql-injection)`).
4. **{Detailed Findings}**: For each finding:
   - Severity, Category, Location (`file:line`)
   - **Practical Risk**: {High | Medium | Low | Theoretical} — {Explanation}
   - **Confidence**: {High (90-100%) | Medium (60-89%) | Low (<60%)} — based on direct code verification
   - Evidence (code snippet with line numbers)
   - References (CVE/CWE/OWASP) — with hyperlinks (see Reference Hyperlink Rules below)
   - Remediation (fix steps + corrected code)
   - A `[↑ Back to Quick Fix List](#quick-fix-list)` link at the end of each finding (use the localized heading anchor if report language is not English)
   - **🤖 Fix Prompt** (required for Severity >= Medium):
     ```markdown
     > Copy and paste this to your AI coding agent:
     ```prompt.md
     Fix the following security issue in `{file_path}`:
     - **Issue**: {finding_title}
     - **Severity**: {severity}
     - **Location**: Line {line_number}
     - **Description**: {description}
     - **Remediation**: {remediation_steps}
     - **Context**:
     ```
     {evidence}
     ```
     Apply the fix while preserving the existing logic.
     ```
     ```

### Fix Prompt Generation Rules
- **Required**: All findings with Severity >= Medium MUST include a Fix Prompt
- **Optional**: Low and Informational findings MAY include a Fix Prompt if the fix is straightforward
- **Format**: Each Fix Prompt must include Issue, Severity, Location, Description, Remediation code, and Context (surrounding code snippet)

### Reference Hyperlink Rules

All references in findings MUST include clickable hyperlinks:

| Reference Type | URL Pattern | Example |
|---------------|------------|---------|
| CVE | `https://nvd.nist.gov/vuln/detail/{CVE-ID}` | [CVE-2024-43796](https://nvd.nist.gov/vuln/detail/CVE-2024-43796) |
| CWE | `https://cwe.mitre.org/data/definitions/{NUM}.html` | [CWE-79](https://cwe.mitre.org/data/definitions/79.html) |
| GHSA | `https://github.com/advisories/{GHSA-ID}` | [GHSA-qw6h-vgh9-j6wx](https://github.com/advisories/GHSA-qw6h-vgh9-j6wx) |
| OSV | `https://osv.dev/vulnerability/{OSV-ID}` | [GHSA-xxx](https://osv.dev/vulnerability/GHSA-xxx) |
| OWASP | `https://owasp.org/Top10/A{NN}_2021-{name}/` | [OWASP A03:2021](https://owasp.org/Top10/A03_2021-Injection/) |

For dependency findings (DEP-), include the advisory URL from the OSV API `references` array if available.

5. **{Analysis Coverage}**: Table — `| {Check} | {Status} | {Files Scanned} | {Findings} |` for each agent. If INCREMENTAL: add `{Changed Files in This Update}` list.
6. **{Recommendations}**: Top 3-5 prioritized recommendations

Create the directory if it does not exist:

```bash
mkdir -p ./security-report
```

Get the current timestamp:
```bash
date +"%Y-%m-%d %H:%M:%S"
```

Write (or overwrite) the single report file at `./security-report/codeinspector.md`.

### Report Language Reference

Read the `language` field from `.vulchk/config.json`.
Write the **entire report** in the specified language.
All internal processing is in English — only the final report output uses the configured language.

Supported languages: English (en), Korean (ko)

Security terms (CVE, XSS, CSRF, OWASP, CWE, SQLi, SSRF, IDOR) MUST
remain in English regardless of the selected language.

### Severity Labels

Use these severity labels in all languages. The English label always appears first:
- Critical (치명적)
- High (높음)
- Medium (중간)
- Low (낮음)
- Informational (정보)

### Report Structure

Translate all section headers using the language reference above.

**Required sections** (in order):

1. **Header**: Title, Last Updated, Project, Tech Stack, Base Commit (`{short_hash}` — {subject}), Analysis Mode, VulChk Version
2. **{Executive Summary}**: Finding counts by severity + 2-3 sentence summary
3. **{Quick Fix List}**: Table — `| # | {Severity} | {Location} | {Description} |` sorted by severity. Location uses `file:line` format.
4. **{Detailed Findings}**: For each finding: Severity, Category (CVE/OWASP/Secrets/Git/Container), Location (`file:line`), Evidence (code snippet with line numbers), References (CVE/CWE/OWASP), Remediation (fix steps + corrected code)
5. **{Analysis Coverage}**: Table — `| {Check} | {Status} | {Files Scanned} | {Findings} |` for each agent. If INCREMENTAL: add `{Changed Files in This Update}` list.
6. **{Recommendations}**: Top 3-5 prioritized recommendations

Footer: `*{Generated by VulChk Code Inspector}*`

### Location Format Rules

Every finding MUST include a precise location to enable quick code navigation:

| Finding Type | Location Format | Example |
|---|---|---|
| Dependency CVE | `{manifest}:{line}` where the dependency is declared | `package.json:8` |
| OWASP code pattern | `{source_file}:{line}` of the vulnerable code | `src/api/users.js:42` |
| Secrets in code | `{source_file}:{line}` of the hardcoded secret | `src/config.js:15` |
| Missing .gitignore entry | `.gitignore` (no line number) | `.gitignore` |
| Git history leak | `{commit_hash}:{file_path}` | `a1b2c3d:src/config.js` |
| Container issue | `{config_file}:{line}` | `Dockerfile:3` |

If a line number cannot be determined (e.g., missing .gitignore entries),
omit it — but ALWAYS include the file path.

## Step 7: Present Summary to User

After writing the report, display a summary:

```
## Code Inspection Complete

Report saved to: ./security-report/codeinspector.md
Analysis mode: {Full Scan | Incremental Update}
Base commit: {short_hash}

### Summary
- Critical: {count}
- High: {count}
- Medium: {count}
- Low: {count}
- Informational: {count}

### Top Priority Items
1. `{file:line}` — {most critical finding title}
2. `{file:line}` — {second most critical finding title}
3. `{file:line}` — {third most critical finding title}

{If INCREMENTAL}: ### Changes in This Update
{If INCREMENTAL}: - New findings: {count}
{If INCREMENTAL}: - Resolved findings: {count}
{If INCREMENTAL}: - Files re-analyzed: {count}

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
- ALWAYS check for uncommitted changes before scanning — require clean git state
- The report is a SINGLE FILE that gets updated, not multiple timestamped files
- In incremental mode, preserve findings for unchanged files — only re-scan
  changed files and their imports/dependents
- Every finding MUST include file path and line number where applicable
