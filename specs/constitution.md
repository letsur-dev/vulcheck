<!--
SYNC IMPACT REPORT
Version: 1.1.0
Previous: 1.0.0
Ratified: 2026-03-01

Modified principles:
  - Principle 5 (Defense-in-Depth Analysis): added ratatosk-cli browser requirement
  - Principle 7 (Minimal Footprint): added ratatosk-cli as optional external dependency

Sections added:
  - External Tool Dependencies

Sections added:
  - Core Principles (8 principles)
  - Development Workflow
  - Quality Gates
  - Decision-Making Framework
  - Governance

Templates updated:
  - .spec-mix/active-mission/templates/plan-template.md ✅ No changes needed (Constitution Check section already present)
  - .spec-mix/active-mission/templates/spec-template.md ✅ No changes needed (security requirements expressible via FR fields)
  - .spec-mix/active-mission/templates/tasks-template.md ✅ No changes needed (Security review task in Phase 3 Polish Slice)

Follow-up TODOs: None
-->

# Project Constitution: VulChk

## Core Principles

### 1. Security-First Design

- All analysis logic MUST treat user-supplied input (URLs, file paths,
  command arguments) as untrusted and sanitize before processing.
- The tool itself MUST NOT introduce vulnerabilities; it MUST follow
  the same security standards it audits.
- Sensitive data (API keys, tokens, credentials) discovered during
  analysis MUST be redacted in report output by default.
- All network requests made by the hack simulator MUST be scoped
  exclusively to user-authorized targets.

**Rationale**: A security tool that is itself insecure undermines
user trust and can become an attack vector. Practicing what we
preach is non-negotiable.

### 2. Authorized-Access-Only Execution

- The hack simulator MUST require explicit user confirmation before
  sending any request to a target.
- The tool MUST NOT perform destructive actions (DELETE, DROP, file
  writes on target) unless the user explicitly opts in per session.
- Scan intensity levels (passive, active, aggressive) MUST be clearly
  communicated and user-selectable.
- All simulated attack attempts MUST be logged in the security report
  with timestamps and payloads used.

**Rationale**: Unauthorized penetration testing is illegal in most
jurisdictions. Explicit consent and audit trails protect both the
user and the targets.

### 3. Modular Skill Architecture

- Each feature MUST be exposed as an independent Claude Code slash
  command skill under the `vulchk.*` namespace.
- Skills MUST be self-contained markdown files following the
  `.claude/skills/<name>/SKILL.md` convention.
- Sub-agents MUST be used for parallelizable analysis tasks
  (e.g., CVE lookup, code pattern scan, git history audit run
  concurrently).
- Each skill MUST define clear input parameters, expected output
  format, and error handling behavior.

**Rationale**: Modular design enables users to run individual checks
independently, compose workflows, and extend the tool with new
analysis capabilities without modifying existing skills.

### 4. Structured Reporting

- All analysis results MUST be written to `./security-report/` as
  Markdown files with consistent naming conventions.
- Reports MUST include severity ratings (Critical, High, Medium, Low,
  Informational) for each finding.
- Reports MUST include actionable remediation steps for each
  identified vulnerability.
- Report filenames MUST follow the pattern
  `{analysis-type}-{YYYY-MM-DD-HHmmss}.md` for traceability.

**Rationale**: Consistent, actionable reports enable developers to
prioritize and address vulnerabilities systematically rather than
being overwhelmed by raw findings.

### 5. Defense-in-Depth Analysis

- Code inspection MUST cover multiple security layers: dependency
  vulnerabilities (CVE), code-level flaws (OWASP Top 10), secrets
  exposure, configuration security, and container security.
- The hack simulator MUST test from the frontend entry point inward,
  using multiple attack vectors (browser-based, API calls, direct
  HTTP requests).
- Browser-based site analysis MUST use ratatosk-cli for browser
  automation. If the `ratatosk` command is not recognized, the skill
  MUST prompt the user to install ratatosk-cli and then run
  `ratatosk install --skills` to set up the required Claude Code
  skills and agents.
- Analysis MUST consider the deployment context (Kubernetes, Docker)
  when evaluating container image security and orchestration
  configuration.
- Both static analysis (code reading) and dynamic analysis (runtime
  probing) perspectives MUST be supported.

**Rationale**: Attackers exploit the weakest link. A single-layer
analysis gives false confidence; comprehensive coverage across the
stack provides realistic security posture assessment.

### 6. Plan-Driven Execution

- Both code inspection and hack simulation MUST begin with an
  explicit analysis plan presented to the user before execution.
- The plan MUST list specific checks to perform, tools/techniques
  to use, and estimated scope.
- If a prior code inspection report exists, the hack simulator
  MUST reference it when building its attack plan.
