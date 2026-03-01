---
name: vulchk-hacksimulator
description: "Run simulated penetration testing against a web application. Use when the user wants to test their running application for exploitable vulnerabilities, perform security testing against a URL, or simulate attacks. Triggers: /vulchk.hacksimulator, 'pentest', 'hack simulation', 'penetration test'."
allowed-tools: [Bash, Read, Grep, Glob, WebSearch, WebFetch, Task]
---

# VulChk Hack Simulator

You are performing a simulated penetration test against a target web application.
Follow this process exactly. This skill requires user approval before sending
any requests to the target.

## Step 0: Read Configuration

Read `.vulchk/config.json` to determine the report language setting.
If the file does not exist, default to English and warn the user to run `vulchk init`.

## Step 1: Determine Target

Check if a URL was provided as an argument to this command.

### Case A: URL Provided

Use the provided URL as the target. Verify it is a valid HTTP/HTTPS URL.
Test connectivity:

```bash
curl -sI --max-time 10 "{URL}" | head -5
```

If the target is unreachable:
```
## Target Unreachable

Could not connect to {URL}.

Possible causes:
- The application is not running
- The URL is incorrect
- Network/firewall restrictions

Please verify the target is accessible and try again.
```
Stop execution if unreachable.

### Case B: No URL Provided

Ask the user to choose:

```
## Target Selection

No URL was provided. How would you like to proceed?

1. **Run locally** — I'll detect and start the project, then test against localhost
2. **Enter URL** — Provide the URL of a running application

Which option? (1 or 2)
```

Wait for user response.

**If option 1 (local execution)**:

Detect the start command from project configuration:
- `package.json` → look for `scripts.start` or `scripts.dev`
- `pyproject.toml` → look for `[project.scripts]`
- `docker-compose.yml` → use `docker compose up`

Run the project in background:
```bash
# Example for Node.js
npm run dev &
```

Wait a few seconds, then test against `http://localhost:{port}`.
Use the detected port from the start script (default: 3000 for Next.js, 8000 for FastAPI).

**If option 2 (provide URL)**: Wait for user to provide the URL, then proceed as Case A.

## Step 2: Authorization Warning

If the target is NOT localhost/127.0.0.1:

```
## ⚠ Authorization Required

Target: {URL}

You are about to run a simulated penetration test against an external target.

IMPORTANT: You MUST have explicit written authorization from the owner of
this system before proceeding. Unauthorized penetration testing is illegal
in most jurisdictions and may violate computer fraud laws.

Do you confirm that you have authorization to test this target? (yes/no)
```

Wait for explicit "yes" confirmation. If "no", abort with:
```
Penetration test aborted. Only test systems you own or have explicit authorization to test.
```

For localhost targets, skip this warning (testing your own application).

## Step 3: Check ratatosk-cli Availability

Check if ratatosk-cli is installed for browser automation:

```bash
npm list -g @letsur-dev/ratatosk-cli 2>/dev/null && echo "FOUND" || npm list @letsur-dev/ratatosk-cli 2>/dev/null && echo "FOUND" || echo "NOT_FOUND"
```

If FOUND, check if skills are installed:
```bash
ls .claude/skills/ratatosk/ 2>/dev/null && echo "SKILLS_OK" || echo "NO_SKILLS"
```

Set `RATATOSK_AVAILABLE` based on the result.

If NOT_FOUND or NO_SKILLS, note it for the user (do NOT block execution):
```
**Note**: ratatosk-cli is not available. Browser-based testing will be skipped.
To enable browser automation:

  1. Add GitHub Packages registry to .npmrc:
     echo "@letsur-dev:registry=https://npm.pkg.github.com/" >> ~/.npmrc
     echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> ~/.npmrc

  2. Install ratatosk-cli (choose one):
     npm install -g @letsur-dev/ratatosk-cli   # global install
     npm install @letsur-dev/ratatosk-cli       # local install

  3. Install browser:
     GITHUB_TOKEN=YOUR_GITHUB_TOKEN npx ratatosk install

  4. Install skills:
     npx ratatosk install --skills

Proceeding with HTTP-based testing only.
```

## Step 4: Select Scan Intensity

Present the intensity selection:

