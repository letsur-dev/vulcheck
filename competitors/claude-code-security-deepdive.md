# Claude Code Security Review — 코드 레벨 심층 분석

> 분석일: 2026-03-02
> 대상: https://github.com/anthropics/claude-code-security-review

---

## 1. 아키텍처 분석 (코드 기반)

### 1.1 실행 경로 2개

```
경로 A: GitHub Action (CI/CD)
─────────────────────────────
PR 이벤트 → github_action_audit.py → GitHub API로 PR diff 가져옴
  → prompts.py로 프롬프트 생성
  → `claude` CLI를 subprocess로 실행 (Opus 4.1 기본)
  → JSON 결과 파싱
  → findings_filter.py로 FP 필터링 (Hard Rules + Claude API 2차 필터)
  → comment-pr-findings.js로 PR 인라인 코멘트 게시

경로 B: Claude Code 슬래시 명령어 (로컬)
────────────────────────────────────────
사용자가 /security-review 입력
  → .claude/commands/security-review.md 실행
  → git diff로 변경사항 수집
  → Claude가 코드 탐색 도구로 리포지토리 컨텍스트 파악
  → 서브 태스크로 취약점 식별
  → 병렬 서브 태스크로 각 취약점 FP 필터링
  → confidence 8 미만 필터링
  → 마크다운 리포트 출력
```

### 1.2 비용 구조 (핵심 발견)

**GitHub Action 경로:**
```python
# constants.py
DEFAULT_CLAUDE_MODEL = 'claude-opus-4-1-20250805'  # Opus 4.1 기본!
PROMPT_TOKEN_LIMIT = 16384
SUBPROCESS_TIMEOUT = 1200  # 20분

# 실행 구조:
# 1) claude CLI subprocess → ANTHROPIC_API_KEY 필요 → API 과금
# 2) FP 필터링 → Claude API 직접 호출 → 추가 API 과금 (finding당 1회)
```

**즉, GitHub Action은 Anthropic API 키가 필수이며, Opus 4.1 기본 사용 → 비쌈.**

- Opus 4.1 가격: $15/M 입력 토큰, $75/M 출력 토큰
- PR 분석 1회: 프롬프트(diff 포함) + 코드 탐색 + 결과 생성 = 대략 $2-10/PR (diff 크기에 따라)
- FP 필터링: finding당 추가 API 호출 = finding 10개면 추가 $1-3
- **PR당 총 비용 추정: $3-15 (Opus 기준)**

**슬래시 명령어 경로:**
- Claude Code 세션 내에서 실행 → Claude Code 구독에 포함
- Team 플랜 Premium 시트($150/월) 또는 개인 Pro 플랜 범위 내
- 추가 API 비용 없음 (Claude Code 사용량에 포함)

### 1.3 탐지 방식

**단일 프롬프트, 단일 패스:**
```python
# prompts.py — 프롬프트 구조
"""
Phase 1 - Repository Context Research (파일 탐색 도구 사용)
Phase 2 - Comparative Analysis (기존 보안 패턴 대비)
Phase 3 - Vulnerability Assessment (실제 취약점 탐지)
"""
# → 하나의 Claude 인스턴스가 3단계를 순차 실행
# → VulChk처럼 5개 전문 에이전트 병렬 아님
```

**슬래시 명령어는 서브 태스크 활용:**
```markdown
# security-review.md
1. 서브 태스크로 취약점 식별
2. 각 취약점마다 병렬 서브 태스크로 FP 필터링
3. confidence 8 미만 필터링
```

### 1.4 FP 필터링 (2단계)

**Stage 1 — Hard Exclusion Rules (정규식 기반):**
```python
# findings_filter.py — 총 7개 카테고리의 정규식 패턴
_DOS_PATTERNS          # DoS 관련 제외
_RATE_LIMITING_PATTERNS # Rate limiting 제외
_RESOURCE_PATTERNS      # 리소스 관리 제외
_OPEN_REDIRECT_PATTERNS # Open redirect 제외
_MEMORY_SAFETY_PATTERNS # 비-C/C++ 메모리 안전성 제외
_REGEX_INJECTION        # Regex injection 제외
_SSRF_PATTERNS          # HTML 파일 내 SSRF 제외
# + 마크다운 파일 자동 제외
```