- Users MUST be able to approve, modify, or reject the plan before
  execution proceeds.

**Rationale**: Security analysis without a plan leads to incomplete
coverage and wasted effort. Plan-first execution ensures
thoroughness and gives users visibility into what will happen.

### 7. Minimal Footprint

- The tool MUST NOT install external dependencies or modify the
  target project's files outside of `./security-report/`.
- Analysis MUST rely on Claude Code's built-in tools (Read, Grep,
  Glob, Bash, WebFetch, WebSearch), sub-agents, and ratatosk-cli
  for browser automation (the sole optional external dependency).
- Temporary artifacts (if any) MUST be cleaned up after analysis
  completes.
- The tool MUST NOT require elevated system privileges to operate.

**Rationale**: A security tool that litters the project with
dependencies or artifacts creates maintenance burden and potential
attack surface. Operating within Claude Code's existing capabilities
keeps the tool portable and lightweight.

### 8. Transparent Methodology

- Each analysis technique MUST be documented in the skill file so
  users understand what checks are being performed.
- The tool MUST clearly distinguish between confirmed vulnerabilities,
  potential risks, and informational findings.
- False positive rates MUST be minimized by requiring evidence
  (code snippets, response data) for each finding.
- The tool MUST cite sources (CVE IDs, OWASP references, CWE IDs)
  for identified vulnerability classes.

**Rationale**: Security findings without context and evidence lead
to alert fatigue and mistrust. Transparent methodology enables users
to validate findings and make informed decisions.

## Development Workflow

1. **Specification**: Define the analysis capability as a skill or
   agent with clear input/output contracts.
2. **Planning**: Design the analysis pipeline, identify sub-agent
   decomposition opportunities, and define report structure.
3. **Implementation**: Build skills and agents as markdown files
   with comprehensive instructions and examples.
4. **Validation**: Test against known-vulnerable sample projects
   to verify detection accuracy.
5. **Integration**: Register slash commands and verify end-to-end
   user experience.
6. **Documentation**: Update skill descriptions and usage examples.

## Quality Gates

Before merging to main:
- [ ] All skills produce valid Markdown reports
- [ ] No sensitive data leaks in report output
- [ ] Hack simulator requires explicit user authorization
- [ ] Sub-agent orchestration completes without hanging
- [ ] Reports include severity ratings and remediation steps
- [ ] Skills handle missing/invalid input gracefully

## Decision-Making Framework

When faced with technical choices:

1. Consider security implications first: does this choice reduce
   the attack surface for both the tool and the target?
2. Evaluate user safety: can this action cause unintended harm
   to the target system or violate authorization boundaries?
3. Assess analysis accuracy: does this approach minimize false
   positives while maintaining detection coverage?
4. Review maintainability: can this skill be understood and
   extended by other contributors?
5. Document the decision and rationale in the relevant skill file.

## External Tool Dependencies

### ratatosk-cli (browser automation)

- **Purpose**: Provides browser automation capabilities for the hack
  simulator to interact with target websites (navigation, form
  filling, DOM inspection, network interception, etc.).
- **Required for**: `/vulchk.hacksimulator` browser-based analysis.
- **Detection**: Before browser-based analysis, the skill MUST check
  if the `ratatosk` command is available by running `which ratatosk`.
- **Installation guidance**: If `ratatosk` is not found, the skill
  MUST display the following message and halt browser-based analysis:

  ```
  ratatosk-cli is required for browser-based analysis but was not found.
  Please install ratatosk-cli and then run:

    ratatosk install --skills

  This will set up the necessary Claude Code skills and agents for
  browser automation.
  ```

- **Skill integration**: Once installed, `ratatosk install --skills`
  places a `SKILL.md` at `.claude/skills/ratatosk/SKILL.md` and
  agent files under `.claude/agents/`. The hack simulator MUST
  leverage these ratatosk skills for all browser interactions
  (clicking, typing, navigating, intercepting network requests,
  capturing screenshots, etc.).
- **Fallback**: If the user declines to install ratatosk-cli, the
  hack simulator MUST fall back to non-browser methods only
  (HTTP fetch, curl-style requests, API probing) and clearly note
  in the report that browser-based testing was skipped.

## Governance

**Ratified**: 2026-03-01
**Version**: 1.1.0

### Amendment Process

1. Propose changes via a specification document referencing the
   affected principles.
2. Version changes follow Semantic Versioning:
   - MAJOR: Principle removal, redefinition, or governance change.
   - MINOR: New principle addition or substantial expansion.
   - PATCH: Clarification, wording, or non-semantic improvement.
3. Update all dependent templates and skills after amendment.

### Compliance Review

- Each new skill MUST be reviewed against this constitution before
  merge.
- Quarterly review of all active skills for continued alignment
  with these principles.
