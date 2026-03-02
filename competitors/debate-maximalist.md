# VulChk 확장론자 논증 — 경쟁사의 검증된 기능은 반드시 도입해야 한다

> 작성일: 2026-03-02
> 입장: 확장론자 (Maximalist)

---

## 핵심 주장

VulChk는 현재 "CLI 플러그인으로서 넓은 커버리지"라는 포지션을 갖고 있지만, **경쟁사들이 이미 검증한 핵심 기능들이 빠져 있어 실질적인 보안 도구로서의 신뢰성에 한계가 있다.** 경쟁사의 기능을 적극 도입하지 않으면, Claude Code Security가 DAST/SCA/Secrets 기능을 추가하는 순간 VulChk의 존재 이유가 사라진다. 지금이 기능 격차를 좁힐 마지막 기회다.

---

## 우선순위별 도입 필수 기능

### 1순위: CI/CD 통합 / PR 리뷰 (Critical)

**영감**: Semgrep (PR diff-only 스캔), Claude Code Security (GitHub Action), SecureVibes (PR Review 워크플로우)

**왜 필수인가:**
- VulChk는 현재 **온디맨드 수동 실행만 가능**하다. 개발자가 `/vulchk.codeinspector`를 직접 입력해야만 분석이 실행된다
- Semgrep은 주간 100만+ PR 스캔을 자동 처리하고, Claude Code Security는 PR마다 인라인 코멘트를 남긴다. Codex Security는 커밋마다 자동 스캔한다
- 수동 실행에 의존하면 **"가장 바쁠 때 가장 스킵되는 도구"**가 된다. 보안은 자동화되어야 의미가 있다
- 없으면 일어나는 일: 팀에서 "VulChk 돌렸어?" → "아, 깜빡했어" → 취약한 코드가 프로덕션에 배포됨

**구현 방안:**
```yaml
# .github/workflows/vulchk-review.yml
name: VulChk Security Review
on:
  pull_request:
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx vulchk review --diff ${{ github.event.pull_request.base.sha }}..${{ github.sha }}
```

- `vulchk review` 명령어를 새로 추가. PR diff만 분석하여 비용 절감
- 이미 codeinspector에 커밋 해시 기반 증분 업데이트가 있으므로, 이를 확장하여 `git diff base..head` 범위만 분석하는 모드 추가
- SecureVibes처럼 저위험 diff(문서, 테스트, 설정만 변경)에 대한 자동 트리아지로 LLM 비용 절감
- 결과를 GitHub PR 코멘트로 게시 (gh CLI 활용)
- GitHub Action 템플릿을 `vulchk init --ci` 옵션으로 자동 생성

---

### 2순위: AutoFix 자동 수정 제안 (Critical)

**영감**: Snyk DeepCode AI Fix (80% 정확도), Claude Code Security (타겟 패치 제안), Aikido AutoFix (PR 자동 생성)

**왜 필수인가:**
- VulChk는 현재 **"문제를 찾아서 보여주기만 한다."** 수정은 전적으로 개발자 몫이다
- Snyk은 80% 정확도의 자동 수정을 제공하고, Aikido는 수정 코드를 담은 PR을 자동 생성한다
- 취약점 발견 → 수정 사이의 **MTTR(Mean Time To Remediate)**이 보안의 핵심 지표다. 수정 제안이 없으면 MTTR이 길어진다
- Claude Code 자체가 코드 생성/수정 도구이므로, VulChk가 수정 제안을 하지 않는 것은 **플랫폼의 핵심 역량을 활용하지 않는 것**이다
- 없으면 일어나는 일: 개발자가 "SQL Injection 발견"이라는 리포트를 받고도 어떻게 고쳐야 할지 몰라 방치