**Stage 2 — Claude API 2차 필터링:**
```python
# claude_api_client.py
# 각 finding을 개별적으로 Claude API에 보내서 FP 여부 재검증
# confidence 1-10 스코어 부여
# keep_finding: true/false 판정
```

**Stage 2는 `ENABLE_CLAUDE_FILTERING=true` 환경변수로 활성화해야 함 (기본 비활성)**

### 1.5 커스텀 스캔 지원

```yaml
# 두 가지 커스텀 옵션:
false-positive-filtering-instructions: .github/fp-filter.txt  # FP 규칙 커스텀
custom-security-scan-instructions: .github/scan-rules.txt     # 스캔 카테고리 추가
```

사용자가 조직 맞춤 FP 규칙과 추가 보안 카테고리를 텍스트 파일로 정의 가능.
VulChk에는 이런 커스텀 스캔 프로필 기능이 없음.

---

## 2. VulChk vs Claude Code Security Review — 상세 비교

### 2.1 아키텍처 차이

| 항목 | Claude Code Security Review | VulChk |
|------|---------------------------|--------|
| **실행 모델** | 단일 Claude 인스턴스 (1 프롬프트) | 5개 전문 에이전트 병렬 실행 |
| **분석 범위** | PR diff만 (변경된 코드) | 전체 코드베이스 (+ 증분 가능) |
| **모델** | Opus 4.1 고정 (GitHub Action) | 에이전트별 모델 최적화 (Haiku/Sonnet/Opus) |
| **FP 필터링** | 2단계 (Hard Rules + Claude API) | 없음 (에이전트 프롬프트 내 CoT) |
| **출력** | JSON (GitHub Action) / Markdown (슬래시) | Markdown |
| **CI/CD** | GitHub Action 네이티브 | 없음 |
| **커스텀** | FP 규칙 파일 + 스캔 카테고리 파일 | 없음 |

### 2.2 기능 범위 차이 (정정 반영)

> **⚠️ 정정 고지**: 아래 표는 GitHub Action 레포 분석뿐만 아니라
> Anthropic 공식 Claude Code Security 제품 페이지도 반영하여 수정되었다.
> GitHub Action에서 "excluded"로 처리한 항목이 제품 자체에서는 지원되는 경우가 있다.

| 기능 | Claude Code Security (제품) | GitHub Action (레포) | VulChk |
|------|--------------------------|---------------------|--------|
| **SAST (정적 코드 분석)** | O — 핵심 기능 | O | O — code-pattern-scanner |
| **Hardcoded Secrets** | **O — 공식 지원** | X (필터로 제외) | O — secrets-scanner |
| **Git History 시크릿** | X | X | **O — git-history-scanner** |
| **SCA (의존성 취약점)** | **O — 공식 지원** | X (별도 기능 없음) | O — dependency-auditor (OSV API) |
| **DAST (동적 테스트)** | X | X | **O — attack-executor** |
| **Container/IaC 보안** | X | X | **O — container-cicd-scanner** |
| **공격 시나리오 설계** | X | X | **O — attack-planner** |
| **브라우저 기반 테스트** | X | X | **O — ratatosk-cli** |
| **사용자 승인 게이트** | X (자동 실행) | X | O (planner → 승인 → executor) |
| **PR 인라인 코멘트** | O | O — 핵심 기능 | X |
| **Hard FP 규칙 필터** | 내장 (다단계 검증) | O — 정규식 기반 7개 카테고리 | △ — FP Precedents 12개 |
| **커스텀 스캔 프로필** | 미확인 | O — 텍스트 파일 기반 | X |

### 2.3 탐지 카테고리 비교 (정정)

> **⚠️ 중요 구분**: "GitHub Action이 제외하는 것" ≠ "Claude Code Security 제품이 못 하는 것"
> GitHub Action의 `findings_filter.py`는 해당 Action의 FP 필터링 구현이며,
> Anthropic 제품 자체의 기능 한계와 다르다.

**GitHub Action(`findings_filter.py`)이 필터링하는 것들 (Action 구현 선택):**
```
- DoS/리소스 고갈 → 합리적 제외 (VulChk도 FP Precedents에서 제외)
- 시크릿/자격 증명 → Action에서는 제외, 그러나 제품은 탐지 지원
- Rate limiting → 합리적 제외 (VulChk도 FP Precedents에서 제외)
- 메모리 안전성 (비-C/C++) → 합리적 제외
- 테스트 파일 → 합리적 제외 (VulChk도 FP Precedents에서 제외)
- Open redirect → Action에서 제외
- Regex injection → 합리적 제외
```

