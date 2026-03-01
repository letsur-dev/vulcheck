# Feature Specification: VulChk Security Analysis Toolkit

**Feature Branch**: `001-vulchk-toolkit`
**Created**: 2026-03-01
**Status**: Clarified
**Input**: User description: "Claude Code slash command-based vulnerability analysis toolkit providing code-level inspection and simulated penetration testing"

## User Scenarios & Testing *(mandatory)*

### User Story 0 - CLI Installation and Project Init (Priority: P0)

As a developer, I want to install `vulchk` as an npm CLI tool and
run `vulchk init` in my project directory so that Claude Code slash
commands for security analysis are set up and ready to use.

**Why this priority**: Without the CLI tool and init flow, no slash
commands exist. This is the prerequisite for all other features.

**Independent Test**: Can be tested by running `npm install -g vulchk`
followed by `vulchk init` in a fresh project and verifying that
`.claude/skills/` and `.claude/agents/` are populated.

**Acceptance Scenarios**:

1. **Given** vulchk is installed globally via npm, **When** I run
   `vulchk init` in a project directory, **Then** an interactive
   enquirer-based setup wizard prompts me to configure report
   language (en/ko/ja, etc.) and writes a `.vulchk/config.json`.

2. **Given** `vulchk init` completes, **When** I check the project,
   **Then** `.claude/skills/vulchk-codeinspector/SKILL.md`,
   `.claude/skills/vulchk-hacksimulator/SKILL.md`, and
   `.claude/agents/` files are created from bundled templates.

3. **Given** `vulchk init` has run, **When** I open Claude Code in
   the project, **Then** `/vulchk.codeinspector` and
   `/vulchk.hacksimulator` are available as slash commands.

---

### User Story 1 - Code Vulnerability Inspection (Priority: P1)

As a developer, I want to run `/vulchk.codeinspector` in Claude Code
so that I can get a comprehensive security audit of my project's
codebase without needing specialized security expertise.

**Why this priority**: Code-level vulnerability analysis is the
foundation that all other features build upon. It provides the
baseline security posture assessment that the hack simulator can
later leverage for targeted testing.

**Independent Test**: Can be fully tested by running the command in
any project with source code and verifying it produces a structured
report in `./security-report/`.

**Acceptance Scenarios**:

1. **Given** a project with a `package.json` containing outdated
   dependencies, **When** I run `/vulchk.codeinspector`, **Then**
   the report lists known CVEs for those dependency versions with
   severity ratings.

2. **Given** a project with SQL queries built via string
   concatenation, **When** I run `/vulchk.codeinspector`, **Then**
   the report flags each instance as a potential SQL injection
   vulnerability with the file path and line number.

3. **Given** a project with a `.gitignore` that does not include
   `.env`, **When** I run `/vulchk.codeinspector`, **Then** the
   report flags the missing `.env` entry as a secrets exposure risk.

4. **Given** a project with API keys committed in git history,
   **When** I run `/vulchk.codeinspector`, **Then** the report
   identifies the commits containing sensitive values and recommends
   remediation steps.

5. **Given** a project with Dockerfile and Kubernetes manifests,
   **When** I run `/vulchk.codeinspector`, **Then** the report
   evaluates container security (base image vulnerabilities,
   privilege escalation risks, resource limits, network policies).

6. **Given** a Next.js project deployed on Vercel, **When** I run
   `/vulchk.codeinspector`, **Then** the report includes
   Vercel-specific security checks (environment variable exposure
   in edge/serverless functions, public directory leaks, API route
   authentication, middleware security).

7. **Given** the analysis begins, **When** the tool scans the
   project, **Then** it displays the analysis plan (checks to
   perform) and proceeds automatically without requiring user
   approval (code inspection is non-destructive).

---

### User Story 2 - Simulated Penetration Testing with URL (Priority: P2)

As a developer, I want to run `/vulchk.hacksimulator https://my-app.com`
so that I can discover exploitable vulnerabilities in my running
application from an attacker's perspective.

**Why this priority**: Dynamic testing against a live target catches
runtime vulnerabilities that static analysis misses. Requires P1 for
optimal planning but can function independently.

