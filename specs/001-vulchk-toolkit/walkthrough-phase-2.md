# Walkthrough: Phase 2 - Code Inspector Skill

**생성일**: 2026-03-01
**커밋 수**: 1

## 요약

`/vulchk.codeinspector` 스킬과 5개 서브에이전트를 구현했습니다. 스킬은
기술 스택 감지 → 분석 계획 표시 → 5개 에이전트 병렬 실행 → 결과 병합 →
리포트 생성 흐름을 따릅니다. 에이전트들은 각각 CVE 조회, OWASP Top 10
패턴 스캔, 시크릿 노출 검사, git 히스토리 감사, 컨테이너 보안 분석을
담당합니다.

## 변경된 파일

| 상태 | 파일 | 설명 |
|------|------|------|
| M | src/templates/skills/vulchk-codeinspector/SKILL.md | 전체 분석 플로우 구현 |
| M | src/templates/agents/vulchk-dependency-auditor.md | CVE 조회 에이전트 |
| M | src/templates/agents/vulchk-code-pattern-scanner.md | OWASP Top 10 패턴 스캐너 |
| M | src/templates/agents/vulchk-secrets-scanner.md | 시크릿 노출 스캐너 |
| M | src/templates/agents/vulchk-git-history-auditor.md | Git 히스토리 감사 |
| M | src/templates/agents/vulchk-container-security-analyzer.md | 컨테이너 보안 분석 |

## 상세 변경 내역

### SKILL.md (Code Inspector)
**목적**: 메인 오케스트레이터. 기술 스택 감지 → 에이전트 병렬 실행 → 리포트 생성.

주요 구성:
- Step 0: config 읽기 (리포트 언어)
- Step 1: 기술 스택 감지 (Glob으로 config 파일 탐색)
- Step 2: 5개 에이전트 병렬 실행 (Task tool)
- Step 3: 결과 병합, 중복 제거, 심각도 정렬
- Step 4: 리포트 생성 (`./security-report/codeinspector-{timestamp}.md`)
- Step 5: 사용자에게 요약 표시

### dependency-auditor
**목적**: 패키지 매니페스트에서 의존성 추출 → WebSearch로 CVE 조회.
지원: package.json, requirements.txt, go.mod, Cargo.toml, pyproject.toml 등.

### code-pattern-scanner
**목적**: OWASP Top 10 (A01~A10) 코드 패턴을 Grep으로 탐색.
프레임워크별 특화 규칙:
- Express: helmet, CORS, child_process, eval
- Next.js: NEXT_PUBLIC_ 시크릿 노출, API route 인증, middleware 보안, CVE-2025-29927
- FastAPI: CORS 와일드카드, Depends() 누락, 원시 SQL, Pydantic 미사용

### secrets-scanner
**목적**: .gitignore 검증 + 소스코드 내 하드코딩된 시크릿 탐지.
패턴: AWS 키, GitHub 토큰, Stripe 키, OpenAI 키, Slack 토큰, 비밀번호 할당, 프라이빗 키, DB 연결 문자열.

### git-history-auditor
**목적**: `git log -p -S` 를 활용해 과거 커밋에서 삭제되었지만 히스토리에 남은 시크릿 탐지.

### container-security-analyzer
**목적**: Dockerfile/docker-compose/K8s YAML 분석.
체크: latest 태그, root 실행, privileged 모드, 리소스 제한 누락, NetworkPolicy 부재 등.

## 주요 결정 사항

- **결정**: SKILL.md에서 에이전트를 병렬 실행
  - **이유**: 5개 분석이 독립적이므로 병렬 실행으로 분석 시간 단축
  - **고려한 대안**: 순차 실행 → 대형 레포에서 10분+ 소요 가능

- **결정**: code-pattern-scanner에 프레임워크별 체크 통합
  - **이유**: 별도 에이전트로 분리하면 에이전트 수가 과도해짐
  - **고려한 대안**: express-checker, nextjs-checker 등 별도 에이전트 →
    관리 복잡성 증가

- **결정**: CVE-2025-29927 (Next.js middleware bypass) 명시적 포함
  - **이유**: 최신 고위험 취약점으로 Next.js 사용자에게 중요

## 작업 메모리 노트

> - 에이전트 출력 형식이 통일되어 있어야 SKILL.md의 병합 로직이 동작함
>   (각 에이전트의 Finding 형식: `### {PREFIX}-{NNN}: {title}`)
> - secrets-scanner의 시크릿 패턴은 gitleaks/trufflehog 기반
> - container-security-analyzer는 Helm 차트의 values.yaml 오버라이드 가능성을 고려해
>   findings에 주석 추가
> - Phase 4에서 i18n 관련 리포트 섹션 헤더 번역 추가 예정

## 커밋

| 해시 | 메시지 |
|------|--------|
| 562d286 | feat: implement code inspector skill with 5 sub-agents |