**Claude Code Security 제품이 실제로 탐지하는 것 (공식 확인):**
```
✅ Injection vulnerabilities (SQL, XSS, command injection 등)
✅ Authentication & authorization issues
✅ Hardcoded secrets & credentials
✅ Dependency vulnerabilities
✅ Data exposure risks
✅ Supply chain: 타이포스쿼팅 위험
✅ Business logic: TOCTOU, Race condition
✅ Certificate validation bypass
```

**VulChk 고유 탐지 영역 (Claude Code Security에 없는 것):**
```
✅ Git history 시크릿 스캔 (과거 커밋에서 삭제된 시크릿)
✅ OSV API 기반 정밀 SCA (정확한 버전 매칭 + CVSS 스코어)
✅ Container/IaC 보안 (Dockerfile, K8s manifest, CI/CD 파이프라인)
✅ DAST (실제 HTTP/브라우저 침투 테스트)
✅ 공격 시나리오 설계 + 사용자 승인 게이트
```

---

## 3. 비용 모델 심층 분석

### 3.1 Claude Code Security 비용 시나리오

| 사용 경로 | 비용 구조 | 예상 비용 |
|----------|---------|---------|
| **슬래시 명령어** `/security-review` | Claude Code 구독에 포함 | 추가 비용 없음 (Pro/Team 플랜 범위 내) |
| **GitHub Action** (Opus 4.1) | API 키 직접 과금 | PR당 $3-15 |
| **GitHub Action** (Sonnet으로 변경) | API 키 직접 과금 | PR당 $0.5-3 |
| **GitHub Action + FP 필터링** | 위 비용 + finding당 API 호출 | 추가 $0.1-0.3/finding |

### 3.2 VulChk 비용 시나리오

| 사용 경로 | 비용 구조 | 예상 비용 |
|----------|---------|---------|
| **codeinspector** (5개 에이전트) | Claude Code 구독에 포함 | 추가 비용 없음 |
| **hacksimulator** (DAST) | Claude Code 구독에 포함 | 추가 비용 없음 |

### 3.3 핵심 인사이트

**Claude Code Security의 GitHub Action은 "무료"가 아니다.**
- Anthropic API 키가 필수 → API 사용료 발생
- Opus 4.1 기본 → 가장 비싼 모델
- 팀에서 하루 10개 PR을 올리면 → 월 $600-4,500 추가 비용 가능
- FP 필터링까지 켜면 비용 더 증가

**반면 VulChk는 Claude Code 구독 내에서 동작 → 추가 API 비용 없음.**
이것은 VulChk의 명확한 비용 우위이다.

---

## 4. 공존/위임 전략 분석

### 4.1 보완적 역할 분담

```
┌─────────────────────────────────────────────────────┐
│                    보안 워크플로우                      │
├──────────────────┬──────────────────────────────────┤
│  코딩 시점 (개발자 로컬)                               │
│  └─ VulChk codeinspector                            │
│     전체 코드베이스 분석 (SCA+Secrets+Code+Container)  │
│                                                     │
│  PR 시점 (CI/CD)                                    │
│  └─ Claude Code Security Review (GitHub Action)     │
│     PR diff 기반 SAST + 인라인 코멘트                  │
│     ※ 별도 API 비용 발생                              │
│                                                     │
│  배포 전 (QA)                                        │
│  └─ VulChk hacksimulator                            │
│     실제 HTTP/브라우저 기반 침투 테스트                  │
│                                                     │
│  코딩 시점 (간편 리뷰)                                 │
│  └─ /security-review (Claude Code 내장)             │
│     빠른 SAST 리뷰 (구독 내 포함)                      │
└─────────────────────────────────────────────────────┘
```

### 4.2 VulChk가 위임할 수 있는 것

| 기능 | 위임 가능 여부 | 이유 |
|------|-------------|------|
| PR 인라인 코멘트 | O | Claude Code Security가 이미 잘 함. VulChk가 별도 구현할 필요 없음 |
| CI/CD SAST 게이팅 | O | GitHub Action이 이미 존재. VulChk가 따로 만들면 중복 |
| 순수 SAST (코드 패턴) | △ | `/security-review`로 가능하지만, VulChk의 code-pattern-scanner가 더 깊은 분석 |