```
## Scan Intensity

Select the intensity level for this penetration test:

### 1. Passive (Reconnaissance Only)
- HTTP header fingerprinting
- Security header audit
- Cookie attribute analysis
- robots.txt / sitemap.xml inspection
- CORS policy analysis
- TLS/SSL configuration check
- Technology fingerprinting
- JavaScript source review
No payloads are sent to the target.

### 2. Active (Vulnerability Probing)
Everything in Passive, plus:
- XSS reflection probes
- SQL injection detection (error/boolean/time-based)
- CSRF token validation testing
- IDOR endpoint testing
- Authentication bypass attempts
- SSRF detection
- File upload boundary testing
- Session management testing
- API security testing (GraphQL introspection, mass assignment)
Safe test payloads are sent but no exploitation is attempted.

### 3. Aggressive (Full Penetration)
Everything in Active, plus:
- Full SQL injection extraction
- XSS exploitation payloads
- Command injection probing
- SSTI detection and exploitation
- JWT cracking and forgery
- SSRF internal network probing
- File upload bypass for code execution
- Race condition testing
- Chained exploit attempts
Active exploitation is attempted on confirmed vulnerabilities.

Select intensity (1/2/3):
```

Wait for user selection.

## Step 4b: Initialize Workspace

Create the persistent workspace directory for this scan:

```bash
mkdir -p .vulchk/hacksim/phases
```

Initialize methodology tracking if not already present:
```bash
[ ! -f .vulchk/hacksim/methodology.json ] && echo '{"phases":[]}' > .vulchk/hacksim/methodology.json
```

## Step 5: Check for Prior Code Inspector Reports

Look for the most recent codeinspector report:

```bash
LATEST_CI=$(ls -t ./security-report/codeinspector-*.md 2>/dev/null | head -1)
[ -n "$LATEST_CI" ] && head -80 "$LATEST_CI"
```

If a report exists, read it to extract findings. These will be passed to the
attack planner to prioritize attack vectors based on known code-level
vulnerabilities.

If no report exists, note this — the planner will rely solely on runtime
reconnaissance.

## Step 5b: Session Detection

Check for a previous scan session:

```bash
cat .vulchk/hacksim/session.json 2>/dev/null
```

**If `session.json` exists AND `session.target` matches the current target URL**:

1. Check if this is a git repository and compare commits:
   ```bash
   CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null)
   ```
   If `git rev-parse` fails (not a git repo), set mode to `FULL` and skip the
   commit comparison — there is no reliable change detection without git.

2. **If same commit**: Display message and stop:
   ```
   ## No Changes Detected

   No changes since last scan (commit: {short_hash}).
   Results are up to date. Previous report: {session.last_report}

   To force a full re-scan, delete `.vulchk/hacksim/session.json` and run again.
   ```

3. **If different commit**: Set mode to `INCREMENTAL`.
   Existing `site-analysis.md` and `attack-scenarios.md` are reusable.

**If `session.json` does NOT exist OR target differs**: Set mode to `FULL` (fresh workspace).

## Step 5c: Incremental Mode Logic

Only applies when mode is `INCREMENTAL`.

### For localhost targets:

Determine which files changed since the last scan:
```bash
git diff --name-only {session.commit}..HEAD
```

Map changed files to affected phases:

| File Pattern Changed | Affected Phases |
|---------------------|----------------|
| Route/controller files | Re-test those specific routes (injection, auth, app-logic) |
| Auth middleware/config | Re-test auth phase |
| Model/schema files | Re-test injection + business-logic |
| Config/env files | Re-test passive (headers, CORS) |
| Frontend/view files | Re-test XSS + browser phases |

To build the `scenarios_filter` list:
1. Read `.vulchk/hacksim/attack-scenarios.md`
2. For each scenario, check its `Target Endpoint` field
3. Match endpoint paths to the changed route/controller files
4. For changed auth middleware: include ALL scenarios with `Phase: auth`
5. For changed model/schema files: include all scenarios with `Phase: injection` or `Phase: business-logic`
6. Collect the AS-{NNN} IDs of all matched scenarios → this is `scenarios_filter`

### For external targets (non-localhost):

Compare current site fingerprint (HTTP headers, technology stack) with saved
`site-analysis.md`:

```bash
curl -sI --max-time 10 "{target_url}" 2>/dev/null
```

- If fingerprint differs (different `Server`, `X-Powered-By`, or technology stack) → set mode to `FULL`
- If fingerprint matches → display the following and wait for user response:

```
## No Changes Detected

The target fingerprint matches the previous scan (last run: {session.timestamp}).

Run a full scan anyway? (yes/no)
```

If user answers "yes": set mode to `FULL` and proceed.
If user answers "no": stop execution — results are up to date.

## Step 6: Launch Attack Planner

### Execution Strategy

| Agent | Model | Order | Reason |
|-------|-------|-------|--------|
| vulchk-attack-planner | sonnet | 1st | Strategic planning, business logic analysis |
| vulchk-attack-executor | sonnet | 2nd (after approval) | Session chaining, response interpretation |

