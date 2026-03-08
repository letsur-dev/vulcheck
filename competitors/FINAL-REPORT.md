# VulChk 경쟁사 분석 최종 리포트

> 작성일: 2026-03-02
> 분석 대상: Aikido Security, OpenAI Codex Security, Claude Code Security, SecureVibes, Snyk Code, Semgrep

---

## 1. 경쟁 환경 요약

### 1.1 경쟁사 포지셔닝 맵

| 도구 | 형태 | 타겟 사용자 | 가격 | 핵심 차별점 |
|------|------|------------|------|-----------|
| **Aikido Security** | SaaS 올인원 플랫폼 | 스타트업 ~ 엔터프라이즈 | Free ~ $1,050+/월 | 9개 스캐너 통합, AI AutoTriage(95% FP 감소), 200+ 에이전트 AI 침투 테스트 |
| **Codex Security** | SaaS 자율 에이전트 | 엔터프라이즈 보안팀 | 미공개 (Private Beta) | GPT-5.3 기반, 탐지→검증→패치 완전 자동화, 커밋 레벨 지속 감시, 샌드박스 검증 |
| **Claude Code Security** | Claude Code 내장 | Enterprise/Team 플랜 | $150+/월 (Premium 시트) | 500+ 취약점 발견 실적, 적대적 자기검증, GitHub Action 네이티브 |
| **SecureVibes** | 독립 Python CLI | 개발자/소규모 팀 | $2-8/스캔 (API 비용) | STRIDE 위협 모델링, 에이전틱 앱 감지, 구조화 JSON 출력, PR Review |
| **Snyk Code** | SaaS + IDE 플러그인 | 개발팀 ~ 엔터프라이즈 | Free ~ Enterprise | 0.08% FP 비율, DeepCode AI Fix(80% 정확도), 5-in-1 플랫폼 |
| **Semgrep** | OSS CLI + SaaS | 개발자 ~ 보안팀 | CE 무료, 상용 유료 | YAML 규칙 투명성, 30+ 언어, 리치어빌리티 분석, Memories 시스템 |
| **VulChk** | Claude Code CLI 플러그인 | 바이브 코더/개인 개발자 | Claude API 비용만 | 제로 설정, 5개 에이전트 병렬, SAST+SCA+DAST+Secrets, 즉시 실행 |

### 1.2 시장 트렌드 (2026)

1. **AI 네이티브 보안 도구의 폭발적 성장** — Aikido($1B 유니콘), Codex Security(GPT-5.3), Claude Code Security(500+ 취약점) 모두 LLM을 핵심 엔진으로 활용
2. **통합 플랫폼 vs 경량 도구의 양극화** — Aikido/Snyk은 올인원, VulChk/SecureVibes는 경량 특화
3. **자동화 수준 심화** — "탐지만" → "탐지+검증+패치" 완전 자동화로 진화
4. **커밋 기반 지속 스캔** — 온디맨드에서 커밋 시점 자동 스캔으로 이동
5. **에이전틱 앱 보안** — LLM/에이전트 기반 앱 급증에 따른 새로운 위협 카테고리 부상

---

## 2. VulChk 기능 갭 분석

### 2.1 전 경쟁사 공통 보유 vs VulChk 미보유 기능

| 기능 | Aikido | Codex Sec. | Claude Code Sec. | SecureVibes | Snyk | Semgrep | VulChk |
|------|--------|-----------|-----------------|-------------|------|---------|--------|
| CWE 매핑 | O | O | O | O | O | O | **X** |
| 자동 수정 제안 | O | O | O | X | O | O | **X** |
| CI/CD 통합 | O | O | O | O | O | O | **X** |
| FP 자동 필터링 | O | O | O | △ | O | O | **X** |
| 구조화 출력(JSON) | O | O | O | O | O | O | **X** |

> **CWE 매핑, 자동 수정 제안, FP 자동 필터링, 구조화 출력은 모든 경쟁사가 보유한 "테이블 스테이크" 기능이다.**

### 2.2 VulChk 고유 강점