**Independent Test**: Can be tested by providing a URL to a running
web application and verifying the tool performs authorized probing
and produces a penetration test report.

**Acceptance Scenarios**:

1. **Given** a URL to a running web application, **When** I run
   `/vulchk.hacksimulator https://target.com`, **Then** the tool
   first asks me to select scan intensity (passive / active /
   aggressive) before presenting the attack plan.

2. **Given** a prior `/vulchk.codeinspector` report exists in
   `./security-report/`, **When** I run `/vulchk.hacksimulator`,
   **Then** the attack plan references findings from the code
   inspection to prioritize attack vectors.

3. **Given** the user selects intensity and approves the attack plan,
   **When** the simulation runs, **Then** it tests via multiple
   vectors (browser automation via ratatosk-cli, HTTP fetch requests,
   API endpoint probing) and logs every attempt with timestamps.

4. **Given** ratatosk-cli is not installed, **When** the hack
   simulator attempts browser-based testing, **Then** it displays
   a message asking the user to install ratatosk-cli and run
   `ratatosk install --skills`, and falls back to non-browser
   methods only.

---

### User Story 3 - Simulated Penetration Testing without URL (Priority: P3)

As a developer, I want to run `/vulchk.hacksimulator` without a URL
so that I can test my application locally by having the tool analyze
and optionally run my code directly.

**Why this priority**: Enables testing before deployment. Depends
on the same infrastructure as P2 but adds local execution logic.

**Independent Test**: Can be tested by running the command without
arguments in a project that has runnable source code, and verifying
the tool asks the user whether to run the code locally or provide
a URL.

**Acceptance Scenarios**:

1. **Given** no URL argument is provided, **When** I run
   `/vulchk.hacksimulator`, **Then** the tool asks whether to
   (a) have the LLM analyze and locally run the project code for
   testing, or (b) provide a URL manually.

2. **Given** the user chooses local execution, **When** the tool
   runs the project, **Then** it identifies the start command from
   project configuration, launches the application, and proceeds
   with the hack simulation against localhost.

3. **Given** the user chooses to provide a URL, **When** they enter
   the URL, **Then** the tool proceeds as in User Story 2.

---

### User Story 4 - Report Generation and Output (Priority: P1)

As a developer, I want all analysis results saved as structured
Markdown reports in `./security-report/` so that I can review,
share, and track security findings over time.

**Why this priority**: Report output is a cross-cutting requirement
shared by both code inspection and hack simulation. Without it,
no analysis results are persisted.

**Independent Test**: Can be tested by verifying that any analysis
command creates properly formatted Markdown files in the expected
directory with all required sections.

**Acceptance Scenarios**:

1. **Given** any analysis completes, **When** the report is written,
   **Then** it is saved to `./security-report/` with the filename
   pattern `{analysis-type}-{YYYY-MM-DD-HHmmss}.md`.

2. **Given** a report is generated, **When** I open it, **Then** it
   contains: executive summary, findings table with severity ratings
   (Critical/High/Medium/Low/Informational), detailed findings with
   evidence (code snippets or response data), CVE/CWE/OWASP
   references, and actionable remediation steps.

3. **Given** sensitive data (API keys, passwords) is discovered,
   **When** the report is written, **Then** those values are
   redacted (e.g., `sk-****...****1234`).

4. **Given** a report language was configured via `vulchk init`,
   **When** a report is generated, **Then** it is written in the
   configured language (security terms keep original English with
   parenthetical translations where applicable).

---

### Edge Cases

- What happens when the project has no recognizable framework or
  language? The tool MUST still check for secrets exposure, git
  history leaks, and basic file-level vulnerabilities.

- How does the system handle a target URL that is unreachable?
  The tool MUST report the connection failure, suggest possible
  causes, and halt gracefully without retrying indefinitely.

- What happens when ratatosk-cli is installed but its skills are
  not? The tool MUST detect this via `which ratatosk` succeeding
  but skill files being absent, and prompt the user to run
  `ratatosk install --skills`.

- How does the system handle extremely large repositories? The tool
  MUST use sub-agents to parallelize analysis and provide progress
  updates to the user.

- What happens when the user runs the hack simulator against a
  third-party site they do not own? The tool MUST display a
  prominent authorization warning and require explicit confirmation
  that the user has permission to test the target.