**구현 방안:**
- codeinspector 리포트의 각 finding에 `## Suggested Fix` 섹션 추가
- 현재 code-pattern-scanner가 source-sink 추적을 하므로, 같은 맥락에서 수정 코드를 생성하도록 프롬프트 확장
- 수정 제안은 **제안일 뿐 자동 적용하지 않음** (Anthropic의 "Nothing is applied without human approval" 원칙 준수)
- 구현 비용이 낮다: 에이전트 프롬프트에 "취약점을 발견하면, 해당 코드를 어떻게 수정해야 하는지 구체적인 코드 스니펫을 함께 제시하라"를 추가하면 된다
- 단계적 도입: Phase 1은 텍스트 수정 가이드, Phase 2는 실제 코드 diff 생성, Phase 3는 `vulchk fix` 명령어로 자동 적용

---

### 3순위: False Positive 자동 트리아지 (High)

**영감**: Aikido AutoTriage (95% FP 감소), Semgrep Assistant (20% 자동 필터링, 95% 사용자 동의율)

**왜 필수인가:**
- LLM 기반 보안 도구의 **가장 큰 신뢰성 문제는 false positive**다. Claude Code Security도 "많은 발견이 오탐"이라는 비판을 받았다
- VulChk의 code-pattern-scanner는 4단계 CoT 추론을 하지만, **자기 검증(self-challenge) 단계가 없다**
- Aikido는 AutoTriage로 95% FP를 제거하고, Semgrep은 과거 트리아지 결정을 기억하는 Memories 시스템을 운영한다
- FP가 많으면 개발자는 리포트를 무시하기 시작한다. **"늑대 소년" 효과**가 도구를 죽인다
- 없으면 일어나는 일: 10개 finding 중 7개가 오탐 → 개발자가 리포트 전체를 신뢰하지 않게 됨 → 진짜 취약점도 놓침

**구현 방안:**
- Claude Code Security의 **적대적 자기검증(Adversarial Verification Pass)** 패턴을 도입
  - code-pattern-scanner가 취약점을 발견한 후, 두 번째 패스에서 "이 발견이 틀렸을 수 있는 이유"를 스스로 검토
  - 신뢰도(confidence) 등급을 High/Medium/Low로 부여
- Semgrep Memories 패턴을 도입
  - `.vulchk/triage-history.json`에 과거 트리아지 결과를 저장
  - 사용자가 특정 finding을 "FP"로 마킹하면, 동일 패턴의 future finding에 자동 반영
  - 프로젝트별로 학습되는 맥락 인식 트리아지
- 리포트에 confidence 등급 표시: `[HIGH confidence]` vs `[LOW confidence — manual review recommended]`

---

### 4순위: CWE 매핑 (High)

**영감**: SecureVibes (각 취약점에 CWE ID 태깅), Snyk (CWE/CVSS 표준 분류)

**왜 필수인가:**
- VulChk 리포트는 현재 **자유 형식 마크다운**이다. 표준화된 취약점 분류 체계가 없다
- CWE(Common Weakness Enumeration)는 보안 업계의 **공통 언어**다. CWE 없이는:
  - 컴플라이언스 감사에서 "이 취약점이 어떤 카테고리인가?"라는 질문에 답할 수 없다
  - 다른 도구와의 결과 비교가 불가능하다
  - OWASP Top 10 매핑도 할 수 없다 (OWASP는 CWE 그룹을 기반으로 한다)
- SecureVibes는 모든 취약점에 CWE ID를 태깅하고, Snyk은 CWE + CVSS 스코어를 함께 제공한다
- 없으면 일어나는 일: "SQL Injection 취약점 발견"이라고만 적혀 있어서, 이것이 CWE-89(SQL Injection)인지 CWE-943(NoSQL Injection)인지 구분 불가. 감사 보고서에 활용할 수 없음

**구현 방안:**
- 각 에이전트의 프롬프트에 CWE 매핑 지시 추가:
  - "발견된 취약점마다 가장 적합한 CWE ID를 태깅하라. 확실하지 않으면 가장 가까운 상위 CWE를 사용하라"
  - 구현 비용 매우 낮음 — 프롬프트 한 줄 추가