| 강점 | 설명 | 경쟁 대응 상황 |
|------|------|--------------|
| **제로 설정** | `npx vulchk` → 슬래시 명령어로 즉시 실행 | SecureVibes만 유사 (`pip install`) |
| **5개 에이전트 병렬 실행** | SCA+Secrets+Code+Container+Git History 동시 분석 | SecureVibes는 순차 실행만 |
| **브라우저 기반 DAST** | Playwright 통한 DOM 기반 XSS 등 테스트 | 경쟁사 중 유일 |
| **사용자 승인 게이트** | attack-planner → 사용자 승인 → executor | Claude Code Security만 유사 (HITL) |
| **무료 접근** | Claude Code 사용자면 누구나 사용 | Claude Code Security는 Enterprise 전용 |
| **다국어 리포트** | 한국어/영어 지원 | 경쟁사 없음 |

---

## 3. 토론 종합: 확장론 vs 집중론

### 3.1 양측 합의 영역 (무조건 도입)

두 관점 모두 다음 4가지는 도입이 필요하다고 합의했다:

| # | 기능 | 확장론자 | 집중론자 | 합의 이유 |
|---|------|--------|--------|---------|
| 1 | **FP 자동 필터링** | 3순위 (High) | 도입 필요 1순위 | 신뢰성의 핵심. 적대적 검증 패스로 구현 가능. 추가 인프라 불필요 |
| 2 | **CWE 매핑** | 4순위 (High) | 조건부 도입 | 프롬프트 한 줄 추가로 구현. 비용 거의 없음. 리포트 전문성 향상 |
| 3 | **에이전틱 앱 보안** | 7순위 (Medium) | 도입 필요 2순위 | 바이브 코더 = AI 앱 개발자. VulChk 핵심 가치 직결 |
| 4 | **증분 리뷰 강화** | 해당 기능 포함 | 도입 필요 3순위 | 기존 아키텍처 위에 구축. 저위험 diff 자동 스킵으로 비용 절감 |

### 3.2 의견 대립 영역

| 기능 | 확장론자 | 집중론자 | 대립점 |
|------|--------|--------|-------|
| **CI/CD 통합** | 1순위 Critical — 자동화 없으면 스킵됨 | 도입 불필요 — 바이브 코더는 CI/CD 안 씀 | 타겟 사용자 정의의 문제 |
| **AutoFix 코드 패치** | 2순위 Critical — MTTR 핵심 | 조건부 — 수정 "방향"만 제안, 코드 자동적용 금지 | AI 패치 신뢰성 우려 |
| **STRIDE 위협 모델링** | 5순위 High — 체계적 빈틈 방지 | 도입 불필요 — 바이브 코더에게 과잉 | 실행 가능성 vs 체계성 |
| **커밋 레벨 감시** | 6순위 High — Shift Everywhere | 도입 불필요 — 토큰 비용 폭발 | 비용 대 가치 |
| **샌드박스 검증** | 8순위 Medium — DAST 안전성 | 조건부 — 기존 curl 프로브 강화 | 인프라 복잡성 |

### 3.3 판정: 균형점 도출

**"바이브 코더 우선, 프로 사용자 확장 가능" 전략을 채택한다.**

핵심 원칙:
- 기본 경험은 제로 설정·즉시 실행을 유지한다 (집중론)
- 테이블 스테이크 기능은 반드시 갖춘다 (확장론)
- 프로 사용자를 위한 기능은 opt-in으로 제공한다 (CI/CD, JSON 출력 등)
- 추가 인프라(Docker, 클라우드 계정)를 요구하는 기능은 후순위로 미룬다

---

## 4. 기능 도입 우선순위 (최종 결정)

### Tier 1 — 즉시 도입 (2026 Q2, 프롬프트 수정 수준)