- What happens when `vulchk init` is run in a project that already
  has VulChk configured? The tool MUST detect existing config and
  offer to reconfigure or skip.

## Requirements *(mandatory)*

### Functional Requirements

#### CLI Tool & Initialization

- **FR-001**: System MUST be distributed as an npm package providing
  the `vulchk` CLI command.

- **FR-002**: `vulchk init` MUST present an interactive
  enquirer-based setup wizard that collects: report language
  (required, choices: en/ko/ja/etc.) and writes configuration to
  `.vulchk/config.json`.

- **FR-003**: `vulchk init` MUST copy bundled skill and agent
  templates into the project's `.claude/skills/` and
  `.claude/agents/` directories, making `/vulchk.codeinspector`
  and `/vulchk.hacksimulator` available as Claude Code slash
  commands.

#### Code Inspector (`/vulchk.codeinspector`)

- **FR-004**: System MUST detect project technology stack
  (frameworks, languages, databases, protocols) by scanning
  configuration files (package.json, requirements.txt, go.mod,
  Cargo.toml, Dockerfile, docker-compose.yml, k8s manifests, etc.).

- **FR-005**: System MUST provide specialized analysis rules for
  Node.js, React/Next.js, and FastAPI projects. For Next.js
  projects, MUST include Vercel deployment-specific checks
  (edge function env exposure, API route auth, middleware security,
  public directory leaks). All other stacks MUST be analyzed with
  generic vulnerability patterns.

- **FR-006**: System MUST look up known CVEs for detected dependency
  versions via web search and report findings with severity ratings.

- **FR-007**: System MUST scan code for OWASP Top 10 vulnerability
  patterns including but not limited to: SQL injection, XSS, CSRF,
  insecure deserialization, broken authentication, security
  misconfiguration, sensitive data exposure, and insufficient
  logging.

- **FR-008**: System MUST verify that `.gitignore` includes entries
  for common secret files (`.env`, `.env.local`, credentials files,
  key files).

- **FR-009**: System MUST scan git history for accidentally committed
  secrets (API keys, passwords, tokens, private keys).

- **FR-010**: System MUST analyze Dockerfile and Kubernetes manifests
  for container security issues (privileged containers, missing
  resource limits, insecure base images, exposed ports, missing
  network policies, secrets mounted as environment variables).

- **FR-011**: System MUST scan for memory safety issues in applicable
  languages (buffer overflows, use-after-free, null pointer
  dereferences).

- **FR-012**: System MUST check for insecure cryptographic practices
  (weak algorithms, hardcoded keys, insufficient key lengths).

- **FR-013**: System MUST validate authentication and authorization
  patterns (missing auth checks on endpoints, insecure session
  management, weak password policies).

- **FR-014**: System MUST display the analysis plan (list of checks)
  at the start and proceed automatically without requiring user
  approval (code inspection is non-destructive).

- **FR-015**: When a web frontend and backend are co-located in the
  same repository, the code inspector MUST analyze both layers and
  their interaction points (API contracts, CORS settings, auth
  token handling between frontend and backend).

#### Hack Simulator (`/vulchk.hacksimulator`)

- **FR-016**: System MUST provide `/vulchk.hacksimulator` as a
  Claude Code slash command skill that performs simulated
  penetration testing.

- **FR-017**: System MUST accept an optional URL argument; when
  omitted, prompt the user to choose between local execution
  (LLM runs the project code) or manual URL input.

- **FR-018**: System MUST ask the user to select scan intensity
  (passive / active / aggressive) at the start of each simulation
  run, with clear descriptions of what each level entails.

- **FR-019**: System MUST present an attack plan to the user and
  await explicit approval before sending any request to the target.

- **FR-020**: System MUST use ratatosk-cli for browser-based
  testing; if unavailable, prompt the user to install ratatosk-cli
  and run `ratatosk install --skills`.

- **FR-021**: System MUST test via multiple attack vectors:
  browser automation (ratatosk-cli), HTTP fetch/curl requests, and
  direct API endpoint probing.

- **FR-022**: System MUST leverage prior `/vulchk.codeinspector`
  reports when building the hack simulation attack plan, if
  available in `./security-report/`.

