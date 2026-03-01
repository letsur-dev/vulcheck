# Hack Simulator — 상세 설계

## 개요

`/vulchk.hacksimulator`는 실행 중인 웹 애플리케이션에 대해 모의 침투 테스트를
수행한다. 정적 코드를 분석하는 codeinspector와 달리, 이 스킬은 실제 HTTP 요청을
타겟에 전송하고 런타임 취약점을 보고한다.

**핵심 안전장치:**
- localhost가 아닌 외부 타겟에 대해 인가(authorization) 경고
- 테스트 시작 전 공격 계획 승인 필수
- 모든 요청을 타임스탬프와 함께 로깅

## 전체 실행 시퀀스

```mermaid
sequenceDiagram
    participant 사용자
    participant Skill as hacksimulator<br>SKILL.md
    participant Planner as attack-<br>planner
    participant Executor as attack-<br>executor

    사용자->>Skill: /vulchk.hacksimulator [url]

    rect rgb(240, 248, 255)
        Note over Skill: Step 0: 설정 읽기
        Note over Skill: Step 1: 타겟 결정
        Note over Skill: Step 2: 인가 경고 (외부 타겟일 때)
        Note over Skill: Step 3: ratatosk-cli 확인
        Note over Skill: Step 4: 강도 선택
        Note over Skill: Step 5: 기존 codeinspector 리포트 확인
    end

    rect rgb(255, 248, 240)
        Note over Skill,Planner: Step 6: Attack Planner 실행
        Skill->>Planner: Task → vulchk-attack-planner
        Planner->>Planner: 패시브 정찰 (curl -sI)
        Planner->>Planner: 기술 핑거프린팅
        Planner->>Planner: API 엔드포인트 탐색
        Planner->>Planner: 공격 표면 매핑
        Planner->>Planner: 공격 계획 생성
        Planner-->>Skill: 공격 계획 문서
    end

    rect rgb(255, 240, 240)
        Note over Skill,사용자: Step 7: 승인 게이트
        Skill-->>사용자: 공격 계획 표시
        사용자->>Skill: "yes" (승인)
    end

    rect rgb(255, 248, 240)
        Note over Skill,Executor: Step 8: Attack Executor 실행
        Skill->>Executor: Task → vulchk-attack-executor
        Executor->>Executor: 패시브 테스트 실행
        Executor->>Executor: 액티브 프로빙 실행 (강도 >= 2)
        Executor->>Executor: 익스플로잇 실행 (강도 == 3)
        Executor->>Executor: 결과 + 공격 로그 정리
        Executor-->>Skill: 발견 사항 + 공격 로그
    end

    rect rgb(240, 255, 240)
        Note over Skill: Step 9: 리포트 생성
        Note over Skill: Step 10: 요약 표시
    end

    Skill-->>사용자: 요약 + 리포트 경로
```

## 단계별 알고리즘

### Step 0: 설정 읽기

```
.vulchk/config.json 읽기 → language, version
파일 없으면 → "en"으로 기본 설정, 경고 표시
```

### Step 1: 타겟 결정

```mermaid
flowchart TD
    Start([시작]) --> ArgCheck{"URL 인자<br>제공됨?"}

    ArgCheck -->|예| Validate["HTTP/HTTPS URL 유효성 검사"]
    Validate --> TestConn["curl -sI --max-time 10 URL"]
    TestConn --> Reachable{"타겟 접근<br>가능?"}
    Reachable -->|예| Step2["Step 2로 이동"]
    Reachable -->|아니오| Abort1["에러 표시:<br>Target Unreachable<br>중단"]

    ArgCheck -->|아니오| AskUser["사용자에게 질문:<br>1. 로컬 실행<br>2. URL 입력"]
    AskUser --> Option1{"사용자 선택?"}
    Option1 -->|옵션 1| DetectStart["시작 명령 감지:<br>package.json → npm run dev<br>pyproject.toml → uvicorn<br>docker-compose → docker compose up"]
    DetectStart --> StartBG["백그라운드로 프로젝트 실행:<br>npm run dev &"]
    StartBG --> WaitPort["대기 후 localhost:port 테스트<br>3000 (Next.js) / 8000 (FastAPI)"]
    WaitPort --> Step2

    Option1 -->|옵션 2| WaitURL["사용자 URL 입력 대기"]
    WaitURL --> Validate
```