| # | 기능 | 구현 방법 | 예상 공수 | 근거 |
|---|------|---------|---------|------|
| 1 | **CWE 매핑** | 각 에이전트 프롬프트에 "CWE ID 태깅" 지시 추가 | 1-2일 | 전 경쟁사 보유. 프롬프트 한 줄로 구현. 비용 제로 |
| 2 | **수정 가이드 강화** | 각 에이전트에 "수정 방향 + 코드 예시" 제시 지시 추가 | 3-5일 | 전 경쟁사 보유. 코드 자동적용이 아닌 가이드 수준으로 시작 |
| 3 | **에이전틱 앱 보안** | code-pattern-scanner에 LLM API 패턴 감지 + OWASP ASI 규칙 추가 | 3-5일 | 바이브 코더 = AI 앱 개발자. 핵심 차별화 |
| 4 | **증분 리뷰 개선** | codeinspector에 저위험 diff 자동 스킵 + 신규/해결/변경 섹션 추가 | 2-3일 | 비용 절감 + UX 향상. 기존 아키텍처 활용 |

### Tier 2 — 단기 도입 (2026 Q2-Q3, 프롬프트 + 로직 변경)

| # | 기능 | 구현 방법 | 예상 공수 | 근거 |
|---|------|---------|---------|------|
| 5 | **FP 자동 필터링** | codeinspector 병합 단계에 적대적 검증 패스 추가 + confidence 등급 | 1-2주 | 양측 합의. 신뢰성 핵심. "늑대 소년" 방지 |
| 6 | **리치어빌리티 분석** | dependency-auditor에 취약 함수 사용 여부 Grep 검증 추가 | 1주 | Snyk/Semgrep 검증 완료. SCA FP 98% 감소 가능 |
| 7 | **비용 가시성** | 리포트 말미에 에이전트별 모델·실행 정보 표시 | 2-3일 | 사용자 신뢰. 투명성 확보 |

### Tier 3 — 중기 도입 (2026 Q3-Q4, 새 기능 개발)

| # | 기능 | 구현 방법 | 예상 공수 | 근거 |
|---|------|---------|---------|------|
| 8 | **JSON 출력 옵션** | `--format json` 플래그 추가, 기본은 마크다운 유지 | 1-2주 | CI/CD 연동·자동화 대비. opt-in |
| 9 | **CI/CD 통합 (opt-in)** | `vulchk review --diff` 명령어 + GitHub Action 템플릿 | 3-4주 | 프로 사용자 확장. `vulchk init --ci`로 선택적 설정 |
| 10 | **triage-history 학습** | `.vulchk/triage-history.json`에 사용자 FP 마킹 저장·재활용 | 2주 | Semgrep Memories 패턴. 프로젝트별 학습 |

### Tier 4 — 장기 검토 (2027+, 전략적 판단 필요)

| # | 기능 | 판단 기준 | 비고 |
|---|------|---------|------|
| 11 | STRIDE 위협 모델링 | 프로 사용자 수요 확인 후 결정 | 순차 실행 강제로 병렬 이점 상실 우려 |
| 12 | 샌드박스 검증 | Docker 의존 없는 경량 구현 방안 확보 시 | 기존 curl 프로브 강화가 우선 |
| 13 | 커밋 레벨 감시 | CI/CD 통합 채택률 확인 후 결정 | pre-commit hook 기반 secrets-scanner만 선행 가능 |

---

## 5. Claude Code Security 심층 분석 (코드 레벨)

> 소스 코드 기반 분석: https://github.com/anthropics/claude-code-security-review

### 5.1 실제 구조 해부

**실행 경로가 2개 있다:**

| 경로 | 실행 방식 | 비용 | 현재 상태 |
|------|---------|------|---------|
| **GitHub Action** | `claude` CLI subprocess + Anthropic API (FP 필터) | API 키 과금 (PR당 $3-15) | 공개, 누구나 사용 가능 |
| **슬래시 명령어** `/security-review` | Claude Code 세션 내 실행 | 구독에 포함 (추가 비용 없음) | Claude Code 사용자면 누구나 |

**핵심 발견: GitHub Action은 "무료"가 아니다.**
- `ANTHROPIC_API_KEY` 필수 → API 사용료 별도 발생
- 기본 모델: `claude-opus-4-1-20250805` (가장 비싼 모델)
- FP 필터링 활성화 시 finding마다 추가 API 호출
- 팀에서 하루 10개 PR → 월 $600-4,500 추가 API 비용 가능

