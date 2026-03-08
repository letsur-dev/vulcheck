# Requirements Checklist: VulChk Security Analysis Toolkit

## CLI Tool & Initialization

- [ ] FR-001: npm package with `vulchk` CLI command
- [ ] FR-002: `vulchk init` with enquirer wizard (report language)
- [ ] FR-003: Template copy to `.claude/skills/` and `.claude/agents/`

## Code Inspector

- [ ] FR-004: Tech stack detection from config files
- [ ] FR-005: Specialized rules (Node.js, Next.js+Vercel, FastAPI) + generic
- [ ] FR-006: CVE lookup for dependency versions
- [ ] FR-007: OWASP Top 10 pattern scanning
- [ ] FR-008: .gitignore verification for secret files
- [ ] FR-009: Git history secrets scanning
- [ ] FR-010: Dockerfile and K8s manifest analysis
- [ ] FR-011: Memory safety issue scanning
- [ ] FR-012: Cryptographic practice validation
- [ ] FR-013: Auth/authz pattern validation
- [ ] FR-014: Analysis plan display + auto-proceed
- [ ] FR-015: Co-located frontend+backend analysis

## Hack Simulator

- [ ] FR-016: `/vulchk.hacksimulator` slash command skill
- [ ] FR-017: Optional URL argument with local/URL prompt
- [ ] FR-018: Per-run intensity selection (passive/active/aggressive)
- [ ] FR-019: Attack plan display + user approval
- [ ] FR-020: Playwright detection and install prompt
- [ ] FR-021: Multi-vector testing (browser/fetch/API)
- [ ] FR-022: Prior codeinspector report leverage
- [ ] FR-023: Attack attempt logging with timestamps
- [ ] FR-024: Frontend-first entry point strategy

## Cross-Cutting

- [ ] FR-025: Sub-agent parallelization
- [ ] FR-026: Markdown reports in `./security-report/`
- [ ] FR-027: Sensitive value redaction
- [ ] FR-028: Configurable report language with English security terms

## Success Criteria

- [ ] SC-001: `vulchk init` < 30s with valid config
- [ ] SC-002: 80%+ detection rate on known vulnerabilities
- [ ] SC-003: Zero pre-approval requests in hack simulator
- [ ] SC-004: No plaintext secrets in reports
- [ ] SC-005: Parallel analysis faster than sequential
- [ ] SC-006: Graceful Playwright fallback
- [ ] SC-007: Graceful Playwright absence handling
- [ ] SC-008: Reports in configured language