### 4.3 VulChk가 위임할 수 없는 것 (정정)

> **⚠️ 정정**: 이전에 SCA, Secrets를 "절대 위임 불가"로 분류했으나,
> Claude Code Security 제품이 해당 기능을 공식 지원하므로 재분류.

| 기능 | 위임 가능? | 이유 |
|------|----------|------|
| **소스코드 Secrets** | **부분 가능** | 제품이 hardcoded secrets 탐지 공식 지원. 단, 정밀도/패턴 범위 미검증 |
| **기본 SCA** | **부분 가능** | 제품이 dependency 취약점 탐지 공식 지원. 단, LLM 추론 기반이라 OSV API 정밀도에 미달 가능 |
| **Git History 시크릿 스캔** | **불가** | 과거 커밋 추적 기능 없음 — VulChk 고유 |
| **정밀 SCA (OSV API)** | **불가** | 정확한 버전 매칭 + CVSS 스코어 조회는 LLM 추론과 다른 접근 |
| **DAST (동적 침투 테스트)** | **불가** | 기능 자체가 없음 — VulChk 독보적 영역 |
| **Container/IaC 분석** | **불가** | 기능 자체가 없음 |
| **공격 시나리오 설계** | **불가** | 기능 자체가 없음 |
| **브라우저 기반 테스트** | **불가** | 기능 자체가 없음 |

### 4.4 "통합 사용" 가이드 — VulChk의 새로운 포지셔닝 기회

VulChk가 Claude Code Security와의 공존을 **공식적으로 권장**하는 것이 전략적으로 유리하다:

```markdown
## 추천 보안 워크플로우

1. 개발 중: `vulchk codeinspector`로 전체 보안 감사
   - 의존성 CVE, 시크릿, 코드 패턴, 컨테이너 보안 한 번에 검사

2. PR 제출 시: Claude Code Security Review GitHub Action
   - 변경된 코드의 SAST 자동 리뷰 (인라인 코멘트)

3. 배포 전: `vulchk hacksimulator`로 침투 테스트
   - 실제 공격 시뮬레이션으로 런타임 취약점 확인
```

이 포지셔닝은:
- Claude Code Security를 적으로 만들지 않고 동반자로 만든다
- VulChk의 고유 영역(SCA, Secrets, DAST, Container)을 명확히 한다
- Anthropic 생태계와의 정렬을 보여준다

---

## 5. VulChk가 Claude Code Security에서 즉시 배울 점

### 5.1 Hard Exclusion Rules (정규식 기반 FP 필터)

Claude Code Security의 `findings_filter.py`에는 7개 카테고리의 정규식 FP 필터가 있다.
VulChk의 codeinspector 병합 단계에서 유사한 하드 필터를 추가하면
LLM 호출 없이도 명백한 FP를 빠르게 제거할 수 있다.

### 5.2 Confidence 스코어

Claude Code Security는 모든 finding에 0.7-1.0 confidence 스코어를 부여하고,
0.7 미만은 자동 제외한다. VulChk 리포트에도 confidence 등급을 추가해야 한다.

### 5.3 커스텀 스캔 프로필

`custom-security-scan-instructions` 파일로 조직별 보안 카테고리를 추가할 수 있다.
VulChk도 `.vulchk/scan-profile.md` 같은 커스텀 프로필 지원을 고려할 수 있다.

### 5.4 Explicit Exclusion 리스트

Claude Code Security의 프롬프트에는 매우 상세한 "보고하지 말 것" 리스트가 있다:
- 환경변수는 신뢰할 수 있는 값 (공격 벡터 아님)
- React/Angular는 기본적으로 XSS에 안전
- 클라이언트 사이드 코드에서 인증 체크 부재는 취약점 아님
- GitHub Action 워크플로우의 대부분 취약점은 실무에서 악용 불가
- 셸 스크립트의 커맨드 인젝션은 대부분 실무에서 악용 불가

이 "precedents" 리스트를 VulChk의 code-pattern-scanner 프롬프트에도 반영하면
FP를 크게 줄일 수 있다.

---

## 6. 위협 재평가

### 6.1 위협 평가 변천 (투명한 기록)