**반면 VulChk는 Claude Code 구독 내에서 동작 → 추가 API 비용 없음.** 이것은 명확한 비용 우위.

### 5.2 기능 범위 — 정정: 예상보다 넓다

> **⚠️ 정정 고지 (2026-03-02)**
> 초기 분석에서 GitHub Action 레포(`claude-code-security-review`)의 코드만 보고
> Claude Code Security **제품**의 기능 범위를 과소평가했다.
> GitHub Action의 `findings_filter.py`가 secrets를 "handled by other processes"로 제외한 것은
> **그 Action의 구현 선택**이지, Anthropic의 Claude Code Security 제품 전체의 한계가 아니다.

**Anthropic 공식 페이지에서 확인된 Claude Code Security(제품)의 탐지 범위:**
- Hardcoded secrets & credentials — **공식 탐지 항목**
- Dependency vulnerabilities — **공식 탐지 항목**
- Injection vulnerabilities (SQL, XSS, command injection 등)
- Authentication & authorization issues
- Data exposure risks
- Opus 4.6 기반 다단계 검증 (multi-stage adversarial verification)

```
Claude Code Security(제품)가 실제로 커버하는 것:
✅ SAST (정적 코드 분석) — 핵심 기능
✅ Hardcoded secrets — 공식 지원 확인
✅ Dependency vulnerabilities — 공식 지원 확인
✅ 다단계 적대적 자기검증 — 500+ 실제 취약점 발견 실적

Claude Code Security에 없는 것 (VulChk 고유 영역):
❌ DAST (동적 침투 테스트)
❌ Git history 시크릿 스캔 (과거 커밋 추적)
❌ Container/IaC 보안 분석
❌ 정밀 SCA (OSV API 기반 CVE 조회 vs LLM 추론)
❌ 브라우저 기반 DOM 테스트
❌ 공격 시나리오 설계 + 사용자 승인 게이트
```

**이것은 VulChk에게 부분적 위협이자 부분적 기회이다.**
- SAST + 기본 secrets + 기본 SCA 영역에서는 직접 경쟁 (VulChk 불리)
- DAST, Git history, Container, 정밀 SCA, 공격 시뮬레이션 영역에서는 고유 가치 (VulChk 유리)

### 5.3 탐지 방식 비교

| 항목 | Claude Code Security | VulChk |
|------|---------------------|--------|
| 분석 주체 | 단일 Claude 인스턴스, 1개 프롬프트 | 5개 전문 에이전트 병렬 실행 |
| 분석 범위 | PR diff만 (변경된 코드) | 전체 코드베이스 (+ 증분 가능) |
| 모델 선택 | Opus 4.1 고정 | 에이전트별 최적화 (Haiku/Sonnet) |
| FP 처리 | Hard Rules(정규식 7개) + Claude API 2차 필터 | 에이전트 프롬프트 내 CoT |
| 커스텀 | FP 규칙 파일 + 스캔 카테고리 파일 | 없음 |

### 5.4 위협 재평가 (정정 반영)

| 항목 | 초기 분석 (GitHub Action 기반) | 정정된 평가 (제품 기반) |
|------|---------------------------|---------------------|
| **위협 수준** | 중간 위협 (기능 좁음) | **높은 위협** — SAST + secrets + SCA 공식 지원 확인 |
| **기능 범위** | 순수 SAST 전용 | SAST + hardcoded secrets + dependency 취약점까지 커버 |
| **기능 확장 가능성** | SCA/DAST 흔적 없음 | 이미 secrets/SCA 포함. DAST는 여전히 없음 |
| **비용 경쟁력** | Enterprise 전용 비쌈 | Enterprise/Team 플랜 내 포함 (추가 비용 없음). GitHub Action은 API 비용 별도 |
| **FP 품질** | Hard Rules 단순 | 제품은 Opus 4.6 다단계 검증. 500+ 실제 취약점 발견 실적 |

### 5.4.1 VulChk 에이전트별 중복도 정직한 평가

