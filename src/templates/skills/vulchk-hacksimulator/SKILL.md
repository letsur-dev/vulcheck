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

First, check if templates need updating (runs silently via CLI, not LLM):

```bash
CONFIG_VER=$(node -p "try{require('./.vulchk/config.json').version}catch{''}" 2>/dev/null)
PKG_VER=$(vulchk --version 2>/dev/null)
[ -n "$CONFIG_VER" ] && [ -n "$PKG_VER" ] && [ "$CONFIG_VER" != "$PKG_VER" ] && { vulchk init 2>/dev/null || true; }
```

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

| # | Level | Description |
|---|-------|-------------|
| 1 | Passive | Reconnaissance only — headers, cookies, CORS, TLS, fingerprinting. No payloads sent. |
| 2 | Active | Passive + injection probes (XSS, SQLi, SSTI), auth testing, IDOR, CSRF, SSRF, API security. Safe payloads only. |
| 3 | Aggressive | Active + full exploitation of confirmed vulns, command injection, JWT forgery, race conditions. |

Select intensity (1/2/3):
```

Wait for user selection.

## Step 4b: Initialize Workspace

Create the persistent workspace directory for this scan:

```bash
mkdir -p .vulchk/hacksim/phases
```

Clean up previous DB write log:
```bash
[ -f .vulchk/hacksim/db-writes.json ] && rm .vulchk/hacksim/db-writes.json
```

Initialize methodology tracking if not already present:
```bash
[ ! -f .vulchk/hacksim/methodology.json ] && echo '{"phases":[]}' > .vulchk/hacksim/methodology.json
```

## Step 5: Check for Prior Code Inspector Reports

Look for the codeinspector report:

```bash
CI_REPORT="./security-report/codeinspector.md"
[ -f "$CI_REPORT" ] && head -80 "$CI_REPORT"
```

If the report exists, read it to extract findings. These will be passed to the
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

| Agent | Model | Phases | Order |
|-------|-------|--------|-------|
| vulchk-attack-planner | sonnet | planning | 1st |
| vulchk-attack-executor-auth | sonnet | auth, app-logic | Pass 0 (pre-auth) + Pass 1 |
| vulchk-attack-executor-recon | sonnet | passive | Pass 1 (parallel) |
| vulchk-attack-executor-injection | sonnet | injection | Pass 1 (parallel) |
| vulchk-attack-executor-business | sonnet | business-logic, api | Pass 1 (parallel) |
| vulchk-attack-executor-baas | sonnet | injection (BaaS) | Pass 1 (conditional) |
| vulchk-attack-executor-exploit | sonnet | exploitation, advanced, post-exploit | Pass 3 (aggressive only) |

**Flow**: planner → user approval → executor agents (multi-pass).

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

{If Aggressive}: ⚠ WARNING: AGGRESSIVE MODE ENABLED
{If Aggressive}: This mode includes active exploitation attempts and race condition tests.
{If Aggressive}: It may cause temporary service instability, data exhaustion, or trigger
{If Aggressive}: security alerts. Use only on STAGING or AUTHORIZED environments.

**Approve this attack plan? (yes/no)**
```

## Step 7b: DB-Write Impact Assessment

After the attack plan is approved and before launching executors, analyze DB write scenarios.

1. Filter `attack-scenarios.md` for scenarios with `DB Write: yes`
2. If DB write scenarios exist, display to the user:

   ```
   ## DB Impact Analysis
   | Scenario | Description | Impact |
   |----------|-------------|--------|
   {list of DB Write: yes scenarios}

   Options:
   1. **Include DB writes** — Execute all tests (automatic rollback attempted after testing)
   2. **Exclude DB writes** (recommended) — Skip all DB-modifying scenarios
   ```

3. If "Exclude" selected: pass the DB write scenario IDs as exclusion filter to executors
4. If "Include" selected: instruct executors to log DB writes + require `vulchk-` prefix for all test data
5. If no DB write scenarios exist, skip this step automatically

## Step 8: Launch Attack Executor — Multi-Pass Model

### Error Handling & Rate Limiting (Orchestrator Level)