| 단계 | 평가 | 근거 | 문제점 |
|------|------|------|-------|
| **1차 (초기 조사)** | 최대 위협 | 경쟁사 조사 시 직관적 판단 | 근거 불충분 |
| **2차 (GitHub Action 분석)** | 중간 위협 (하향) | `findings_filter.py`가 secrets/SCA 제외 | Action ≠ 제품을 혼동 |
| **3차 (제품 공식 확인)** | **높은 위협 (상향)** | Anthropic 공식 페이지에서 secrets, SCA 지원 확인 | **현재 최종 평가** |

| 항목 | 2차 평가 (GitHub Action 기반) | 3차 평가 (제품 공식 확인) |
|------|---------------------------|----------------------|
| **위협 수준** | 중간 위협 — 기능 좁음 | **높은 위협** — SAST + secrets + SCA 커버 |
| **기능 범위** | SAST 전용 | SAST + hardcoded secrets + dependency 취약점 |
| **비용** | GitHub Action은 API 비용 별도 | 제품은 Enterprise/Team 구독 내 포함 |
| **FP 품질** | Hard Rules 단순 정규식 | 제품은 Opus 4.6 다단계 검증, 500+ 실적 |
| **확장 가능성** | SCA/DAST 흔적 없음 | 이미 secrets/SCA 포함. DAST는 여전히 없음 |

### 6.2 VulChk 에이전트별 중복도 정직한 평가

| VulChk 에이전트 | Claude Code Security 중복도 | VulChk 고유 가치 | 위험 수준 |
|---------------|--------------------------|----------------|---------|
| **code-pattern-scanner** | 🔴 높음 — 핵심 기능 직접 겹침 | CoT taint analysis, FP precedents | **위험** |
| **secrets-scanner** (소스코드) | 🟡 중간 — hardcoded secrets 공식 지원 | 패턴+엔트로피 하이브리드, .env 심층 | **주의** |
| **secrets-scanner** (git history) | 🟢 없음 — 과거 커밋 추적 없음 | git log 전체 스캔, 삭제된 시크릿 | **안전** |
| **dependency-auditor** | 🟡 중간 — dependency 취약점 공식 지원 | OSV API 정밀 CVE (버전 매칭+CVSS) | **주의** |
| **container-cicd-scanner** | 🟢 낮음 — 전문 분석 없음 | Dockerfile, K8s manifest, CI/CD | **안전** |
| **attack-planner** | 🟢 없음 — 공격 설계 없음 | 다단계 시나리오 + 사용자 승인 | **매우 안전** |
| **attack-executor** | 🟢 없음 — DAST 없음 | HTTP + 브라우저 실제 침투 | **매우 안전** |

### 6.3 VulChk의 실질적 경쟁 우위 (정정 반영)

**여전히 유효한 우위:**

1. **DAST 독보적 영역**: attack-planner + executor의 다단계 공격 시뮬레이션은 Claude Code Security에 전혀 없는 고유 기능. Vercel/K8s에 배포된 앱의 실제 런타임 취약점을 테스트할 수 있는 유일한 도구.

2. **정밀 SCA**: OSV API를 통한 정확한 버전 매칭 + CVSS 스코어 vs Claude Code Security의 LLM 추론 기반 탐지. API 기반이 더 정확하고 신뢰할 수 있음.

3. **Git history 시크릿**: 과거 커밋에서 삭제된 시크릿을 추적하는 기능은 Claude Code Security에 없음.

4. **Container/K8s 전문 분석**: Vercel/K8s 환경의 Dockerfile, K8s manifest, CI/CD 파이프라인 전문 분석.

5. **비용 우위 (GitHub Action 경로 한정)**: VulChk는 구독 내, GitHub Action은 API 비용 별도.

**약화된 우위 (정직한 인정):**

1. ~~SCA + Secrets 고유 영역~~ → Claude Code Security가 기본 탐지를 공식 지원하므로 "고유"가 아님. 다만 VulChk의 접근 방식(OSV API, 패턴+엔트로피)이 더 정밀할 수 있음.

2. ~~5개 에이전트 > 1개 프롬프트~~ → SAST 영역에서 Opus 4.6 다단계 검증이 VulChk의 단일 에이전트 CoT보다 우수할 가능성이 있음. 에이전트 수가 아닌 분석 품질로 비교해야 함.

3. ~~비용 우위 (제품 경로)~~ → Claude Code Security 제품도 Enterprise/Team 구독에 포함 (추가 비용 없음). 양측 모두 구독 내 동작.