| VulChk 에이전트 | Claude Code Security 중복도 | VulChk 고유 가치 | 위험 수준 |
|---------------|--------------------------|----------------|---------|
| **code-pattern-scanner** (SAST) | **높음** — Claude Code Security의 핵심 기능과 직접 겹침 | CoT taint analysis, FP precedents | 🔴 높음 |
| **secrets-scanner** (소스코드) | **중간** — hardcoded secrets 탐지 공식 지원 | 패턴+엔트로피 하이브리드, .env 파일 심층 | 🟡 중간 |
| **secrets-scanner** (git history) | **없음** — 과거 커밋 추적 기능 없음 | git log 전체 스캔, 삭제된 시크릿 탐지 | 🟢 안전 |
| **dependency-auditor** (SCA) | **중간** — dependency 취약점 탐지 공식 지원 | OSV API 정밀 CVE 조회 vs LLM 추론 | 🟡 중간 |
| **container-cicd-scanner** | **낮음** — Dockerfile/IaC 전문 분석 없음 | K8s manifest, Dockerfile, CI/CD 파이프라인 | 🟢 안전 |
| **attack-planner** | **없음** — 공격 시나리오 설계 기능 없음 | 다단계 공격 시나리오 + 사용자 승인 게이트 | 🟢 매우 안전 |
| **attack-executor** (DAST) | **없음** — 동적 테스트 기능 없음 | HTTP + 브라우저 기반 실제 침투 테스트 | 🟢 매우 안전 |

**핵심 인사이트:**
- VulChk의 SAST(code-pattern-scanner)는 Claude Code Security GA 출시 시 **직접 경쟁**에 놓임
- VulChk의 차별화는 **DAST + 정밀 SCA + Git history + Container** 에 집중해야 함
- SAST 영역에서는 장기적으로 Claude Code Security에 **위임**하는 전략이 현실적

### 5.5 공존 전략 — 정정 반영

> **⚠️ 전략 재수립 필요**: Claude Code Security가 secrets + SCA도 커버하므로,
> 이전의 "완전한 보완 관계" 프레이밍은 과장이었다. 현실적 공존 전략으로 수정.

**VulChk는 Claude Code Security와 부분적으로 경쟁하되, 고유 영역에서 차별화해야 한다.**

```
┌─────────────────────────────────────────────────┐
│          정정된 보안 워크플로우 제안                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. 개발 중 (SAST + 기본 보안):                    │
│     └─ Claude Code Security (GA 출시 후)         │
│        SAST + hardcoded secrets + dependency     │
│        → Enterprise/Team 구독 내 포함             │
│     ※ VulChk code-pattern-scanner와 중복됨        │
│                                                 │
│  2. 개발 중 (심층 보안 — VulChk 고유 영역):          │
│     └─ vulchk codeinspector                     │
│        ✅ 정밀 SCA (OSV API CVE 조회)              │
│        ✅ Git history 시크릿 스캔                   │
│        ✅ Container/IaC 보안 분석                   │
│        → 추가 비용 없음 (Claude Code 구독 내)       │
│                                                 │
│  3. 배포 전 (QA — VulChk 독보적 영역):             │
│     └─ vulchk hacksimulator                     │
│        ✅ 실제 HTTP + 브라우저 침투 테스트            │
│        ✅ 다단계 공격 시나리오 설계                   │
│        ✅ 사용자 승인 게이트                         │
│        → 추가 비용 없음                           │
│                                                 │
└─────────────────────────────────────────────────┘
```

**위임 가능 vs 불가능 (정정):**

| VulChk 기능 | Claude Code Security에 위임 가능? | 이유 |
|------------|------|------|
| PR 인라인 코멘트 | **가능** | 이미 잘 구현되어 있음 |
| CI/CD SAST 게이팅 | **가능** | GitHub Action 이미 존재 |
| 순수 SAST | **가능 (장기)** | GA 출시 후 Opus 4.6 다단계 검증이 VulChk CoT보다 우수할 가능성 |
| 소스코드 내 Secrets | **부분 가능** | 제품이 hardcoded secrets 탐지 지원. 단, 정밀도는 미검증 |
| 기본 SCA | **부분 가능** | 제품이 dependency 취약점 탐지 지원. 단, OSV API 정밀도에는 미달 가능 |
| Git History 시크릿 | **불가** | 과거 커밋 추적 기능 없음 |
| 정밀 SCA (OSV API) | **불가** | LLM 추론 vs API 기반 정밀 CVE 조회는 다른 접근 |
| DAST | **불가** | 기능 자체가 없음 |
| Container/IaC | **불가** | 기능 자체가 없음 |
| 공격 시나리오 설계 | **불가** | 기능 자체가 없음 |
| 브라우저 기반 테스트 | **불가** | 기능 자체가 없음 |