- 리포트 형식에 CWE 열 추가:
  ```
  | # | Severity | CWE | Title | Location |
  |---|----------|-----|-------|----------|
  | 1 | Critical | CWE-89 | SQL Injection in login | src/auth.js:42 |
  ```
- OWASP Top 10 (2021) 매핑 테이블을 리포트 말미에 자동 생성

---

### 5순위: STRIDE 위협 모델링 (High)

**영감**: SecureVibes (전용 Threat Modeling Agent, STRIDE 6개 카테고리)

**왜 필수인가:**
- VulChk는 현재 **"찾을 수 있는 것을 찾는"** 접근법이다. 각 에이전트가 자기 전문 영역(의존성, 시크릿, 패턴 등)에서 독립적으로 검색한다
- 이 접근법의 문제: **체계적으로 빠지는 영역이 생긴다.** 특히 Repudiation(부인 방지), Information Disclosure(정보 노출), Denial of Service 같은 카테고리는 현재 어떤 에이전트도 체계적으로 다루지 않는다
- SecureVibes는 STRIDE로 위협을 6개 카테고리로 체계화하여, 에이전트가 특정 유형에 과집중하는 것을 방지한다
- 없으면 일어나는 일: Injection 계열은 잘 찾지만, "로깅이 없어서 공격 추적이 불가능한 문제"나 "권한 상승 경로"는 체계적으로 놓침

**구현 방안:**
- 새 에이전트 `vulchk-threat-modeler.md` 추가 (sonnet 모델)
  - codeinspector 실행 시 **첫 번째로** 실행되어 프로젝트의 아키텍처를 매핑
  - STRIDE 6개 카테고리별 위협을 식별
  - 결과를 `.vulchk/threat-model.json`으로 저장
- 기존 에이전트들은 threat-model.json을 입력으로 받아, 해당 위협이 실제 코드에 존재하는지 검증
- SecureVibes의 "Assessment → Threat Model → Code Review" 3단계를 VulChk의 병렬 아키텍처에 맞게 변형:
  - Step 0: threat-modeler 실행 (순차, 선행)
  - Step 1: 기존 5개 에이전트 병렬 실행 (threat model을 참조하여 분석 범위 확장)
- 비용 증가 우려에 대해: 위협 모델링은 프로젝트 구조가 크게 바뀌지 않는 한 캐싱 가능. 증분 실행 시 이전 threat model을 재사용하고, 변경된 부분만 업데이트

---

### 6순위: 커밋 레벨 지속 감시 (High)

**영감**: Codex Security (커밋마다 자동 스캔), SecureVibes (PR Review 워크플로우)

**왜 필수인가:**
- VulChk는 온디맨드 실행만 지원한다. 개발자가 의도적으로 실행하지 않으면 새로 도입된 취약점을 놓친다
- Codex Security는 "새 코드 커밋 시 자동으로 리포지토리 전체 + threat model 대비 스캔"을 수행한다
- 보안 업계의 트렌드: **"Shift Left" → "Shift Everywhere"**. 코딩 시점, 커밋 시점, PR 시점, 배포 시점 모두에서 검증해야 한다
- 없으면 일어나는 일: 주간 스캔 사이에 3일 동안 50개 커밋이 쌓이고, 그 중 하나에 심각한 취약점이 있었지만 주간 스캔 전에 프로덕션에 배포됨

**구현 방안:**
- `vulchk watch` 명령어 추가 — git hook 기반 지속 감시
  - `pre-commit` hook: secrets-scanner만 실행 (빠르고 비용 낮음, haiku 모델)
  - `pre-push` hook: 전체 codeinspector의 증분 스캔 실행
- 1순위 CI/CD 통합과 연계:
  - 로컬: git hook으로 커밋 시점 감시
  - 리모트: GitHub Action으로 PR 시점 감시
- 비용 최적화: 변경된 파일만 분석하는 증분 모드 필수. secrets-scanner(haiku)는 커밋당 $0.01 이하로 운영 가능

---