### Step 2: 인가 확인

```mermaid
flowchart TD
    Target["타겟 URL"] --> IsLocal{"localhost 또는<br>127.0.0.1?"}
    IsLocal -->|예| Skip["경고 건너뛰기<br>(자기 앱 테스트)"]
    IsLocal -->|아니오| Warn["인가 경고 표시:<br>⚠ Authorization Required<br>미인가 테스트는 불법"]
    Warn --> Confirm{"사용자 'yes'<br>확인?"}
    Confirm -->|예| Proceed["진행"]
    Confirm -->|아니오| Abort["중단:<br>Penetration test aborted"]
```

### Step 3: ratatosk-cli 감지

```bash
which ratatosk 2>/dev/null && echo "FOUND" || echo "NOT_FOUND"
```

발견되면 추가 확인:
```bash
ls .claude/skills/ratatosk/ 2>/dev/null && echo "SKILLS_OK" || echo "NO_SKILLS"
```

`RATATOSK_AVAILABLE` 플래그를 설정한다. 미설치 시 HTTP 전용 테스트로
진행하며, 사용자에게 안내 메시지를 표시한다.

### Step 4: 강도 선택

사용자가 3단계 중 하나를 선택한다:

```mermaid
flowchart LR
    subgraph "1. Passive (패시브)"
        P1["헤더 핑거프린팅"]
        P2["보안 헤더 감사"]
        P3["쿠키 분석"]
        P4["CORS 정책"]
        P5["TLS/SSL 검사"]
        P6["기술 스택 식별"]
    end

    subgraph "2. Active (액티브)"
        A0["Passive 전체 +"]
        A1["XSS 반사 프로브"]
        A2["SQL injection 탐지"]
        A3["CSRF 토큰 검증"]
        A4["IDOR 테스트"]
        A5["인증 우회 시도"]
        A6["SSRF 탐지"]
        A7["파일 업로드 테스트"]
        A8["세션 관리 테스트"]
        A9["API 보안 테스트"]
    end

    subgraph "3. Aggressive (공격적)"
        AG0["Active 전체 +"]
        AG1["SQL injection 전체 추출"]
        AG2["XSS 익스플로잇"]
        AG3["커맨드 인젝션"]
        AG4["SSTI 익스플로잇"]
        AG5["JWT 크래킹"]
        AG6["레이스 컨디션 테스트"]
        AG7["체인 익스플로잇"]
    end
```

### Step 5: 기존 Code Inspector 리포트 확인

```bash
ls -t ./security-report/codeinspector-*.md 2>/dev/null | head -1
```

codeinspector 리포트가 존재하면, 발견 사항을 읽어서 attack planner에게
전달하여 공격 벡터의 우선순위를 결정한다. 이것이 **피드백 루프**를 형성한다:

```mermaid
flowchart LR
    CI["/vulchk.codeinspector<br>발견 사항"] -->|"CODE-001: /api/users에 SQLi"| Planner["Attack Planner"]
    Planner -->|"우선순위 1: /api/users SQLi 프로브"| Executor["Attack Executor"]
    Executor -->|"HSM-001: SQLi 확인됨"| Report["리포트"]
```

---

## 서브에이전트: Attack Planner

**파일**: `vulchk-attack-planner.md`
**호출 시점**: hacksimulator SKILL.md Step 6
**주요 도구**: Bash (curl로 정찰)
**출력**: 구조화된 공격 계획 문서

### 알고리즘