### 5.6 VulChk가 즉시 배울 점

| Claude Code Security 기능 | VulChk 적용 방안 | 난이도 |
|-------------------------|---------------|------|
| **Hard Exclusion Rules** (정규식 FP 필터) | codeinspector 병합 단계에 하드 필터 추가 | 낮음 |
| **Confidence 스코어** (0.7 미만 자동 제외) | 각 finding에 confidence 등급 부여 | 낮음 |
| **Explicit Exclusion 리스트** (17개 precedents) | code-pattern-scanner 프롬프트에 반영 | 낮음 |
| **커스텀 스캔 프로필** (텍스트 파일 기반) | `.vulchk/scan-profile.md` 지원 | 중간 |

특히 Claude Code Security의 "precedents" 리스트는 즉시 VulChk에 반영할 가치가 높다:
- 환경변수/CLI 플래그는 신뢰할 수 있는 값 (공격 벡터 아님)
- React/Angular는 기본적으로 XSS에 안전 (dangerouslySetInnerHTML 제외)
- 클라이언트 사이드 코드에서 인증 부재는 취약점 아님
- GitHub Action 워크플로우의 대부분 취약점은 실무에서 악용 불가
- 셸 스크립트 커맨드 인젝션은 대부분 실무에서 악용 불가

---

## 6. 최대 위협 재평가

### 6.1 Claude Code Security — 높은 위협 (상향 재조정)

> **⚠️ 정정**: 초기 "중간 위협" 평가는 GitHub Action 레포만 보고 내린 판단이었다.
> Anthropic 공식 페이지 확인 결과, 제품은 secrets + SCA까지 커버하므로 위협 수준을 상향 조정한다.

**현재 상태**: SAST + hardcoded secrets + dependency 취약점 탐지. Opus 4.6 다단계 검증.
Enterprise/Team 플랜 한정 (Limited Research Preview). 500+ 실제 취약점 발견 실적.

**Vercel/K8s 바이브 코딩 팀 대상 위협 평가:**
- 팀이 Enterprise/Team Claude Code를 이미 사용 중이라면 → Claude Code Security 무료 사용 가능
- SAST + secrets + 기본 SCA는 Claude Code Security로 충분할 수 있음
- **VulChk의 가치가 남는 영역**: DAST (배포된 Vercel 앱 실제 침투), K8s manifest 분석, Git history 시크릿

**위협 시나리오 (GA 출시 후):**
- Claude Code Security가 GA로 전환되면, VulChk의 code-pattern-scanner와 직접 경쟁
- Anthropic 대기업 리소스 vs VulChk 개인 프로젝트 → SAST 품질 경쟁에서 불리
- secrets-scanner의 소스코드 스캔 부분도 일부 대체될 수 있음

**현실적 방어 전략:**
- **SAST 영역 위임 수용**: 장기적으로 SAST를 Claude Code Security에 위임하는 것을 전략적으로 고려
- **DAST 차별화 강화**: 실제 침투 테스트는 Claude Code Security에 전혀 없는 독보적 영역
- **정밀 SCA 강조**: OSV API 기반 CVE 조회 (정확한 버전 매칭) vs LLM 추론 (오탐 가능)
- **Git history 시크릿**: 과거 커밋에서 삭제된 시크릿 탐지는 고유 가치
- **Container/K8s 특화**: Vercel/K8s 환경의 Dockerfile, K8s manifest 전문 분석
- **비용 우위 유지**: VulChk는 구독 내, GitHub Action은 API 비용 별도

### 6.2 SecureVibes — 가장 유사한 경쟁자