**These agents MUST run sequentially**: planner → user approval → executor.

Launch the attack planner sub-agent using the Task tool:

```
Launch agent: vulchk-attack-planner
Prompt: "Generate an attack plan for the following target:

Target URL: {url}
Intensity: {passive|active|aggressive}
ratatosk available: {yes|no}
Workspace: .vulchk/hacksim/
Mode: {FULL|INCREMENTAL}
Detected stack: {from Step 1 or codeinspector report}

Write site analysis to .vulchk/hacksim/site-analysis.md
Write attack scenarios to .vulchk/hacksim/attack-scenarios.md
Write attack plan to .vulchk/hacksim/attack-plan.md

{If INCREMENTAL mode}:
Existing site-analysis.md is reusable. Only update sections affected by changes.
Changed files since last scan:
{git diff output from Step 5c}

{If codeinspector report exists}:
Prior code inspection findings:
{paste key findings from codeinspector report — severity, category, location}

{If no codeinspector report}:
No prior code inspection report available. Perform initial reconnaissance
to determine the attack surface.

Return a structured attack plan following your instructions."
```

## Step 7: Display Attack Plan and Await Approval

Display the attack plan returned by the planner agent:

```
## Attack Plan

**Target**: {URL}
**Intensity**: {selected level}
**Based on**: {codeinspector report / runtime reconnaissance}

{attack plan content from planner agent}

---

⚠ Review this plan carefully before approving.
All approved tests will be logged with timestamps and payloads.

**Approve this attack plan? (yes/no)**
```

Wait for explicit user approval. If "no":
```
Attack plan rejected. You can:
1. Adjust the intensity level and try again
2. Modify the target URL
3. Run /vulchk.codeinspector first for better planning
```
Stop execution if rejected.

## Step 8: Launch Attack Executor — Two-Pass Model

After plan approval, execute the attack plan using a phase-based Two-Pass Model.
Instead of a single monolithic executor call, launch multiple executor instances
organized by phase type.

For incremental mode: Only launch phases that have affected scenarios (from `scenarios_filter` in Step 5c).

### Pass 1 — HTTP-only phases (parallel)

Send **one message** with **multiple Task tool calls simultaneously** — do NOT
send them in separate messages. Each call launches one executor instance for
one phase. Only include phases that have scenarios in `attack-scenarios.md`
(or all phases if `scenarios_filter` is not set).

The 6 phases are: `passive`, `injection`, `auth`, `app-logic`, `business-logic`, `api`.

For each phase, use this prompt:

```
Agent: vulchk-attack-executor
Prompt: "Execute phase '{phase}' of the approved attack plan:

Target URL: {url}
Intensity: {passive|active|aggressive}
Phase: {phase}
Workspace: .vulchk/hacksim/
ratatosk available: no (HTTP-only pass)
{If incremental}: Scenarios filter: {comma-separated AS-NNN IDs for this phase from Step 5c}

Read attack scenarios from .vulchk/hacksim/attack-scenarios.md
Read site analysis from .vulchk/hacksim/site-analysis.md
Write results to .vulchk/hacksim/phases/phase-{N}-{phase}.md

Approved Attack Plan:
{full attack plan content from .vulchk/hacksim/attack-plan.md}

Execute only the tests for the '{phase}' phase.
Log every attempt and return findings following your instructions."
```

Wait for ALL Pass 1 Task calls to complete before proceeding.

After all HTTP phases complete:
- Merge cookie jars (union of all discovered cookies/tokens):
  ```bash
  # Merge all phase-specific cookie jars into the main one
  for f in .vulchk/hacksim/cookies-*.txt; do
    [ -f "$f" ] && cat "$f" >> .vulchk/hacksim/cookies.txt
  done
  sort -u -o .vulchk/hacksim/cookies.txt .vulchk/hacksim/cookies.txt
  ```

### Pass 2 — Browser phases (sequential)

Only if `RATATOSK_AVAILABLE` is true. Run browser-dependent tests sequentially,
using the merged session state from Pass 1.

Check which phases have `Browser Required: yes` scenarios in `attack-scenarios.md`.
Run those phases one at a time, waiting for each to complete before starting the next.

For each browser phase, use this prompt:

