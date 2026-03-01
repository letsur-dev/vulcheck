# Tasks: VulChk Security Analysis Toolkit

**Input**: Design documents from `specs/001-vulchk-toolkit/`
**Prerequisites**: plan.md (required), spec.md (required)

---

## Phase 1: CLI Foundation ✅

> **Purpose**: npm package with `vulchk init` command that copies
> templates into a project and creates config.
> **Goal**: `vulchk init` runs, creates `.vulchk/config.json` and
> placeholder skill/agent files.

**Description**: Set up the Node.js project structure, implement
the `vulchk init` command with enquirer-based interactive prompts,
and create the template copying logic.

**Deliverables**:
- `package.json` with bin entry
- `bin/vulchk.js` (shebang entry point)
- `src/index.js` (commander CLI setup)
- `src/commands/init.js` (enquirer wizard + file copy)
- `src/utils/file-ops.js` (template copy helper)
- `src/templates/config.json` (default config)
- Empty placeholder `SKILL.md` and agent `.md` files in templates

**Acceptance**:
- `npm link && vulchk init` runs in a test directory
- Interactive prompt asks for report language
- `.vulchk/config.json` is created with selected language
- `.claude/skills/` and `.claude/agents/` directories are populated
- Running `vulchk init` again detects existing config and offers
  reconfigure/skip

---

## Phase 2: Code Inspector Skill ✅

> **Purpose**: Full `/vulchk.codeinspector` SKILL.md with all
> analysis instructions and sub-agent orchestration.
> **Goal**: Running the slash command in Claude Code produces a
> comprehensive security report.

**Description**: Write the codeinspector SKILL.md with detailed
instructions for tech stack detection, analysis plan display,
and sub-agent dispatch. Write all 5 sub-agent files used by the
code inspector.

**Deliverables**:
- `src/templates/skills/vulchk-codeinspector/SKILL.md`
- `src/templates/agents/vulchk-dependency-auditor.md`
- `src/templates/agents/vulchk-code-pattern-scanner.md`
- `src/templates/agents/vulchk-secrets-scanner.md`
- `src/templates/agents/vulchk-git-history-auditor.md`
- `src/templates/agents/vulchk-container-security-analyzer.md`

**Acceptance**:
- SKILL.md has correct YAML frontmatter (name, description,
  allowed-tools)
- Skill instructions cover: tech stack detection, CVE lookup,
  OWASP Top 10 patterns, secrets/gitignore checks, git history
  audit, container security, Next.js/Vercel-specific checks,
  co-located frontend+backend analysis
- Sub-agents have clear scopes and can run in parallel via Task tool
- Report output follows data-model.md structure
- Analysis plan is displayed and auto-proceeds

---

## Phase 3: Hack Simulator Skill ✅

> **Purpose**: Full `/vulchk.hacksimulator` SKILL.md with attack
> planning, ratatosk-cli integration, and multi-vector testing.
> **Goal**: Running the slash command produces a penetration test
> report after user-approved attack plan execution.

**Description**: Write the hacksimulator SKILL.md with instructions
for URL/no-URL flows, intensity selection, attack plan generation,
ratatosk-cli detection, multi-vector testing, and attack logging.
Write the 2 sub-agent files for planning and execution.

**Deliverables**:
- `src/templates/skills/vulchk-hacksimulator/SKILL.md`
- `src/templates/agents/vulchk-attack-planner.md`
- `src/templates/agents/vulchk-attack-executor.md`

**Acceptance**:
- Skill handles both URL-provided and no-URL flows
- Intensity selection (passive/active/aggressive) is prompted each run
- ratatosk-cli detection works (`which ratatosk` check)
- If ratatosk missing, shows install message and falls back
- Attack plan is displayed and requires user approval
- Prior codeinspector reports are referenced if available
- All attack attempts are logged with timestamps
- Report output follows data-model.md structure
- Authorization warning displayed for external targets

---

## Phase 4: Report Templates and i18n

> **Purpose**: Ensure reports are generated in the configured
> language with proper formatting.
> **Goal**: Reports respect language config and include all required
> sections.

**Description**: Create report section templates for each language,
integrate language selection into skill instructions, ensure
security terms remain in English with translations.

**Deliverables**:
- Report section templates embedded in skill instructions
  (en/ko/ja variations)
- Updated SKILL.md files with i18n-aware report generation
  instructions
- Redaction patterns for sensitive data in skill instructions

**Acceptance**:
- Reports generated in configured language
- Security terms (CVE, XSS, CSRF) stay in English
- Sensitive values are redacted in all report output
- Report filenames follow `{type}-{timestamp}.md` pattern

---

## Phase 5: Testing and Polish

> **Purpose**: Validate end-to-end functionality and polish UX.
> **Goal**: Tool is ready for npm publish.

**Description**: Write unit tests for CLI init command, validate
skill and agent template correctness, add error handling, update
package.json for publishing.

**Deliverables**:
- `tests/init.test.js` (init command tests)
- `tests/templates.test.js` (template validation)
- Updated `package.json` (version, description, keywords, repo)
- `.gitignore` update (node_modules, etc.)
- `README.md` if not already present

**Acceptance**:
- `npm test` passes all tests
- `vulchk init` handles edge cases (existing config, missing git,
  permission errors)
- All template files have valid YAML frontmatter
- Package can be published via `npm publish`
