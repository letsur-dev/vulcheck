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
which ratatosk 2>/dev/null && echo "FOUND" || echo "NOT_FOUND"
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
  npm install -g ratatosk-cli
  ratatosk install --skills

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

## Step 5: Check for Prior Code Inspector Reports

Look for existing codeinspector reports:

```bash
ls -t ./security-report/codeinspector-*.md 2>/dev/null | head -1
```

If a report exists, read it to extract findings. These will be passed to the
attack planner to prioritize attack vectors based on known code-level
vulnerabilities.

If no report exists, note this — the planner will rely solely on runtime
reconnaissance.

## Step 6: Launch Attack Planner

Launch the attack planner sub-agent using the Task tool:

```
Launch agent: vulchk-attack-planner
Prompt: "Generate an attack plan for the following target:

Target URL: {url}
Intensity: {passive|active|aggressive}
ratatosk available: {yes|no}
Detected stack: {from Step 1 or codeinspector report}

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

## Step 8: Launch Attack Executor

After plan approval, launch the attack executor sub-agent:

```
Launch agent: vulchk-attack-executor
Prompt: "Execute the following approved attack plan against the target:

Target URL: {url}
Intensity: {passive|active|aggressive}
ratatosk available: {yes|no}

Approved Attack Plan:
{full attack plan from Step 7}

Execute each test in the plan sequentially. Log every attempt with:
- Timestamp
- Vector (browser/http-fetch/api-probe)
- Endpoint tested
- Payload sent
- Response status and relevant data

Return all findings and the complete attack log following your instructions."
```

## Step 9: Generate Report

Create the directory if it does not exist:

```bash
mkdir -p ./security-report
```

Get the timestamp:
```bash
date +%Y-%m-%d-%H%M%S
```

Generate the report file at `./security-report/hacksimulator-{YYYY-MM-DD-HHmmss}.md`.

### Report Structure

If report language is `ko`, write section headers and descriptions in Korean.
If report language is `ja`, write in Japanese.
Security terms (CVE, XSS, CSRF, OWASP, CWE, SSRF, IDOR, SQLi) MUST remain in English regardless of language.

```markdown
# Penetration Test Report

**Date**: {YYYY-MM-DD HH:mm:ss}
**Target**: {URL}
**Intensity**: {passive | active | aggressive}
**VulChk Version**: {from .vulchk/config.json}
**ratatosk-cli**: {available | not available}

## Executive Summary

{total_findings} security findings identified through {intensity} penetration testing:
- **Critical**: {count} — Immediate action required
- **High**: {count} — Address in next sprint
- **Medium**: {count} — Plan remediation
- **Low**: {count} — Consider addressing
- **Informational**: {count} — For awareness

{2-3 sentence summary of the most impactful findings and overall security posture}

## Attack Plan Summary

**Intensity**: {level}
**Based on**: {codeinspector report / runtime reconnaissance}

{brief description of the approved attack plan phases}

## Findings Summary

| # | Severity | Vector | Endpoint | Description |
|---|----------|--------|----------|-------------|
{one row per finding, sorted by severity}

## Detailed Findings

{For each finding:}

### {N}. {title}

- **Severity**: Critical | High | Medium | Low | Informational
- **Vector**: browser | http-fetch | api-probe
- **Endpoint**: {URL/path}
- **Request**:
  ```http
  {method} {path} HTTP/1.1
  {relevant headers}

  {payload body if applicable}
  ```
- **Response**:
  ```
  {status code and relevant response data}
  ```
- **Evidence**: {description of what proves the vulnerability, screenshot path if browser-based}
- **References**: CWE-{XXX}, OWASP A{XX}:2021
- **Remediation**: {actionable fix steps}

## Attack Log

| # | Timestamp | Vector | Endpoint | Payload | Status | Result |
|---|-----------|--------|----------|---------|--------|--------|
{complete log of every test attempt, sorted chronologically}

## Coverage Notes

### Tests Performed
{list of test categories that were executed}

### Tests Skipped
{list of tests that were skipped and why — e.g., "Browser-based XSS: ratatosk not available"}

### Limitations
{any limitations encountered during testing — timeouts, rate limiting, WAF blocks}

## Recommendations

{Top 3-5 prioritized recommendations based on findings}

---
*Generated by VulChk Hack Simulator*
```

## Step 10: Present Summary to User

After writing the report, display a summary:

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

If local execution was used (Step 1, Case B option 1), stop the local server:
```bash
# Kill the background process
kill %1 2>/dev/null
```

## Important Rules

- NEVER send any request to the target before the attack plan is approved
- ALWAYS display the authorization warning for non-localhost targets
- ALWAYS redact sensitive values (tokens, passwords) in the report
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