As the orchestrator, you must monitor sub-agent outputs for **HTTP 429 (Too Many Requests)**.
If any agent reports a 429 error:
1. **Pause** all other active tasks in that pass.
2. **Wait** 30 seconds (cooldown).
3. **Resume** tasks with a directive to "Reduce request frequency".
4. If 429 persists, downgrade the intensity or abort the phase.

```
Attack plan rejected. You can:
1. Adjust the intensity level and try again
2. Modify the target URL
3. Run /vulchk.codeinspector first for better planning
```
Stop execution if rejected.

## Step 8: Launch Attack Executor — Multi-Pass Model

After plan approval, execute the attack plan using a phase-based Multi-Pass Model.
Launch specialized executor agents organized by phase type.

For incremental mode: Only launch phases that have affected scenarios (from `scenarios_filter` in Step 5c).

### Agent Routing Table

Each phase maps to a specialized agent:

| Phase | Agent | Pass |
|-------|-------|------|
| auth | vulchk-attack-executor-auth | Pass 0 |
| passive | vulchk-attack-executor-recon | Pass 1 |
| injection | vulchk-attack-executor-injection | Pass 1 |
| app-logic | vulchk-attack-executor-auth | Pass 1 |
| business-logic | vulchk-attack-executor-business | Pass 1 |
| api | vulchk-attack-executor-business | Pass 1 |
| (BaaS detected) | vulchk-attack-executor-baas | Pass 1 |
| (browser phases) | same as HTTP agent + ratatosk flag | Pass 2 |
| exploitation, advanced, post-exploit | vulchk-attack-executor-exploit | Pass 3 |

### Common Prompt Template

All executor agents receive the same base prompt structure:

```
Agent: {agent_name from routing table}
Prompt: "Execute phase '{phase}' of the approved attack plan:

Target URL: {url}
Intensity: {intensity}
Phase: {phase}
Workspace: .vulchk/hacksim/
ratatosk available: {yes|no}
{If incremental}: Scenarios filter: {comma-separated AS-NNN IDs for this phase}

Read attack scenarios from .vulchk/hacksim/attack-scenarios.md
Read site analysis from .vulchk/hacksim/site-analysis.md
Use session state from .vulchk/hacksim/cookies.txt and/or .vulchk/hacksim/jwt.txt
Write results to .vulchk/hacksim/phases/phase-{N}-{phase}.md

Read .vulchk/hacksim/attack-plan.md and execute ONLY the '{phase}' section.
Log every attempt and return findings following your instructions."
```

### Pass 0 — Pre-auth phase (sequential)

Launch `vulchk-attack-executor-auth` with `Phase: auth` to acquire session tokens.
Add to prompt: "Acquire session tokens and store in .vulchk/hacksim/cookies.txt and/or .vulchk/hacksim/jwt.txt."

Wait for Pass 0 to complete. Verify session files:
```bash
ls -la .vulchk/hacksim/cookies.txt .vulchk/hacksim/jwt.txt 2>/dev/null
```

### Pass 1 — HTTP-only phases (parallel)

Send **one message** with **multiple Task tool calls simultaneously**.
Only include phases with scenarios in `attack-scenarios.md`.

Launch these in parallel using the routing table:
- `passive` → vulchk-attack-executor-recon
- `injection` → vulchk-attack-executor-injection
- `app-logic` → vulchk-attack-executor-auth
- `business-logic` → vulchk-attack-executor-business
- `api` → vulchk-attack-executor-business

#### BaaS Detection (conditional)

Read `site-analysis.md` DB Type field. If it contains `Supabase`, `Firebase`,
or `Elasticsearch`, **also** launch `vulchk-attack-executor-baas` in parallel
with the other Pass 1 agents. Add to prompt: "Detected platforms: {platform list}".

Wait for ALL Pass 1 Task calls to complete.

Merge cookie jars:
```bash
for f in .vulchk/hacksim/cookies-*.txt; do
  [ -f "$f" ] && cat "$f" >> .vulchk/hacksim/cookies.txt
done
sort -u -o .vulchk/hacksim/cookies.txt .vulchk/hacksim/cookies.txt
```

### Pass 2 — Browser phases (sequential)

Only if `RATATOSK_AVAILABLE` is true. Check which phases have `Browser Required: yes`
scenarios. Launch the **same agent from the routing table** but with
`ratatosk available: yes` and write to `phase-{N}-{phase}-browser.md`.
Add: "Execute ONLY scenarios with 'Browser Required: yes'."