**현재 상태**: 독립 CLI, STRIDE 위협 모델링, 에이전틱 앱 감지

**위협 시나리오**: SecureVibes가 SCA·Secrets 전용 에이전트를 추가하고, 병렬 실행을 지원하면 VulChk 대비 기능 우위 확보 가능. 이미 더 높은 커뮤니티 인지도(252 stars).

**방어 전략**:
- Claude Code 생태계 내 통합이라는 구조적 차별점 유지
- 에이전틱 앱 보안을 SecureVibes보다 빠르게 고도화
- VulChk의 병렬 실행 + 브라우저 DAST 우위 강조

---

## 7. 경쟁사별 벤치마크 기회

각 경쟁사에서 VulChk가 배워야 할 핵심 아이디어:

| 경쟁사 | 핵심 학습 포인트 | VulChk 적용 방안 |
|--------|---------------|----------------|
| **Aikido** | AI AutoTriage (95% FP 감소) | Tier 2의 적대적 검증 패스 |
| **Codex Security** | 탐지→검증→패치 자동화 파이프라인 | Tier 1의 수정 가이드 강화 |
| **Claude Code Security** | 적대적 자기검증(Adversarial Verification) | Tier 2의 FP 자동 필터링 |
| **SecureVibes** | 에이전틱 앱 감지 + OWASP ASI | Tier 1의 에이전틱 앱 보안 |
| **Snyk** | 리치어빌리티 분석 (FP 98% 감소) | Tier 2의 리치어빌리티 분석 |
| **Semgrep** | Memories 시스템 (트리아지 학습) | Tier 3의 triage-history 학습 |

---

## 8. 결론

### VulChk의 전략적 위치 (정정 반영)

VulChk는 **"Claude Code 생태계의 DAST + 정밀 SCA + DevSecOps 보완 도구"**로 포지셔닝해야 한다.

기존의 "경량 보안 동반자" 프레이밍은 Claude Code Security가 SAST + secrets + SCA를
기본 제공하게 되면서 재조정이 필요하다.

**VulChk가 독보적인 영역 (최우선 강화):**
- DAST (실제 침투 테스트) — 경쟁 제품 중 유일
- 정밀 SCA (OSV API) — LLM 추론 대비 정확도 우위
- Git history 시크릿 — 과거 커밋 추적
- Container/K8s 보안 — Vercel/K8s 환경 전문

**VulChk가 경쟁에 노출된 영역 (장기 전략 필요):**
- SAST (code-pattern-scanner) — Claude Code Security GA 시 직접 경쟁
- 소스코드 secrets — Claude Code Security 기본 탐지 지원

### 즉각 실행 사항

1. **Tier 1 (즉시)**: CWE 매핑 + 수정 가이드 + 에이전틱 앱 보안 + 증분 리뷰 개선
   - 모두 프롬프트 수정 수준으로 구현 가능
   - 경쟁사 대비 가장 큰 갭을 최소 비용으로 해소

2. **Tier 2 (단기)**: FP 자동 필터링 + 리치어빌리티 분석 + 비용 가시성
   - 리포트 품질과 신뢰도를 결정적으로 향상

3. **신규 — DAST 차별화 강화**: attack-planner/executor를 VulChk의 핵심 차별화 포인트로 강화
   - Vercel/K8s 환경 대상 공격 시나리오 라이브러리 확충
   - 이 영역은 Claude Code Security가 진입하지 않은 독보적 영역

### 금지 사항

- 올인원 플랫폼화 시도 금지 (Aikido와의 경쟁은 비대칭)
- 추가 인프라(Docker, 클라우드 계정) 요구 기능은 후순위
- "제로 설정·즉시 실행"이라는 핵심 UX를 훼손하는 변경 금지
- **Claude Code Security와 SAST에서 정면 경쟁하는 데 과도한 리소스 투입 금지** — 장기적으로 위임 고려

### 최종 한 줄 요약

> **DAST와 정밀 SCA로 독보적 가치를 강화하고, SAST는 기본기를 갖추되 장기적으로 Claude Code Security에 위임을 검토하며, 바이브 코더 특화(에이전틱 앱 보안)로 차별화한다.**