- **FR-023**: System MUST log all simulated attack attempts with
  timestamps, payloads, and responses in the report.

- **FR-024**: System MUST focus on web frontend as the primary
  entry point, then probe backend APIs discovered through frontend
  analysis.

#### Cross-Cutting

- **FR-025**: System MUST use sub-agents for parallelizable analysis
  tasks (concurrent CVE lookup, code pattern scanning, git history
  audit).

- **FR-026**: System MUST generate all reports as Markdown files in
  `./security-report/` with consistent naming and structure.

- **FR-027**: System MUST redact sensitive values discovered during
  analysis in all report output.

- **FR-028**: Reports MUST be written in the language configured
  during `vulchk init`. Security terms (CVE, XSS, CSRF, etc.)
  MUST remain in English with parenthetical translations where
  the report language is not English.

### Key Entities

- **CLI Tool (`vulchk`)**: An npm package providing the `vulchk`
  command for project initialization and management.

- **Config (`.vulchk/config.json`)**: Project-level configuration
  storing report language and other settings.

- **Skill**: A self-contained Claude Code slash command defined in
  `.claude/skills/<name>/SKILL.md` that orchestrates analysis.

- **Sub-Agent**: A Claude Code agent defined in
  `.claude/agents/<name>.md` used for parallelizable analysis tasks.

- **Security Report**: A Markdown document in `./security-report/`
  containing findings, evidence, severity ratings, and remediation.

- **Attack Plan**: A structured plan presented to the user before
  hack simulation, listing targets, techniques, and expected scope.

- **Finding**: A single identified vulnerability or risk with
  severity, evidence, references, and remediation steps.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `vulchk init` completes in under 30 seconds and
  produces a valid `.vulchk/config.json` with all required fields.

- **SC-002**: Running `/vulchk.codeinspector` on a project with known
  vulnerabilities detects at least 80% of intentionally planted
  issues.

- **SC-003**: Running `/vulchk.hacksimulator` against a target
  produces a report with zero requests sent before user approval of
  the attack plan.

- **SC-004**: All generated reports contain severity ratings,
  evidence, and remediation steps for every finding.

- **SC-005**: Sensitive values (API keys, passwords) are never
  written in plaintext in any report output.

- **SC-006**: Sub-agent parallelization reduces total analysis time
  compared to sequential execution for projects with more than 50
  source files.

- **SC-007**: When ratatosk-cli is not installed, the tool clearly
  informs the user and falls back gracefully without crashing.

- **SC-008**: Reports are generated in the language configured
  during `vulchk init`.

## Assumptions

- Users run this tool within Claude Code CLI with access to Bash,
  Read, Grep, Glob, WebFetch, WebSearch, and Task (sub-agent) tools.

- Target projects are git repositories with recognizable project
  configuration files.

- For hack simulation, the target application is running and
  accessible via HTTP/HTTPS.

- Users have explicit authorization to perform security testing on
  any targets they specify.

- ratatosk-cli is an optional dependency; browser-based testing is
  degraded but functional without it.

- The CLI tool (`vulchk`) is built with Node.js and uses enquirer
  for interactive terminal prompts.

- Primary target project types are web applications (frontend +
  optional co-located backend) and standalone API servers.

## Clarification Log

| # | Question | Decision | Date |
|---|----------|----------|------|
| C1 | Language/framework scope | Node.js, React/Next.js, FastAPI specialized; generic for all others. Next.js includes Vercel deployment checks. | 2026-03-01 |
| C2 | Default attack intensity | User selects each run (passive/active/aggressive), not configured globally | 2026-03-01 |
| C3 | Report language | Configured during `vulchk init` (CLI tool, not slash command). Security terms stay in English. | 2026-03-01 |
| C4 | Architecture | npm CLI tool → `vulchk init` sets up Claude Code skills/agents → slash commands available | 2026-03-01 |
| C5 | Init config items | Report language (required). Built with Node.js + enquirer. | 2026-03-01 |
| C6 | codeinspector plan flow | Display plan, auto-proceed without approval (non-destructive) | 2026-03-01 |
| C7 | Project type scope | Web (frontend main) + API. Co-located backend also analyzed. | 2026-03-01 |