```mermaid
flowchart TD
    Start([시작]) --> Recon["Step 1: 패시브 정찰"]

    Recon --> Headers["1a: HTTP 헤더 분석<br>curl -sI {url}"]
    Recon --> Fingerprint["1b: 기술 핑거프린팅<br>robots.txt, sitemap.xml, security.txt"]
    Recon --> CORS["1c: CORS 정책 확인<br>curl -H 'Origin: evil.com'"]
    Recon --> API["1d: API 엔드포인트 탐색<br>swagger.json, openapi.json, graphql"]
    Recon --> Errors["1e: 에러 페이지 분석<br>GET /nonexistent-path"]
    Recon --> TLS["1f: TLS/SSL 검사"]

    Headers --> SourceRecon
    Fingerprint --> SourceRecon
    CORS --> SourceRecon
    API --> SourceRecon
    Errors --> SourceRecon
    TLS --> SourceRecon

    SourceRecon{"Step 2: 소스 코드<br>접근 가능?<br>(localhost 타겟)"}
    SourceRecon -->|예| ReadRoutes["라우트 정의 읽기<br>인증 메커니즘 확인<br>DB 쿼리 패턴 탐지"]
    SourceRecon -->|아니오| MapSurface

    ReadRoutes --> CIReport{"codeinspector<br>리포트 존재?"}
    CIReport -->|예| MapFindings["코드 발견 사항 → 공격 벡터 매핑<br>SQLi → SQLi 프로브<br>XSS → XSS 페이로드<br>인증 누락 → 미인증 접근"]
    CIReport -->|아니오| MapSurface

    MapFindings --> MapSurface["Step 3: 공격 표면 매핑<br>페이지, API 엔드포인트, 폼,<br>업로드, 인증, URL 파라미터, WebSocket"]

    MapSurface --> GenPlan["Step 4: 강도별 계획 생성"]
    GenPlan --> Passive["Passive 계획:<br>3개 단계, 정찰만"]
    GenPlan --> Active["Active 계획:<br>5개 단계, 안전한 프로브"]
    GenPlan --> Aggressive["Aggressive 계획:<br>8개 단계, 전체 익스플로잇"]

    Passive --> Output["Step 5: 출력 포맷"]
    Active --> Output
    Aggressive --> Output
    Output --> End([끝])
```

### codeinspector 발견 사항 → 공격 벡터 매핑

| 코드 발견 사항 | 공격 벡터 |
|---|---|
| SQL injection 패턴 (CODE-*) | 해당 엔드포인트에 SQLi 프로브 |
| XSS 취약점 (CODE-*) | 해당 입력에 XSS 페이로드 테스트 |
| 인증 미들웨어 누락 (CODE-*) | 미인증 접근 시도 |
| CORS 설정 오류 (CODE-*) | 자격 증명 포함 크로스 오리진 요청 |
| SSRF 패턴 (CODE-*) | 콜백 URL로 SSRF 프로브 |
| 하드코딩된 시크릿 (SEC-*) | 발견된 자격 증명으로 접근 |
| CSRF 토큰 누락 (CODE-*) | CSRF 위조 시도 |

---

## 서브에이전트: Attack Executor

**파일**: `vulchk-attack-executor.md`
**발견 사항 접두사**: `HSM-{NNN}`
**호출 시점**: hacksimulator SKILL.md Step 8 (계획 승인 후)
**주요 도구**: Bash (curl로 공격 수행)

### 알고리즘

