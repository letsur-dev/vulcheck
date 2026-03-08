# SecureVibes 경쟁사 분석

## 1. 개요

| 항목 | 내용 |
|------|------|
| **프로젝트** | [SecureVibes](https://github.com/anshumanbh/securevibes) |
| **설명** | "바이브 코딩" 시대의 앱을 보호하는 AI 기반 멀티 에이전트 보안 시스템 |
| **제작자** | Anshuman Bhartiya |
| **라이선스** | AGPL-3.0 |
| **GitHub Stars** | ~252 (2026-03 기준) |
| **Forks** | ~57 |
| **최초 릴리스** | 2025년 10월 5일 (v0.1.1) |
| **최신 버전** | v0.4.0 (2025년 2월 24일) |
| **커밋 수** | 257+ |
| **언어** | Python |
| **패키지** | PyPI (`pip install securevibes`) |
| **공식 사이트** | [securevibes.ai](https://www.securevibes.ai/) |
| **활동 수준** | 활발 -- 4개월 만에 v0.1 -> v0.4, 기능 빠르게 추가 중 |

SecureVibes는 Replit, Bolt, Lovable, v0 등 AI 기반 코딩 플랫폼에서 빠르게 만들어진 앱의 보안 취약점을 찾기 위해 설계되었다. Anthropic Claude AI를 활용한 멀티 에이전트 아키텍처가 핵심이다.

---

## 2. 아키텍처

### 에이전트 구조 (5개)

SecureVibes는 **4개 필수 에이전트 + 1개 선택 에이전트(DAST)**로 구성된 순차 파이프라인을 사용한다.

```
Codebase
  |
  v
[Phase 1] Assessment Agent     --> SECURITY.md
  |
  v
[Phase 2] Threat Modeling Agent --> THREAT_MODEL.json
  |
  v
[Phase 3] Code Review Agent    --> VULNERABILITIES.json
  |
  v
[Phase 4] Report Generator     --> scan_results.json
  |
  v (선택)
[Phase 5] DAST Agent           --> DAST_VALIDATION.json
```

### 각 에이전트의 역할

| Phase | 에이전트 | 역할 | 도구 | 출력물 |
|-------|---------|------|------|--------|
| 1 | **Assessment Agent** (Architect) | 코드베이스 아키텍처 매핑: 데이터 흐름, 인증 메커니즘, 외부 의존성, 민감 데이터 경로, 진입점, 기술 스택, 기존 보안 제어 분석 | Read, Grep, Glob, LS (읽기 전용) | `SECURITY.md` |
| 2 | **Threat Modeling Agent** (Strategist) | STRIDE 기반 위협 분석. 실제 아키텍처에 기반한 구체적 위협 식별 (일반적 보안 조언이 아님) | SECURITY.md 입력 | `THREAT_MODEL.json` (위협 ID, 제목, STRIDE 카테고리, 심각도, 영향 컴포넌트, 공격 시나리오, CWE ID, 완화 전략 포함) |
| 3 | **Code Review Agent** (Validator) | 위협 모델의 가설을 코드에서 실제로 검증. 증거 기반 검증으로 false positive 제거 | SECURITY.md + THREAT_MODEL.json 입력 | `VULNERABILITIES.json` (정확한 파일 경로, 라인 번호, 코드 스니펫, 악용 가능성 설명, CWE 매핑, 수정 가이드 포함) |
| 4 | **Report Generator** (Compiler) | 형식 표준화, 메타데이터 보강, 일관성 검증 | VULNERABILITIES.json 입력 | `scan_results.json` |
| 5 | **DAST Agent** (선택) | 실행 중인 앱에 대한 동적 보안 테스트. HTTP 기반 검증, 테스트 계정 통합 | HTTP 요청, 스킬 시스템 | `DAST_VALIDATION.json` |

### 실행 모델

- **순차 실행**: 각 에이전트가 이전 에이전트의 출력을 입력으로 받아 "진보적 정제(progressive refinement)"를 수행
- **파일 기반 통신**: 에이전트 간 통신은 JSON/마크다운 파일을 통해 이루어짐. 제작자는 "파일 기반 통신이 자연어 파싱보다 훨씬 신뢰할 수 있다"고 언급
- **DAST 스킬**: v0.4.0에서 6개 인젝션 스킬 추가 (SQL, NoSQL, XSS, XXE, Command Injection, SSRF)

### 설계 철학

> "하나의 에이전트에게 아키텍트, 위협 모델러, 보안 감사자 역할을 동시에 맡기고 있었다. 인간 보안 팀은 그렇게 일하지 않는다. AI도 그래야 할 이유가 없다."

---

## 3. 기능 범위

### 3.1 SAST (정적 분석)

**있음 -- 핵심 기능**

3단계 접근법으로 정적 분석 수행:
1. 아키텍처 컨텍스트 구축 (Assessment)
2. 위협 가설 생성 (Threat Modeling)
3. 코드에서 증거 기반 검증 (Code Review)

탐지 가능한 취약점 유형:
- API 키 노출
- Path Traversal
- JSON 유효성 검사 미흡
- Race Condition
- Symlink Traversal
- 프롬프트 인젝션 방어 미흡
- 모델 다운그레이드 공격
- 하드코딩된 자격 증명
- 입력 유효성 검사 미흡
- 인증 우회
- SQL Injection
- 도구 매개변수 유효성 검사 미흡

### 3.2 DAST (동적 분석)

**있음 -- 선택적 (v0.3.1부터)**

- 실행 중인 앱에 대상 URL을 지정하여 HTTP 기반 동적 테스트 수행
- 테스트 계정 통합 지원
- v0.4.0에서 6개 인젝션 스킬 추가: SQL Injection, NoSQL Injection, XSS, XXE, Command Injection, SSRF
- Claude Agent Skills 시스템을 활용

### 3.3 SCA (의존성 분석)

**없음 (명시적 기능으로는 없음)**

별도의 SCA 에이전트나 의존성 취약점 DB 조회 기능은 문서에서 확인되지 않음. Assessment Agent가 의존성 목록을 파악하지만, CVE 데이터베이스 조회까지는 하지 않는 것으로 보임.

### 3.4 Secrets 스캔

**부분적**

Code Review Agent가 코드 리뷰 과정에서 하드코딩된 자격 증명, API 키 노출 등을 탐지하지만, 전용 secrets 스캐너 에이전트는 없음. Git 이력 기반 secrets 스캔도 별도로 없음.

### 3.5 Container / IaC 스캔

**없음**

컨테이너 이미지 보안 분석이나 IaC (Terraform, CloudFormation 등) 보안 검사 기능은 없음.

---

## 4. LLM 사용 방식

### 모델

- **기본 LLM**: Anthropic Claude (Sonnet이 기본값)
- **Claude Agent SDK** 기반 오케스트레이션
- 세 가지 모델 테스트 결과:

| 모델 | 발견 취약점 | 비용 | 평가 |
|------|-----------|------|------|
| Claude Haiku | 2개 | $0.15 | 커버리지 부족 |
| Claude Sonnet | 16-17개 | $2.14-$3.44 | 최적 균형 |
| Claude Opus | 12개 | $7.64 | 비용 대비 성능 낮음 |

### 모델 선택 우선순위 (3단계)

1. 에이전트별 환경 변수 (최우선)
2. CLI 플래그
3. 기본값 "sonnet"

### 인증 방식

- **세션 기반**: Claude CLI 인증 (구독자용, 비용 효율적)
- **API 키 기반**: `ANTHROPIC_API_KEY` 환경 변수 (종량제)

### 컨텍스트 관리

- Claude Agent SDK의 자동 컨텍스트 관리 및 압축 기능 활용
- 파일 기반 통신으로 에이전트 간 컨텍스트 전달 (JSON/마크다운 산출물)
- 스트리밍 이벤트: `PreToolUse`, `PostToolUse`, `SubagentStop` 훅을 통한 실시간 진행 상황 업데이트
- 권한 모드: `permission_mode="default"`

### 향후 계획

- DSPy 같은 프로그래밍 방식 프롬프트 최적화 도입 고려
- 멀티 모델 지원 (Claude 외 다른 LLM, IP 민감 환경을 위한 로컬 모델)

---

## 5. OWASP Top 10 커버리지

SecureVibes는 OWASP Top 10을 명시적으로 체크리스트로 사용하지는 않지만, STRIDE 위협 모델링을 통해 간접적으로 많은 항목을 커버한다.

| OWASP Top 10 (2021) | 커버 여부 | 방법 |
|---------------------|---------|------|
| A01: Broken Access Control | O | STRIDE Elevation of Privilege + Code Review |
| A02: Cryptographic Failures | △ | Code Review에서 탐지 가능하나 전용 검사 없음 |
| A03: Injection | O | SAST + DAST 스킬 (SQL, NoSQL, XSS, XXE, Command Injection) |
| A04: Insecure Design | O | STRIDE 전체 + Assessment Agent 아키텍처 분석 |
| A05: Security Misconfiguration | △ | Code Review에서 부분 탐지 |
| A06: Vulnerable Components | X | SCA 기능 없음, 의존성 CVE 조회 미지원 |
| A07: Auth Failures | O | STRIDE Spoofing + Code Review |
| A08: Software/Data Integrity | △ | STRIDE Tampering에서 부분 커버 |
| A09: Logging & Monitoring | O | STRIDE Repudiation에서 감사/로깅 갭 탐지 |
| A10: SSRF | O | DAST 스킬에 SSRF 포함 |

**O** = 커버, **△** = 부분 커버, **X** = 미커버

---

## 6. 차별화 요소

### 6.1 STRIDE 위협 모델링

가장 큰 차별화 포인트. 대부분의 SAST 도구가 패턴 매칭에 의존하는 반면, SecureVibes는 **먼저 아키텍처를 이해하고, STRIDE로 위협을 체계적으로 식별한 후, 코드에서 검증**하는 3단계 접근법을 사용한다. STRIDE는 에이전트가 특정 취약점 유형(주로 인젝션)에 과도하게 집중하는 것을 방지한다.

### 6.2 SECURITY.md 자동 생성

Assessment Agent가 프로젝트의 보안 아키텍처를 SECURITY.md 파일로 자동 문서화한다. 이 파일은 이후 분석의 컨텍스트로도 사용되며, 프로젝트 보안 문서로서의 가치도 있다.

### 6.3 에이전틱 앱 감지

코드에서 LLM API 호출이나 에이전트 프레임워크 사용을 자동으로 감지하고, 해당하는 경우 OWASP ASI (Agentic Security Issues) 위협을 위협 모델에 필수 포함시킨다. `--agentic` / `--no-agentic` 플래그로 오버라이드 가능.

### 6.4 PR Review 워크플로우

v0.4.0에서 추가. 기존 스캔 산출물(`.securevibes/`)과 PR diff를 비교하여 증분 보안 리뷰 수행:
- 브랜치/커밋 범위 비교
- 패치 파일 리뷰
- 저위험 diff(문서, 테스트, 설정만 변경)에 대한 자동 트리아지로 예산 절감
- PR_VULNERABILITIES.json 미생성 시 실패로 처리 (fail-closed)

### 6.5 증거 기반 검증

단순 패턴 매칭이 아닌, 각 취약점에 대해 정확한 파일 경로, 라인 번호, 코드 스니펫, 악용 가능성 설명을 요구하여 false positive를 줄인다.

---

## 7. 지원 언어

11개 언어 지원:

1. Python
2. JavaScript
3. TypeScript
4. Go
5. Ruby
6. Java
7. PHP
8. C#
9. Rust
10. Kotlin
11. Swift

언어별 자동 감지 및 프로젝트 특정 제외 패턴 적용 (예: `node_modules/` for JS, `venv/` for Python).

---

## 8. 출력물

| 산출물 | 형식 | 에이전트 | 설명 |
|--------|------|---------|------|
| `SECURITY.md` | Markdown | Assessment | 프로젝트 보안 아키텍처 문서 |
| `THREAT_MODEL.json` | JSON | Threat Modeling | STRIDE 기반 위협 목록 |
| `VULNERABILITIES.json` | JSON | Code Review | 검증된 취약점 상세 정보 |
| `DAST_VALIDATION.json` | JSON | DAST | 동적 테스트 결과 |
| `scan_results.json` | JSON | Report Generator | 통합 스캔 결과 |
| `scan_report.md` | Markdown | Report Generator | 마크다운 리포트 (기본 경로: `.securevibes/`) |

- 터미널 테이블 출력 지원
- 심각도 필터링 (critical, high, medium, low)
- CWE 분류 포함

---

## 9. CI/CD 통합

### 지원 여부

**있음** (v0.4.0부터 본격적)

### 기능

- **PR Review**: 브랜치/커밋 비교, 패치 파일 리뷰, 마지막 스캔 이후 커밋 추적
- **산출물 기반 워크플로우**: `.securevibes/` 디렉토리에 산출물 저장, 이전 결과와 비교
- **예산 제어**: CLI 플래그로 PR 리뷰 예산 오버라이드 가능
- **자동 트리아지**: 저위험 diff에 대해 예산 자동 절감
- **서브에이전트 실행**: 비용 최적화를 위한 서브에이전트 활용
- **안전 모델**: 격리된 CI 러너 권장, 프로덕션 자격 증명 접근 방지

### 제한

- GitHub Actions 전용 예제나 공식 액션은 아직 제공되지 않는 것으로 보임
- CI 환경에서의 Claude API 키 관리 필요

---

## 10. VulChk와의 비교

### VulChk에 있고 SecureVibes에 없는 것

| 기능 | VulChk | SecureVibes |
|------|--------|-------------|
| **SCA (의존성 CVE 조회)** | O -- OSV API 연동 전용 에이전트 | X -- 의존성 아키텍처 파악은 하지만 CVE DB 조회 없음 |
| **전용 Secrets Scanner** | O -- 전용 에이전트 (haiku), .gitignore 검증 포함 | △ -- Code Review 과정에서 부분 탐지 |
| **Git History Secrets 스캔** | O -- 전용 에이전트, `git log -p -S`로 15+ 패턴 검색 | X |
| **Container/IaC 보안 분석** | O -- 전용 에이전트, Dockerfile + CI/CD 파이프라인 분석 | X |
| **병렬 실행** | O -- codeinspector 5개 에이전트 동시 실행 | X -- 순차 실행만 |
| **브라우저 기반 DAST** | O -- Playwright 통한 브라우저 테스트 (hacksimulator) | X -- HTTP 기반만 |
| **다국어 리포트** | O -- en/ko 지원 | X -- 영어만 |
| **증분 스캔** | O -- 커밋 해시 기반 diff 증분 업데이트 | O -- v0.4.0부터 |
| **민감값 마스킹** | O -- 체계적 마스킹 규칙 | 불분명 |
| **Zero-config 설치** | O -- `vulchk init` 한 명령으로 완료 | O -- `pip install securevibes` |

### SecureVibes에 있고 VulChk에 없는 것

| 기능 | SecureVibes | VulChk |
|------|-------------|--------|
| **STRIDE 위협 모델링** | O -- 전용 에이전트, 체계적 6개 위협 카테고리 | X |
| **SECURITY.md 자동 생성** | O -- 프로젝트 보안 아키텍처 문서화 | X |
| **THREAT_MODEL.json** | O -- 구조화된 위협 모델 산출물 | X |
| **에이전틱 앱 감지** | O -- LLM API/에이전트 프레임워크 자동 감지, OWASP ASI 위협 포함 | X |
| **PR Review 워크플로우** | O -- diff 기반 증분 보안 리뷰, 자동 트리아지 | X |
| **CWE 매핑** | O -- 각 취약점에 CWE ID 태깅 | X (일부 에이전트에서 부분적) |
| **비용 추적/최적화** | O -- 모델별 비용 비교, 예산 제어 | X |
| **독립 실행** | O -- 독립 CLI 도구 | X -- Claude Code 내부에서만 실행 |
| **JSON 구조화 출력** | O -- VULNERABILITIES.json, THREAT_MODEL.json 등 | X -- 마크다운 리포트만 |

### 접근 방식의 근본적 차이

| 차원 | VulChk | SecureVibes |
|------|--------|-------------|
| **실행 환경** | Claude Code 내부 플러그인 (스킬/에이전트 파일) | 독립 Python CLI (Claude Agent SDK 사용) |
| **분석 방법론** | **도구 중심** -- 각 에이전트가 특정 보안 도구/기법에 특화 (SCA, secrets, container 등) | **방법론 중심** -- STRIDE 위협 모델링 기반 체계적 분석 |
| **에이전트 전략** | **병렬 전문가** -- 5개 에이전트가 독립적으로 병렬 실행, 각자 다른 영역 담당 | **순차 파이프라인** -- 4개 에이전트가 순서대로 실행, 이전 결과를 정제 |
| **DAST** | **브라우저 포함** -- planner가 시나리오 설계, executor가 HTTP + 브라우저로 공격 실행. 사용자 승인 게이트 있음 | **HTTP 전용** -- 스킬 기반 인젝션 테스트 (6가지) |
| **출력** | 마크다운 리포트 (사람이 읽기 좋음) | JSON + 마크다운 (프로그래밍적 처리 가능) |
| **비용 모델** | Claude Code 구독에 포함 | 별도 API 비용 ($2-8/스캔) 또는 Claude 구독 |
| **설치** | `vulchk init` -> Claude Code에서 슬래시 명령어 실행 | `pip install securevibes` -> CLI 실행 |
| **타겟 사용자** | Claude Code를 이미 사용하는 개발자 | 독립적인 보안 스캔이 필요한 개발자/팀 |

### 핵심 경쟁 포인트

1. **VulChk 강점**: 더 넓은 보안 영역 커버리지 (SCA + Secrets + Container + Git History), 병렬 실행으로 빠른 속도, Claude Code 생태계 내 자연스러운 통합, 브라우저 기반 DAST
2. **SecureVibes 강점**: 체계적 위협 모델링 (STRIDE), 독립 실행 가능, 구조화된 JSON 출력, PR Review 워크플로우, 에이전틱 앱 보안, 더 높은 커뮤니티 인지도
3. **공통 과제**: LLM 비결정성으로 인한 결과 일관성, 실행 비용, false positive 관리

---

## 참고 자료

- [GitHub Repository](https://github.com/anshumanbh/securevibes)
- [공식 사이트](https://www.securevibes.ai/)
- [소개 블로그 Part 1](https://www.anshuman.ai/posts/securevibes-intro)
- [아키텍처 블로그 Part 2](https://www.anshuman.ai/posts/securevibes-part2)
- [자체 스캔 결과 Part 3](https://www.anshuman.ai/posts/securevibes-part3)
- [CyberSecurityNews 기사](https://cybersecuritynews.com/securevibes/)
- [GitHub Releases](https://github.com/anshumanbh/securevibes/releases)