### 7순위: 에이전틱 앱 보안 — OWASP ASI (Medium)

**영감**: SecureVibes (에이전틱 앱 자동 감지, OWASP ASI 위협 포함)

**왜 필수인가:**
- 2025-2026년 가장 빠르게 성장하는 앱 카테고리는 **LLM/에이전트 기반 앱**이다 (Claude, GPT, LangChain, CrewAI 등)
- 이런 앱에는 전통적 취약점 외에도 **프롬프트 인젝션, 도구 매개변수 조작, 모델 다운그레이드 공격, 과도한 에이전시** 등 새로운 위협이 존재한다
- SecureVibes는 코드에서 LLM API 호출이나 에이전트 프레임워크 사용을 자동 감지하고, OWASP ASI 위협을 분석에 포함시킨다
- **VulChk 자체가 Claude Code 위에서 동작하는 에이전틱 앱이다.** 이 분야의 보안을 모르면 VulChk 자신도 위험하다
- 없으면 일어나는 일: LangChain 기반 챗봇을 분석할 때 SQL Injection은 찾지만, 프롬프트 인젝션이나 도구 호출 매개변수 조작은 놓침

**구현 방안:**
- code-pattern-scanner에 에이전틱 앱 탐지 로직 추가:
  - LLM API 호출 패턴 감지: `openai.`, `anthropic.`, `langchain.`, `llamaindex.` 등
  - 감지되면 OWASP ASI 체크리스트를 분석 범위에 자동 추가
- OWASP ASI 주요 위협:
  - LLM01: 프롬프트 인젝션
  - LLM02: 안전하지 않은 출력 처리
  - LLM03: 훈련 데이터 오염
  - LLM06: 과도한 에이전시
  - LLM07: 시스템 프롬프트 유출
  - LLM09: 오정보/환각
- `.vulchk/config.json`에 `"agentic": true/false` 옵션 추가, 자동 감지도 지원

---

### 8순위: 샌드박스 검증 (Medium)

**영감**: Codex Security (격리 환경에서 취약점 실제 트리거), SecureVibes (DAST 스킬)

**왜 필수인가:**
- 현재 VulChk의 hacksimulator는 **실제 대상 서버에 공격을 실행**한다. 이는 다음 문제를 야기한다:
  - 프로덕션 환경에 영향을 줄 수 있다 (데이터 손상, 서비스 중단)
  - 대상 서버가 없으면 (로컬 개발 환경) DAST를 실행할 수 없다
  - 법적 문제 — 명시적 허가 없이 실제 서버에 공격하면 법적 책임
- Codex Security는 **샌드박스 환경에서 취약점을 트리거**하여 확인한다. 실제 서버에 영향 없이 익스플로잇 가능성을 검증한다
- 없으면 일어나는 일: "이 SQL Injection이 실제로 동작하는지 확인하려면 프로덕션 서버에 공격해야 하는데..." → 확인을 포기하거나, 사고 발생

**구현 방안:**
- `vulchk sandbox` 명령어 추가:
  - 프로젝트의 docker-compose.yml이나 Dockerfile을 감지하여 로컬에서 격리 환경 구성
  - 격리 환경에서 앱을 실행한 후, hacksimulator가 해당 환경을 대상으로 공격 실행
  - 테스트 완료 후 환경 자동 정리
- Docker 기반 구현:
  - `docker compose up -d` → 앱 시작
  - hacksimulator가 `localhost:PORT`를 대상으로 공격
  - `docker compose down` → 정리
- 네트워크 격리: Docker network를 사용하여 외부 접근 차단

---

### 9순위: 리치어빌리티 분석 (Medium)

**영감**: Snyk Supply Chain (리치어빌리티 분석으로 고/위험 FP 98% 감소), Semgrep (실제 사용되는 취약 경로만 보고)