```mermaid
flowchart TD
    Start([시작]) --> InitLog["Step 1: 공격 로그 초기화<br>date +'%Y-%m-%d %H:%M:%S'"]

    InitLog --> PassiveTests["Step 2: 패시브 테스트 (항상 실행)"]

    PassiveTests --> PT1["2a: 보안 헤더 감사<br>8개 헤더 확인"]
    PassiveTests --> PT2["2b: 쿠키 보안<br>HttpOnly, Secure, SameSite"]
    PassiveTests --> PT3["2c: CORS 정책 테스트"]
    PassiveTests --> PT4["2d: 정보 노출<br>.git/HEAD, .env, admin/, phpinfo"]
    PassiveTests --> PT5["2e: TLS/SSL 분석"]
    PassiveTests --> PT6["2f: 에러 페이지 분석"]

    PT1 --> IntCheck1{"강도 >= Active?"}
    PT2 --> IntCheck1
    PT3 --> IntCheck1
    PT4 --> IntCheck1
    PT5 --> IntCheck1
    PT6 --> IntCheck1

    IntCheck1 -->|"아니오 (Passive)"| Compile["Step 5: 결과 정리"]
    IntCheck1 -->|예| ActiveTests["Step 3: 액티브 프로브"]

    ActiveTests --> AT1["3a: XSS 반사 테스트<br>마커 주입 → 반사 여부 확인"]
    ActiveTests --> AT2["3b: SQL injection<br>에러 기반, 불리언 기반, 시간 기반"]
    ActiveTests --> AT3["3c: CSRF 토큰 검증"]
    ActiveTests --> AT4["3d: 인증 테스트<br>기본 자격증명, JWT none 알고리즘"]
    ActiveTests --> AT5["3e: IDOR 테스트"]
    ActiveTests --> AT6["3f: SSRF 프로빙"]
    ActiveTests --> AT7["3g: HTTP 메서드 테스트<br>OPTIONS, TRACE"]
    ActiveTests --> AT8["3h: 세션 관리"]
    ActiveTests --> AT9["3i: GraphQL 테스트"]
    ActiveTests --> AT10["3j: 파일 업로드 테스트"]

    AT1 --> IntCheck2{"강도 == Aggressive?"}
    AT2 --> IntCheck2
    AT3 --> IntCheck2
    AT4 --> IntCheck2
    AT5 --> IntCheck2
    AT6 --> IntCheck2
    AT7 --> IntCheck2
    AT8 --> IntCheck2
    AT9 --> IntCheck2
    AT10 --> IntCheck2

    IntCheck2 -->|"아니오 (Active)"| Compile
    IntCheck2 -->|예| AggressiveTests["Step 4: Aggressive 익스플로잇"]

    AggressiveTests --> EX1["4a: SQL injection 추출<br>UNION SELECT, 스키마 열거"]
    AggressiveTests --> EX2["4b: XSS 익스플로잇<br>스크립트 실행 증명"]
    AggressiveTests --> EX3["4c: SSRF 심층 프로브<br>클라우드 메타데이터, 내부 포트"]
    AggressiveTests --> EX4["4d: 커맨드 인젝션<br>시간 기반, OOB 탐지"]
    AggressiveTests --> EX5["4e: JWT 익스플로잇<br>'none' 알고리즘, 토큰 위조"]
    AggressiveTests --> EX6["4f: 레이스 컨디션 테스트"]

    EX1 --> Compile
    EX2 --> Compile
    EX3 --> Compile
    EX4 --> Compile
    EX5 --> Compile
    EX6 --> Compile

    Compile --> Findings["5a: HSM-{NNN} 형식으로 포맷"]
    Compile --> Log["5b: 공격 로그 정리<br>(시간순, 모든 시도 포함)"]
    Compile --> Summary["5c: 요약 반환"]

    Findings --> End([끝])
    Log --> End
    Summary --> End
```

### 공격 로그 형식

타겟에 보낸 **모든 요청**이 기록된다:

```
| # | 타임스탬프 | 벡터 | 엔드포인트 | 페이로드 | 상태 | 결과 |
|---|-----------|------|----------|---------|------|------|
| 1 | 2025-01-01 10:00:01 | http-fetch | GET / | (없음) | 200 | 헤더 수집됨 |
| 2 | 2025-01-01 10:00:02 | http-fetch | GET /robots.txt | (없음) | 200 | 경로 발견됨 |
```

벡터 종류:
- `http-fetch` — curl/fetch HTTP 요청
- `browser` — ratatosk-cli 브라우저 자동화
- `api-probe` — API 전용 테스트 (GraphQL, REST)

