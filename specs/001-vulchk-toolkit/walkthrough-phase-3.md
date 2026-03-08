# Walkthrough: Phase 3 - Hack Simulator Skill

**생성일**: 2026-03-01
**커밋 수**: 1

## 요약

`/vulchk.hacksimulator` 스킬과 2개 서브에이전트(attack-planner, attack-executor)를
구현했습니다. 스킬은 타겟 결정 → 인증 경고 → Playwright 확인 → 강도 선택 →
코드 인스펙터 리포트 참조 → 공격 계획 생성 → 사용자 승인 → 공격 실행 → 리포트
생성 흐름을 따릅니다.

## 변경된 파일

| 상태 | 파일 | 설명 |
|------|------|------|
| M | src/templates/skills/vulchk-hacksimulator/SKILL.md | 전체 모의해킹 플로우 구현 |
| M | src/templates/agents/vulchk-attack-planner.md | 정찰 및 공격 계획 생성 에이전트 |
| M | src/templates/agents/vulchk-attack-executor.md | 공격 실행 및 로깅 에이전트 |
| M | specs/001-vulchk-toolkit/tasks.md | Phase 3 완료 표시 |

## 상세 변경 내역

### SKILL.md (Hack Simulator)
**목적**: 메인 오케스트레이터. 타겟 결정부터 리포트 생성까지 전체 흐름 관리.

주요 구성:
- Step 0: config 읽기 (리포트 언어)
- Step 1: 타겟 결정 — URL 제공 시 직접 사용, 미제공 시 로컬 실행 또는 URL 입력 선택
- Step 2: 인증 경고 — 외부 타겟(localhost가 아닌 경우)에 대해 명시적 허가 확인
- Step 3: Playwright 가용성 확인 (`npx playwright --version` 확인)
- Step 4: 스캔 강도 선택 (passive/active/aggressive) — 매 실행마다 선택
- Step 5: 기존 codeinspector 리포트 참조 (있으면 활용, 없으면 런타임 정찰)
- Step 6: attack-planner 에이전트 실행
- Step 7: 공격 계획 표시 → 사용자 승인 필수 (미승인 시 중단)
- Step 8: attack-executor 에이전트 실행
- Step 9: 리포트 생성 (`./security-report/hacksimulator-{timestamp}.md`)
- Step 10: 사용자에게 요약 표시

### attack-planner
**목적**: 타겟 정찰 + 공격 계획 생성. 패시브 정보 수집만 수행.

주요 기능:
- HTTP 헤더 분석 (서버, 프레임워크, 보안 헤더)
- 기술 스택 핑거프린팅 (robots.txt, sitemap, 에러 페이지)
- CORS 정책 분석
- API 엔드포인트 발견 (Swagger/OpenAPI/GraphQL)
- TLS/SSL 설정 검사
- 소스코드 기반 정찰 (로컬 프로젝트일 경우)
- codeinspector 취약점 → 공격 벡터 매핑
- 강도별 구조화된 공격 계획 생성

강도별 계획 구조:
- **Passive**: 정보 수집 + 설정 평가 (페이로드 전송 없음)
- **Active**: Passive + 인젝션 테스트 + 인증 테스트 + 로직 테스트
- **Aggressive**: Active + 실제 익스플로잇 시도 + 고급 공격 + 사후 검증

### attack-executor
**목적**: 승인된 공격 계획 실행 + 모든 시도 로깅.

주요 기능:
- **패시브 테스트**: 보안 헤더 감사, 쿠키 보안 검사, CORS 테스트, 정보 노출 탐지, TLS 분석
- **액티브 테스트**: XSS 반사 프로빙, SQLi 탐지 (에러/불린/시간 기반), CSRF 토큰 검증, IDOR 테스트, 인증 우회, SSRF 프로빙, HTTP 메서드 테스트, 세션 관리, GraphQL, 파일 업로드
- **공격적 테스트**: SQL 데이터 추출, XSS 익스플로잇, SSRF 심층 탐사, 커맨드 인젝션, JWT 위조, 레이스 컨디션
- 결과 포맷: `HSM-{NNN}` 형식의 상세 취약점 리포트
- 완전한 공격 로그 (타임스탬프, 벡터, 엔드포인트, 페이로드, 상태, 결과)

테스트 벡터 유형:
- `http-fetch`: curl/fetch를 통한 HTTP 요청
- `browser`: Playwright 브라우저 자동화
- `api-probe`: API 엔드포인트 직접 탐사

## 주요 결정 사항

- **결정**: attack-planner와 attack-executor를 순차적으로 실행 (병렬 아님)
  - **이유**: 계획은 사용자 승인을 받아야 하므로 반드시 계획 → 승인 → 실행 순서
  - **고려한 대안**: 정찰과 동시에 일부 테스트 시작 → 사용자 승인 원칙 위배

- **결정**: 강도를 3단계로 구분하고 각 단계에서 실행할 테스트를 명시적으로 정의
  - **이유**: 사용자가 어떤 테스트가 수행되는지 정확히 이해할 수 있어야 함
  - **고려한 대안**: 자동 강도 결정 → 사용자 통제력 감소

- **결정**: 외부 타겟에 대한 인증 경고를 localhost 이외 모든 타겟에 적용
  - **이유**: 무허가 모의해킹은 법적 문제 발생 가능
  - **고려한 대안**: 특정 도메인 화이트리스트 → 유지보수 복잡성

- **결정**: 공격적 테스트에서도 실제 사용자 데이터 추출 금지 (스키마 메타데이터만)
  - **이유**: 보안 도구가 데이터 유출 도구가 되어서는 안 됨

- **결정**: OWASP Testing Guide v4.2 기반의 체계적 테스트 분류
  - **이유**: 업계 표준 방법론 준수로 신뢰성 확보

## 작업 메모리 노트

> - attack-executor의 테스트 페이로드는 모두 "vulchk-" 접두사를 사용하여
>   테스트 데이터를 식별 가능하게 함
> - Playwright가 없어도 HTTP 기반 테스트는 모두 가능 (브라우저 테스트만 스킵)
> - 공격 로그는 모든 시도를 기록 (성공/실패 모두) — 감사 추적성 확보
> - codeinspector 리포트가 있으면 코드 수준 취약점을 공격 벡터로 매핑하여
>   우선순위가 높은 테스트부터 실행
> - Phase 4에서 리포트 섹션 헤더의 i18n 번역 추가 예정
> - WAF/레이트리미터 감지 시 자동으로 요청 빈도 감소 → DoS 방지

## 커밋

| 해시 | 메시지 |
|------|--------|
| 8c16f41 | feat: implement hack simulator skill with attack planner and executor agents |