```
Agent: vulchk-attack-executor
Prompt: "Execute browser-based tests for phase '{phase}':

Target URL: {url}
Intensity: {passive|active|aggressive}
Phase: {phase}
Workspace: .vulchk/hacksim/
ratatosk available: yes
{If incremental}: Scenarios filter: {comma-separated AS-NNN IDs with 'Browser Required: yes' for this phase}

Read attack scenarios from .vulchk/hacksim/attack-scenarios.md
Read site analysis from .vulchk/hacksim/site-analysis.md
Write results to .vulchk/hacksim/phases/phase-{N}-{phase}-browser.md

Approved Attack Plan:
{full attack plan content from .vulchk/hacksim/attack-plan.md}

Execute ONLY scenarios with 'Browser Required: yes'.
Use the merged session state from .vulchk/hacksim/cookies.txt.
Log every attempt and return findings following your instructions."
```

**Pass 2 phases run sequentially** (one at a time, waiting for each to complete).

### Pass 3 — Exploitation phases (sequential, aggressive only)

Only for `aggressive` intensity. These phases depend on confirmed findings from
Pass 1/2 and run sequentially.

Before launching each phase, read the Pass 1/2 result files to identify confirmed
vulnerabilities:
```bash
ls .vulchk/hacksim/phases/phase-*.md 2>/dev/null
```

Extract confirmed findings (those where the result was "Confirmed" or equivalent).
Pass these as the exploitation targets in the prompt.

For each phase in `[exploitation, advanced, post-exploit]`, use this prompt:

```
Agent: vulchk-attack-executor
Prompt: "Execute exploitation phase '{phase}':

Target URL: {url}
Intensity: aggressive
Phase: {phase}
Workspace: .vulchk/hacksim/
ratatosk available: {yes|no}

Read attack scenarios from .vulchk/hacksim/attack-scenarios.md
Read site analysis from .vulchk/hacksim/site-analysis.md
Write results to .vulchk/hacksim/phases/phase-{N}-{phase}.md

Confirmed vulnerabilities to exploit (from earlier phases):
{list of HSM-{NNN} findings with severity, endpoint, and technique confirmed in Pass 1/2}

Approved Attack Plan:
{full attack plan content from .vulchk/hacksim/attack-plan.md}

Exploit ONLY the confirmed vulnerabilities listed above.
Log every attempt and return findings following your instructions."
```

**Pass 3 phases run sequentially** because each phase may depend on findings from the previous.

## Step 9: Generate Report

Create the directory if it does not exist:

```bash
mkdir -p ./security-report
```

Get the timestamp:
```bash
date +%Y-%m-%d-%H%M%S
```

### Collect Phase Results

Read all phase result files from `.vulchk/hacksim/phases/` and the
methodology data from `.vulchk/hacksim/methodology.json` to assemble the report.

```bash
ls .vulchk/hacksim/phases/phase-*.md 2>/dev/null
cat .vulchk/hacksim/methodology.json 2>/dev/null
```

Merge all findings (HSM-{NNN}) from all phase files into a single consolidated
list, sorted by severity. Merge all attack logs chronologically.

Generate the report file at `./security-report/hacksimulator-{YYYY-MM-DD-HHmmss}.md`.

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

### Intensity Labels

- Passive (패시브)
- Active (액티브)
- Aggressive (공격적)

### Report Structure

Use the language reference above to translate all section headers and
labels. The template below shows the English structure — replace each
heading and label with the corresponding translation from the table.

