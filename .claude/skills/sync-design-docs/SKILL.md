---
name: sync-design-docs
description: "Update design documentation in the design/ folder to reflect code changes. Use after modifying skill templates, agent templates, CLI code, or architecture. Triggers: /sync-design-docs, 'update design docs', 'sync design documents'."
allowed-tools: [Read, Grep, Glob, Edit, Write]
---

# Sync Design Documents

You are updating the developer-facing design documentation in `design/`
to reflect recent code changes. All design documents MUST be written in Korean.

## Step 1: Identify Changed Components

Use Glob and Read to check the current state of:

1. **Skills** — `src/templates/skills/*/SKILL.md`
2. **Agents** — `src/templates/agents/*.md`
3. **CLI** — `src/commands/*.js`, `src/utils/*.js`, `src/index.js`
4. **Config** — `package.json`, `src/templates/config.json`

## Step 2: Read Current Design Docs

Read all design documents:

- `design/architecture.md` — 전체 아키텍처, CLI 구조, 컴포넌트 목록
- `design/codeinspector.md` — Code Inspector 상세 설계, 서브에이전트 알고리즘
- `design/hacksimulator.md` — Hack Simulator 상세 설계, 서브에이전트 알고리즘

## Step 3: Detect Differences

Compare the design docs against the actual code. Look for:

- New or removed agents/skills
- Changed agent tools or frontmatter fields
- Modified algorithms or step sequences
- New API integrations or tool dependencies
- Changed data flow (report format, config fields, etc.)
- New or removed CLI commands or options

## Step 4: Apply Updates

For each discrepancy found, update the relevant design document:

### architecture.md should reflect:
- Component inventory table (skills, agents, prefixes, tools)
- CLI flow diagram
- File operations functions
- External API dependencies
- YAML frontmatter examples

### codeinspector.md should reflect:
- Sequence diagram (sub-agents launched)
- Each sub-agent's algorithm flowchart
- API request/response examples
- Ecosystem mappings
- CVSS severity mappings
- i18n translation references
- Error handling behavior

### hacksimulator.md should reflect:
- Sequence diagram (planner → approval → executor)
- Target determination flow
- Intensity levels and their test categories
- Attack planner algorithm
- Attack executor algorithm (passive/active/aggressive)
- Safety mechanisms
- Codeinspector feedback loop
- Comparison table

## Step 5: Verify Consistency

After updates, verify:

- [ ] All agents listed in architecture.md match files in `src/templates/agents/`
- [ ] All skills listed match files in `src/templates/skills/`
- [ ] Agent prefixes (DEP, CODE, SEC, GIT, CTR, HSM) match actual agent files
- [ ] Tool lists match agent frontmatter
- [ ] Mermaid diagrams reflect actual step sequences
- [ ] No English prose in design docs (technical terms like CVE, OWASP are OK)

## Step 6: Report Changes

Display a summary of what was updated:

```
## 설계 문서 동기화 완료

### 변경된 파일
- design/architecture.md — {변경 내용 요약}
- design/codeinspector.md — {변경 내용 요약}
- design/hacksimulator.md — {변경 내용 요약}

### 변경 사유
- {코드 변경에 따른 구체적 이유}
```

## Rules

- ALL design documents MUST be written in Korean (한국어)
- Technical terms (CVE, XSS, OWASP, CVSS, OSV, API, HTTP, etc.) stay in English
- Mermaid diagram node labels may use English for brevity where needed
- Do NOT change the overall document structure unless necessary
- Keep Mermaid diagrams up-to-date with actual execution flows
- If a new agent or skill was added, add its algorithm section
- If an agent or skill was removed, remove its section