**왜 필수인가:**
- VulChk의 dependency-auditor는 OSV API로 CVE를 조회하지만, **해당 취약한 코드가 실제로 사용되는지 확인하지 않는다**
- 예: `lodash`에 CVE가 있어도, 실제로 앱이 취약한 함수(`_.template()`)를 호출하지 않으면 위험이 없다
- Snyk은 리치어빌리티 분석으로 "실제 도달 가능한 취약점"만 보고하여 **FP를 98% 감소**시켰다
- 없으면 일어나는 일: dependency-auditor가 20개 CVE를 보고 → 개발자가 하나하나 확인 → 18개가 실제로는 사용하지 않는 함수의 취약점 → 시간 낭비 + 신뢰 하락

**구현 방안:**
- dependency-auditor 에이전트의 프롬프트 확장:
  - CVE를 발견한 후, 해당 패키지의 취약한 함수/메서드를 식별
  - Grep 도구로 프로젝트 코드에서 해당 함수/메서드 사용 여부 검색
  - 사용이 확인된 경우에만 "Reachable" 태그와 함께 보고
  - 사용되지 않는 경우 "Unreachable — lower priority" 태그로 심각도 하향 조정
- 리포트 형식:
  ```
  | # | CVE | Package | Reachability | Severity |
  |---|-----|---------|-------------|----------|
  | 1 | CVE-2024-1234 | lodash@4.17.20 | Reachable (src/utils.js:15) | Critical |
  | 2 | CVE-2024-5678 | axios@0.21.0 | Unreachable | Low (downgraded) |
  ```

---

### 10순위: 다중 언어 확대 (11 → 30개) (Low)

**영감**: SecureVibes (11개 언어), Claude Code Security (50개+ 언어), Semgrep (30개+ 언어)

**왜 필수인가:**
- VulChk는 현재 언어에 대한 명시적 제한이 없지만 (LLM 기반이므로 이론적으로 모든 언어 지원), **테스트되고 최적화된 언어 목록이 없다**
- SecureVibes는 11개 언어에 대해 언어별 자동 감지와 제외 패턴을 적용한다
- Claude Code Security는 50개+ 언어를 공식 지원한다고 주장한다
- 없으면 일어나는 일: Rust나 Kotlin 프로젝트에서 VulChk를 실행하면, 언어별 최적화가 없어 중요한 패턴을 놓침 (예: Rust의 unsafe 블록 분석, Kotlin의 coroutine 관련 race condition)

**구현 방안:**
- 언어별 분석 힌트를 에이전트 프롬프트에 추가하는 것은 VulChk의 LLM 기반 아키텍처에서 비교적 쉽다
- 우선 지원 목표 언어 (현재 → 30개):
  - Tier 1 (깊은 분석): JavaScript, TypeScript, Python, Java, Go, Ruby, PHP, C#
  - Tier 2 (기본 분석): Rust, Kotlin, Swift, C/C++, Scala
  - Tier 3 (실험적): Dart, Elixir, Clojure, Haskell, Lua, Perl, R, Julia, Groovy, VB.NET, F#, Objective-C, Assembly, COBOL, Fortran, Shell/Bash, PowerShell
- 각 언어별 `.vulchk/lang-profiles/` 디렉토리에 분석 힌트 파일 추가
- 실질적으로 LLM이 이미 대부분의 언어를 이해하므로, 핵심은 **언어별 보안 패턴 지식**을 프롬프트에 주입하는 것

---

## 구현 로드맵 제안