```markdown
# {Penetration Test Report}

**{Date}**: {YYYY-MM-DD HH:mm:ss}
**{Target}**: {URL}
**{Intensity}**: {passive | active | aggressive}
**VulChk Version**: {from .vulchk/config.json}
**ratatosk-cli**: {available | not available}

## {Executive Summary}

{total_findings} {security findings identified}:
- **Critical**: {count} — {Immediate action required}
- **High**: {count} — {Address in next sprint}
- **Medium**: {count} — {Plan remediation}
- **Low**: {count} — {Consider addressing}
- **Informational**: {count} — {For awareness}

{2-3 sentence summary in report language}

## {Attack Plan Summary}

**{Intensity}**: {level}
**{Based on}**: {{codeinspector report} / {runtime reconnaissance}}

{brief description of the approved attack plan phases, in report language}

## {Findings Summary}

| # | {Severity} | {Vector} | {Endpoint} | {Description} |
|---|----------|--------|----------|-------------|
{one row per finding, sorted by severity}

## {Detailed Findings}

{For each finding:}

### {N}. {title}

- **{Severity}**: Critical | High | Medium | Low | Informational
- **{Vector}**: browser | http-fetch | api-probe
- **{Endpoint}**: {URL/path}
- **{Request}**:
  ```http
  {method} {path} HTTP/1.1
  {relevant headers}

  {payload body if applicable}
  ```
- **{Response}**:
  ```
  {status code and relevant response data}
  ```
- **{Evidence}**: {description, in report language}
- **{References}**: CWE-{XXX}, OWASP A{XX}:2021
- **{Remediation}**: {actionable fix steps, in report language}

## {Attack Log}

| # | {Timestamp} | {Vector} | {Endpoint} | {Payload} | {Status} | {Result} |
|---|-----------|--------|----------|---------|--------|--------|
{complete log of every test attempt, sorted chronologically}

## {Methodology}

### {Execution Summary}

| # | {Phase} | {Duration} | {Tests} | {Findings} | {Vector} |
|---|---------|-----------|---------|------------|---------|
{one row per phase from methodology.json, e.g.:}
| 1 | Passive | 2m 30s | 15 | 3 | http-fetch |
| 2 | Injection | 1m 45s | 22 | 1 | http-fetch |
{...}

**{Total Duration}**: {sum of all phase durations}
**{Parallelization}**: Pass 1 ({N} phases parallel), Pass 2 ({M} browser sequential)

### {Attack Scenario Coverage}

| AS-# | {Scenario} | {Phase} | {Result} | {Finding} |
|------|-----------|---------|----------|-----------|
{one row per scenario from attack-scenarios.md, with result and linked finding:}
| AS-001 | SQLi on /api/users | injection | Confirmed | HSM-001 |
| AS-002 | XSS on search | injection | Not vulnerable | — |
{...}

### {Tools Used}
- curl (HTTP requests)
{if ratatosk available:}
- ratatosk-cli (browser automation)
{additional detected technology-specific tools}

## {Coverage Notes}

### {Tests Performed}
{list of test categories that were executed, in report language}

### {Tests Skipped}
{list of tests skipped and why, in report language}

### {Limitations}
{limitations encountered, in report language}

## {Recommendations}

{Top 3-5 prioritized recommendations, in report language}

---
*{Generated by VulChk Hack Simulator}*
```

## Step 10: Finalize Session and Present Summary

### Update Session for Incremental Mode

**Before displaying the summary**, write `.vulchk/hacksim/session.json` so that
if context is exhausted after this point, the incremental state is still saved:

```bash
COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
TIMESTAMP=$(date +"%Y-%m-%dT%H:%M:%SZ")
REPORT_PATH="./security-report/hacksimulator-{timestamp}.md"

cat > .vulchk/hacksim/session.json << EOF
{
  "target": "{target_url}",
  "commit": "${COMMIT}",
  "timestamp": "${TIMESTAMP}",
  "intensity": "{selected intensity}",
  "last_report": "${REPORT_PATH}"
}
EOF
```

Do NOT delete the workspace files — they are needed for future incremental runs.

If local execution was used (Step 1, Case B option 1), stop the local server:
```bash
kill %1 2>/dev/null
```

### Present Summary to User

Display a summary:

```
## Penetration Test Complete

Report saved to: ./security-report/hacksimulator-{timestamp}.md

### Target: {URL}
### Intensity: {level}

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

### Attack Log
- Total tests executed: {count}
- Successful exploits: {count}
- Tests skipped: {count}
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
| Token | `ghp_1234567890abcdef12345678` | `ghp_****...****5678` |
| Session Cookie | `s%3Aabc123...xyz789.sig` | `s%3A****...****sig` |
| JWT | `eyJhbG...payload...signature` | `eyJh****...****ture` |
| Set-Cookie Value | `session=abc123def456` | `session=abc1****...****f456` |

### Redaction Application Rules

- Apply redaction in ALL output: report file, user summary, attack log
- For values shorter than 8 characters, show only first 2 and last 2
- Redact response bodies that contain tokens, session IDs, or credentials
- NEVER redact URLs, endpoint paths, HTTP methods, or status codes
- NEVER redact CVE IDs, CWE references, or OWASP categories
- Test payloads (XSS probes, SQLi strings) may be shown unredacted as
  they are the tester's own inputs, not discovered secrets

## Important Rules

- NEVER send any request to the target before the attack plan is approved
- ALWAYS display the authorization warning for non-localhost targets
- Log EVERY test attempt — both successful and failed — with timestamps
- If ratatosk-cli is not available, proceed with HTTP-based testing only
- Do NOT attempt brute-force attacks that could cause denial of service
- If a test causes an error or the target becomes unresponsive, pause and
  inform the user before continuing
- If a WAF or rate limiter is detected, note it in the report and reduce
  request frequency
- The attack plan MUST be approved before ANY testing begins
- For aggressive intensity, warn the user that these tests may trigger
  security monitoring on the target