### 테스트 페이로드 규칙

모든 테스트 페이로드는 `vulchk-` 접두사를 사용하여 식별:
- XSS: `vulchk-xss-probe-12345`
- 파일 업로드: `/tmp/vulchk-test.txt`
- 에러 페이지: `/vulchk-nonexistent-test-path`

### 안전 메커니즘

| 메커니즘 | 설명 |
|---------|------|
| Rate limiting 감지 | 429 응답 시 일시 중지, 로그에 기록 |
| WAF 감지 | 프로브에 403 응답 시 WAF 제품 식별 |
| 비파괴적 페이로드 | 접근 가능성만 증명, 실제 사용자 데이터 추출 안 함 |
| 마스킹 | 발견된 모든 자격 증명은 마스킹 처리 |
| DoS 금지 | 스레드 고갈이나 리소스 플러딩 금지 |
| 정리 | 테스트 후 임시 파일 삭제 |

---

## Step 7: 승인 게이트

핵심 안전장치이다. 어떤 테스트가 수행될지에 대한 전체 세부사항을
포함한 공격 계획이 사용자에게 표시된다.
사용자가 명시적으로 승인할 때까지 **타겟에 어떠한 요청도 전송되지 않는다**.

```mermaid
flowchart TD
    PlanReceived["planner 에이전트로부터<br>공격 계획 수신"] --> Display["사용자에게 표시:<br>타겟, 강도, 단계별 내용,<br>엔드포인트 수, 테스트 수"]
    Display --> Approve{"사용자 승인?"}
    Approve -->|"yes"| Execute["Step 8 진행:<br>executor 실행"]
    Approve -->|"no"| Reject["선택지 표시:<br>1. 강도 조정<br>2. 타겟 URL 변경<br>3. codeinspector 먼저 실행"]
    Reject --> Stop([중단])
```

## Step 9: 리포트 생성

codeinspector와 동일한 메커니즘 — SKILL.md의 i18n 번역 테이블 사용.
hacksimulator 전용 추가 섹션:

| 섹션 | 설명 |
|------|------|
| 공격 계획 요약 | 강도, codeinspector 기반 / 런타임 정찰 기반 여부 |
| 공격 로그 | 모든 테스트 시도의 시간순 전체 로그 |
| 테스트 범위 | 수행된 테스트, 건너뛴 테스트, 제약 사항 |
| 강도 라벨 | 언어별 번역 (Passive/Active/Aggressive) |

### 강도 라벨 (언어별)

| en | ko | ja |
|---|---|---|
| Passive | Passive (패시브) | Passive (パッシブ) |
| Active | Active (액티브) | Active (アクティブ) |
| Aggressive | Aggressive (공격적) | Aggressive (アグレッシブ) |

## Step 10: 정리

요약 표시 후:

1. 로컬 실행을 사용한 경우 (Step 1, 옵션 1), 백그라운드 서버 종료:
   ```bash
   kill %1 2>/dev/null
   ```

2. 테스트 중 생성된 임시 파일 정리:
   ```bash
   rm -f /tmp/vulchk-test.txt
   ```

## Codeinspector vs Hacksimulator 비교

| 항목 | Codeinspector | Hacksimulator |
|------|-------------|--------------|
| 분석 유형 | 정적 (코드) | 동적 (런타임) |
| 대상 | 프로젝트 소스 파일 | 실행 중인 웹 애플리케이션 |
| 승인 필요 | 아니오 (비파괴적) | 예 (요청 전송) |
| 서브에이전트 | 5개 병렬 | 2개 순차 |
| 외부 네트워크 | OSV API만 | 타겟 URL + 정찰 |
| 출력 접두사 | DEP/CODE/SEC/GIT/CTR | HSM |
| 사전 데이터 | 없음 | codeinspector 리포트 활용 가능 |
| 벡터 | Grep, Read, Bash | curl, ratatosk (브라우저) |