| 분기 | 도입 기능 | 예상 공수 | 비즈니스 임팩트 |
|------|---------|---------|-------------|
| **2026 Q2** | CWE 매핑 (4순위) | 1주 (프롬프트 수정) | 즉시 — 리포트 품질 대폭 향상 |
| **2026 Q2** | AutoFix 제안 Phase 1 (2순위) | 2주 (프롬프트 확장) | 즉시 — 사용자 만족도 핵심 |
| **2026 Q2** | FP 자동 트리아지 (3순위) | 2주 (적대적 검증 패스) | 즉시 — 신뢰성 핵심 |
| **2026 Q3** | CI/CD 통합 (1순위) | 4주 (CLI 명령어 + GitHub Action) | 높음 — 자동화 = 채택률 |
| **2026 Q3** | 리치어빌리티 분석 (9순위) | 2주 (프롬프트 확장) | 높음 — SCA 품질 향상 |
| **2026 Q3** | 커밋 감시 (6순위) | 3주 (git hook + 증분 모드) | 높음 — 지속적 보안 |
| **2026 Q4** | STRIDE 위협 모델링 (5순위) | 4주 (새 에이전트 + 파이프라인 변경) | 중간 — 체계적 분석 |
| **2026 Q4** | 에이전틱 앱 보안 (7순위) | 3주 (패턴 + ASI 체크리스트) | 중간 — 미래 시장 선점 |
| **2025 Q1** | 샌드박스 검증 (8순위) | 6주 (Docker 통합) | 중간 — DAST 안전성 |
| **장기** | 다중 언어 확대 (10순위) | 지속적 (언어별 프로파일) | 낮음 — 점진적 확장 |

---

## 반론에 대한 재반론

### "기능을 너무 많이 추가하면 복잡해진다"

**아니다.** VulChk의 아키텍처는 **마크다운 프롬프트 파일**이다. 새 기능 대부분은 기존 에이전트의 프롬프트를 확장하거나 새 에이전트 파일을 추가하는 것으로 구현된다. 전통적 소프트웨어에서 "기능 추가 = 코드 복잡도 증가"이지만, VulChk에서는 "기능 추가 = 프롬프트 파일 추가"이다. 아키텍처가 이를 지원하도록 이미 설계되어 있다.

### "비용이 너무 많이 든다"

**비용 최적화 전략이 있다.**
- CWE 매핑, AutoFix, 리치어빌리티 분석은 기존 에이전트 실행 내에서 추가 프롬프트로 처리 — 추가 비용 미미
- FP 트리아지는 오히려 개발자의 시간 비용을 절감
- 커밋 감시는 haiku 모델 기반 secrets-scanner만 실행하면 커밋당 $0.01 이하
- STRIDE는 캐싱으로 반복 비용 제거

### "VulChk는 CLI 플러그인이지 플랫폼이 아니다"

**맞다. 그래서 더 빨리 움직여야 한다.** CLI 플러그인은 진입 장벽이 낮은 만큼 이탈 장벽도 낮다. Claude Code Security가 더 많은 기능을 제공하기 시작하면, 사용자가 VulChk를 떠나는 데 1분도 걸리지 않는다. **지금 기능을 추가하지 않으면, 나중에 추가할 기회조차 없다.**

### "경쟁사를 따라가기보다 차별화에 집중해야 한다"

**기본기 없이 차별화는 불가능하다.** CWE 매핑, AutoFix, CI/CD 통합은 "차별화"가 아니라 **"테이블 스테이크"**다. 이것이 없으면 진지한 보안 도구로 취급받지 못한다. SecureVibes, Snyk, Semgrep, Aikido, Claude Code Security 모두 이 기본기를 갖추고 있다. VulChk만 없다.

---

## 결론

VulChk는 아키텍처적으로 **기능 확장에 유리한 구조**를 이미 갖추고 있다. 마크다운 프롬프트 기반이므로 새 기능 추가의 한계 비용이 매우 낮다. 문제는 의지다.

경쟁사들은 이미 움직이고 있다:
- Claude Code Security는 Anthropic의 공식 지원을 받으며 빠르게 기능을 추가 중
- Codex Security는 GPT-5.3으로 자율 보안 에이전트를 구축 중
- Aikido는 $60M 투자를 받아 올인원 플랫폼을 확장 중
- SecureVibes는 4개월 만에 v0.1 → v0.4를 찍으며 빠르게 진화 중

**지금 행동하지 않으면, VulChk는 "있으면 좋지만 없어도 되는 도구"로 전락할 것이다.** 경쟁사의 검증된 기능을 적극 도입하여 "없으면 안 되는 도구"로 만들어야 한다.