**Pass 2 phases run sequentially** (one at a time).

### Pass 3 — Exploitation phases (sequential, aggressive only)

Only for `aggressive` intensity. Read Pass 0/1/2 results to find confirmed vulnerabilities:
```bash
ls .vulchk/hacksim/phases/phase-*.md 2>/dev/null
```

For each phase in `[exploitation, advanced, post-exploit]`, launch
`vulchk-attack-executor-exploit`. Add to prompt:
"Confirmed vulnerabilities to exploit: {list of HSM-{NNN} findings from earlier phases}."

**Pass 3 phases run sequentially** because each may depend on previous findings.

## Step 8b: DB Rollback

Condition: Step 7b selected "Include DB writes" AND `{workspace}/db-writes.json` exists.

1. Read `db-writes.json`
2. For each write operation in reverse order, attempt rollback:
   - If response contains an `id` field: `DELETE {endpoint}/{id}`
   - If data has `vulchk-` prefix: identify and delete by identifier
3. Record results to `{workspace}/db-rollback.json`
4. For failed rollbacks: add a warning section to the report header
5. On success: record "N DB writes successfully rolled back" in the Methodology section

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

Get git commit info for the report header:
```bash
git rev-parse --short HEAD 2>/dev/null
git log -1 --format="%s" 2>/dev/null
```

If in a git repo, include in the report header:
`- **Base Commit**: \`{short_hash}\` — {commit_subject}`
If not a git repo (commands fail), omit the Base Commit line.

Merge all findings (HSM-{NNN}) from all phase files into a single consolidated
list, sorted by severity. Merge all attack logs chronologically.

### Cross-Agent Discrepancy Detection

After collecting all phase results, detect cases where different agents reported
conflicting results for the same endpoint:

- Injection agent: 400 (blocked) vs Business agent: 200 (allowed) → requires explanation
- One agent reports "not vulnerable" vs another agent reports a finding on the same endpoint

For each detected discrepancy, add a Cross-Agent Note in Detailed Findings:
  - Summary of each agent's result
  - Explanation of the discrepancy (e.g., "SQL metacharacters are blocked but non-malicious invalid values are accepted")

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

Translate all section headers using the language reference above.

**Required sections** (in order):

1. **Header**: Title, Date, Target, Intensity, Base Commit (`{short_hash}` — {commit_subject}), VulChk Version, ratatosk-cli status
2. **{Executive Summary}**: Finding counts by severity + 2-3 sentence summary
3. **{Test Result Summary}**:
   a. **{Vulnerable (Action Required)}**: `| # | Severity | Practical Risk | Endpoint | Description |`
   b. **{Safe (No Issues)}**: `| Test | Endpoint | Result |` — ✅ icon with pass rationale
   c. **{Not Tested (Skipped)}**: `| Scenario | Reason |`
4. **{Attack Plan Summary}**: Intensity, basis (codeinspector/recon), brief phase description
5. **{Findings Summary}**: Table — `| # | {Severity} | {Status} | {Vector} | {Endpoint} | {Description} |` sorted by severity (Status: Vulnerable | Pass | Skipped)
6. **{Detailed Findings}**: For each finding: Severity, Practical Risk, Intended Access, Vector, Endpoint, Request (http block), Response, Evidence, References (CWE/OWASP), Remediation
7. **{Attack Log}**: Table — `| # | {Timestamp} | {Vector} | {Endpoint} | {Payload} | {Status} | {Result} |` chronological
8. **{Methodology}**:
   - {Execution Summary}: Table — `| # | {Phase} | {Duration} | {Tests} | {Findings} | {Vector} |` from methodology JSONs
   - {Attack Scenario Coverage}: Table — `| AS-# | {Scenario} | {Phase} | {Result} | {Finding} |`
   - {Tools Used}: curl + ratatosk (if available)
9. **{Coverage Notes}**: {Tests Performed}, {Tests Skipped}, {Limitations}
10. **{Recommendations}**: Top 3-5 prioritized recommendations
    - Include a **{Positive Findings}** subsection: items the app handles correctly (input validation working, CORS restrictions enforced, etc.)

Footer: `*{Generated by VulChk Hack Simulator}*`

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
