# Code Inspector — 상세 설계

## 개요

`/vulchk.codeinspector`는 현재 프로젝트의 정적 보안 분석을 수행한다.
`vulchk-codeinspector` SKILL.md가 오케스트레이터 역할을 하며, 최대 5개의
서브에이전트를 **병렬로** 실행한 후 결과를 하나의 리포트로 병합한다.

## 전체 실행 시퀀스

```mermaid
sequenceDiagram
    participant 사용자
    participant Skill as codeinspector<br>SKILL.md
    participant A1 as dependency-<br>auditor
    participant A2 as code-pattern-<br>scanner
    participant A3 as secrets-<br>scanner
    participant A4 as git-history-<br>auditor
    participant A5 as container-<br>security

    사용자->>Skill: /vulchk.codeinspector

    rect rgb(240, 248, 255)
        Note over Skill: Step 0: .vulchk/config.json 읽기
        Skill->>Skill: 설정 로드 → language, version
    end

    rect rgb(240, 248, 255)
        Note over Skill: Step 1: 기술 스택 감지
        Skill->>Skill: Glob으로 매니페스트 탐색<br>(package.json, pyproject.toml, go.mod, ...)
        Skill->>Skill: 주요 설정 파일 읽기
        Skill-->>사용자: 감지된 스택 + 분석 계획 표시
    end

    rect rgb(255, 248, 240)
        Note over Skill,A5: Step 2: 서브에이전트 병렬 실행
        par 에이전트 1
            Skill->>A1: Task → vulchk-dependency-auditor
            A1->>A1: 매니페스트 탐지 → 의존성 추출 → OSV API 조회
            A1-->>Skill: DEP-{NNN} 발견 사항
        and 에이전트 2
            Skill->>A2: Task → vulchk-code-pattern-scanner
            A2->>A2: 스택 감지 → OWASP 패턴 Grep → 프레임워크별 검사
            A2-->>Skill: CODE-{NNN} 발견 사항
        and 에이전트 3
            Skill->>A3: Task → vulchk-secrets-scanner
            A3->>A3: .gitignore 검증 → 시크릿 스캔 → 프론트엔드 노출 검사
            A3-->>Skill: SEC-{NNN} 발견 사항
        and 에이전트 4
            Skill->>A4: Task → vulchk-git-history-auditor
            A4->>A4: git log -p -S로 패턴 검색 → .env 이력 확인
            A4-->>Skill: GIT-{NNN} 발견 사항
        and 에이전트 5 (조건부)
            Skill->>A5: Task → vulchk-container-security-analyzer
            Note over A5: Dockerfile/K8s가 있을 때만 실행
            A5->>A5: Dockerfile 검사 → Compose 검사 → K8s 검사
            A5-->>Skill: CTR-{NNN} 발견 사항
        end
    end

    rect rgb(240, 255, 240)
        Note over Skill: Step 3: 결과 병합
        Skill->>Skill: 중복 제거 (같은 file:line)
        Skill->>Skill: 순차 번호 부여
        Skill->>Skill: 심각도 순 정렬
    end

    rect rgb(240, 255, 240)
        Note over Skill: Step 4: 리포트 생성
        Skill->>Skill: mkdir -p ./security-report
        Skill->>Skill: codeinspector-{timestamp}.md 작성
    end

    Skill-->>사용자: Step 5: 요약 표시
```

## 단계별 알고리즘

### Step 0: 설정 읽기

```
.vulchk/config.json 읽기
  → 추출: language (en|ko|ja|zh), version
  → 파일 없으면: "en"으로 기본 설정, `vulchk init` 실행 권고 경고
```

### Step 1: 기술 스택 감지

스킬이 Glob을 사용해 프로젝트 루트에서 다음 파일들을 확인한다:

```mermaid
flowchart LR
    subgraph 탐지
        G["Glob 스캔"] --> PJ["package.json?"]
        G --> PY["pyproject.toml?<br>requirements.txt?"]
        G --> GO["go.mod?"]
        G --> RS["Cargo.toml?"]
        G --> DC["Dockerfile?"]
        G --> K8["k8s/ 매니페스트?"]
        G --> VC["vercel.json?"]
    end

    PJ --> |의존성 읽기| FW1["Express? Next.js?<br>React? Fastify?"]
    PY --> |의존성 읽기| FW2["FastAPI? Django?<br>Flask?"]

    FW1 --> Stack["감지된 스택"]
    FW2 --> Stack
    GO --> Stack
    RS --> Stack
    DC --> Stack
    K8 --> Stack
    VC --> Stack
```

감지된 스택에 따라 결정되는 것:
- 어떤 서브에이전트를 실행할지 (container-security는 조건부)
- 각 서브에이전트에 전달할 컨텍스트 (프레임워크별 검사 항목)

### Step 2: 서브에이전트 병렬 실행

해당하는 모든 에이전트가 **하나의 메시지에서** (여러 Task 도구 호출)
실행된다. 즉, 동시에 병렬로 실행된다.

---

## 서브에이전트 1: Dependency Auditor

**파일**: `vulchk-dependency-auditor.md`
**발견 사항 접두사**: `DEP-{NNN}`
**주요 도구**: Bash (curl로 OSV API 호출)

### 알고리즘

```mermaid
flowchart TD
    Start([시작]) --> Detect["Step 1: Glob으로 매니페스트 파일 탐색<br>package.json, requirements.txt, go.mod, ..."]
    Detect --> Extract["Step 2: 매니페스트 읽기<br>(패키지명, 버전, 에코시스템) 튜플 추출"]

    Extract --> LockCheck{"Lock 파일<br>존재?"}
    LockCheck -->|있음| UseLock["Lock 파일의 고정 버전 사용"]
    LockCheck -->|없음| UseManifest["매니페스트의 버전 범위 사용"]
    UseLock --> BuildList["의존성 목록 구성"]
    UseManifest --> BuildList

    BuildList --> BatchCheck{"5개 이상?"}
    BatchCheck -->|예| BatchQuery["배치 쿼리:<br>POST /v1/querybatch<br>요청당 최대 50개"]
    BatchCheck -->|아니오| SingleQuery["개별 쿼리:<br>POST /v1/query<br>의존성당 1회"]

    BatchQuery --> ParseResponse
    SingleQuery --> ParseResponse

    ParseResponse["OSV 응답 파싱:<br>1. vulns[] 배열 추출<br>2. aliases[]에서 CVE ID 획득<br>3. severity[]에서 CVSS 점수 획득<br>4. affected[].ranges[].events[]에서<br>   수정 버전 획득"]

    ParseResponse --> APIFail{"API 오류?"}
    APIFail -->|예| Fallback["폴백: npm audit /<br>pip-audit / govulncheck"]
    APIFail -->|아니오| FormatFindings

    Fallback --> FormatFindings["DEP-{NNN} 형식으로 포맷"]
    FormatFindings --> Summary["요약 반환"]
    Summary --> End([끝])
```

### OSV API 요청/응답 예시

**요청** (단일):
```json
POST https://api.osv.dev/v1/query
{
  "package": { "name": "express", "ecosystem": "npm" },
  "version": "4.17.1"
}
```

**응답** (주요 필드):
```json
{
  "vulns": [
    {
      "id": "GHSA-xxxx-xxxx-xxxx",
      "aliases": ["CVE-2024-xxxxx"],
      "summary": "...",
      "severity": [{ "score": "CVSS:3.1/AV:N/AC:L/..." }],
      "affected": [{
        "ranges": [{
          "events": [
            { "introduced": "0" },
            { "fixed": "4.18.0" }
          ]
        }]
      }]
    }
  ]
}
```

### 에코시스템 매핑

| 매니페스트 파일 | OSV 에코시스템 |
|--------------|--------------|
| package.json / yarn.lock | `npm` |
| requirements.txt / Pipfile / pyproject.toml | `PyPI` |
| go.mod | `Go` |
| Cargo.toml | `crates.io` |
| pom.xml / build.gradle | `Maven` |
| Gemfile | `RubyGems` |
| composer.json | `Packagist` |

### CVSS → 심각도 매핑

| CVSS 점수 | 심각도 라벨 |
|----------|-----------|
| >= 9.0 | Critical |
| 7.0 - 8.9 | High |
| 4.0 - 6.9 | Medium |
| 0.1 - 3.9 | Low |

---

## 서브에이전트 2: Code Pattern Scanner

**파일**: `vulchk-code-pattern-scanner.md`
**발견 사항 접두사**: `CODE-{NNN}`
**주요 도구**: Grep (정규식 패턴 매칭)

### 알고리즘

```mermaid
flowchart TD
    Start([시작]) --> DetectStack["Step 1: 매니페스트에서 스택 감지"]
    DetectStack --> Scan["Step 2: OWASP Top 10 패턴 Grep"]

    Scan --> A01["A01: 접근 제어 미흡<br>라우트에 인증 미들웨어 누락"]
    Scan --> A02["A02: 암호화 실패<br>MD5, SHA1, Math.random()"]
    Scan --> A03["A03: 인젝션<br>SQLi, XSS, 커맨드 인젝션"]
    Scan --> A04["A04: 안전하지 않은 설계<br>스택 트레이스 노출"]
    Scan --> A05["A05: 보안 설정 오류<br>CORS 와일드카드, helmet 미사용"]
    Scan --> A07["A07: 인증 실패<br>약한 비밀번호, JWT 문제"]
    Scan --> A08["A08: 데이터 무결성 실패<br>안전하지 않은 역직렬화"]
    Scan --> A09["A09: 로깅 실패<br>로깅 미구현"]
    Scan --> A10["A10: SSRF<br>사용자 입력 URL을 fetch/axios에 사용"]

    A01 --> FW["Step 3: 프레임워크별 검사"]
    A02 --> FW
    A03 --> FW
    A04 --> FW
    A05 --> FW
    A07 --> FW
    A08 --> FW
    A09 --> FW
    A10 --> FW

    FW --> Express["Express: helmet, rate-limit,<br>child_process 사용"]
    FW --> NextJS["Next.js: API 라우트 인증,<br>NEXT_PUBLIC_ 노출, middleware"]
    FW --> FastAPI["FastAPI: Depends(),<br>CORS, Pydantic 유효성 검증"]
    FW --> Memory["C/C++: malloc/free,<br>strcpy, gets()"]

    Express --> Context["주변 코드 10-20줄 읽기<br>(오탐 필터링)"]
    NextJS --> Context
    FastAPI --> Context
    Memory --> Context

    Context --> Format["CODE-{NNN} 형식으로 포맷"]
    Format --> End([끝])
```

### 주요 패턴 카테고리

각 OWASP 카테고리에 특정 정규식 패턴이 있다. 스캐너는 모든 소스 파일에 대해
Grep을 실행하되, 다음은 **제외**한다:
`node_modules/`, `.git/`, `vendor/`, `__pycache__/`, `dist/`, `build/`, `*.min.js`

패턴이 매칭되면, 에이전트가 **주변 컨텍스트 (10-20줄)**을 읽어서
실제 취약점인지 판단한다. 예:
- `innerHTML =`이지만 입력이 sanitize된 경우 → 취약점 아님
- `helmet`을 import했지만 `app.use(helmet())`을 호출하지 않은 경우 → 취약점

---

## 서브에이전트 3: Secrets Scanner

**파일**: `vulchk-secrets-scanner.md`
**발견 사항 접두사**: `SEC-{NNN}`
**주요 도구**: Grep + Glob

### 알고리즘

```mermaid
flowchart TD
    Start([시작]) --> GitIgnore["Step 1: .gitignore 읽기<br>.env, *.pem, *.key 등 포함 여부 확인"]

    GitIgnore --> NoGitIgnore{".gitignore<br>없음?"}
    NoGitIgnore -->|예| HighFinding["HIGH 심각도로 보고"]
    NoGitIgnore -->|아니오| MissingEntries["누락 항목별 보고"]

    HighFinding --> SecretFiles
    MissingEntries --> SecretFiles

    SecretFiles["Step 2: 비밀 파일 Glob 검색<br>.env, *.pem, *.key, credentials.json"]
    SecretFiles --> Exists{"파일 존재 AND<br>.gitignore에 없음?"}
    Exists -->|예| HighFinding2["HIGH로 보고"]
    Exists -->|아니오| Skip["건너뛰기"]

    HighFinding2 --> CodeScan
    Skip --> CodeScan

    CodeScan["Step 3: 소스 코드에서 시크릿 Grep"]
    CodeScan --> AWS["AKIA... (AWS 키)"]
    CodeScan --> GH["ghp_... (GitHub 토큰)"]
    CodeScan --> Stripe["sk_live_... (Stripe 키)"]
    CodeScan --> OpenAI["sk-... (OpenAI 키)"]
    CodeScan --> Password["password= / secret= / api_key="]
    CodeScan --> PrivKey["BEGIN PRIVATE KEY"]
    CodeScan --> ConnStr["postgres://user:pass@..."]

    AWS --> Frontend
    GH --> Frontend
    Stripe --> Frontend
    OpenAI --> Frontend
    Password --> Frontend
    PrivKey --> Frontend
    ConnStr --> Frontend

    Frontend["Step 4: 프론트엔드 노출 검사<br>public/, static/, assets/ 내 시크릿<br>NEXT_PUBLIC_에 비밀값 포함 여부"]
    Frontend --> Format["SEC-{NNN} 형식으로 포맷<br>값은 반드시 마스킹"]
    Format --> End([끝])
```

### 테스트 파일 처리

`*test*`, `*spec*`, `*mock*`, `*fixture*` 패턴에 매칭되는 파일의 발견 사항은
HIGH 대신 LOW 심각도로 하향 처리된다 (예: 테스트 파일의 `password = "test123"`).

---

## 서브에이전트 4: Git History Auditor

**파일**: `vulchk-git-history-auditor.md`
**발견 사항 접두사**: `GIT-{NNN}`
**주요 도구**: Bash (git log -p -S)

### 알고리즘

```mermaid
flowchart TD
    Start([시작]) --> GitCheck["Step 1: git rev-parse --is-inside-work-tree"]
    GitCheck --> IsRepo{"Git 저장소?"}
    IsRepo -->|아니오| SkipAll["반환: SKIPPED"]
    IsRepo -->|예| SearchPatterns

    SearchPatterns["Step 2: 커밋 diff에서 시크릿 검색"]
    SearchPatterns --> P1["git log -p -S 'AKIA' (AWS 키)"]
    SearchPatterns --> P2["git log -p -S 'BEGIN RSA PRIVATE KEY'"]
    SearchPatterns --> P3["git log -p -S 'password' -- *.env *.yaml"]
    SearchPatterns --> P4["git log -p -S 'api_key' -- *.env *.yaml"]

    P1 --> Removed
    P2 --> Removed
    P3 --> Removed
    P4 --> Removed

    Removed["Step 3: 삭제된 비밀 파일 검색<br>git log --diff-filter=D -- '.env' '*.pem'"]
    Removed --> EnvHistory["Step 4: .env 커밋 이력 확인<br>git log --all -- '.env'"]

    EnvHistory --> Analyze["Step 5: 발견된 각 시크릿에 대해:"]
    Analyze --> InHead{"현재 HEAD에<br>여전히 존재?"}
    InHead -->|예| Critical["CRITICAL 심각도"]
    InHead -->|아니오| High["HIGH 심각도<br>(git 이력에 여전히 남아있음)"]

    Critical --> Format["GIT-{NNN} 형식으로 포맷"]
    High --> Format
    Format --> End([끝])
```

### 제한 사항

- 최대 500개 최근 커밋만 검색
- git 검색 출력은 `head -200`으로 제한 (타임아웃 방지)
- 커밋 5000개 초과 시 전용 도구(trufflehog, gitleaks) 사용 권장

---

## 서브에이전트 5: Container Security Analyzer

**파일**: `vulchk-container-security-analyzer.md`
**발견 사항 접두사**: `CTR-{NNN}`
**주요 도구**: Read + Grep
**실행 조건**: Dockerfile, docker-compose, 또는 K8s 매니페스트가 감지된 경우에만

### 알고리즘

```mermaid
flowchart TD
    Start([시작]) --> FindFiles["Step 1: Glob으로 컨테이너 파일 탐색"]
    FindFiles --> Found{"파일 발견?"}
    Found -->|아니오| Skip["반환: SKIPPED"]
    Found -->|예| DockerCheck

    DockerCheck["Step 2: Dockerfile 분석"]
    DockerCheck --> Base["2a: 베이스 이미지 문제<br>:latest 태그, 풀 OS 이미지"]
    DockerCheck --> Priv["2b: 권한 문제<br>root로 실행, USER 지시자 없음"]
    DockerCheck --> BuildSecrets["2c: 빌드 시 시크릿<br>ARG PASSWORD, COPY .env"]
    DockerCheck --> BestPractice["2d: 모범 사례<br>curl|sh, ADD http, EXPOSE 22"]
    DockerCheck --> MultiStage["2e: 멀티스테이지 빌드 확인"]

    Base --> ComposeCheck
    Priv --> ComposeCheck
    BuildSecrets --> ComposeCheck
    BestPractice --> ComposeCheck
    MultiStage --> ComposeCheck

    ComposeCheck["Step 3: Docker Compose 분석<br>privileged, host 네트워크, docker.sock"]
    ComposeCheck --> K8sCheck

    K8sCheck["Step 4: Kubernetes 매니페스트 분석"]
    K8sCheck --> PodSec["4a: Pod 보안<br>privileged, runAsRoot, capabilities"]
    K8sCheck --> Resources["4b: 리소스 제한<br>cpu/memory limits 누락"]
    K8sCheck --> Network["4c: 네트워크 정책<br>NetworkPolicy 누락"]
    K8sCheck --> K8sSecrets["4d: 시크릿 관리<br>매니페스트 내 평문 시크릿"]
    K8sCheck --> ImageSec["4e: 이미지 보안<br>:latest, imagePullPolicy"]

    PodSec --> Vercel
    Resources --> Vercel
    Network --> Vercel
    K8sSecrets --> Vercel
    ImageSec --> Vercel

    Vercel["Step 5: Vercel 전용 (감지 시)<br>headers, rewrites, functions"]
    Vercel --> Format["CTR-{NNN} 형식으로 포맷"]
    Format --> End([끝])
```

---

## Step 3: 결과 병합

모든 서브에이전트가 반환된 후, 오케스트레이터 스킬이:

1. **중복 제거**: 같은 `file:line`을 참조하는 발견 사항 통합
   (예: secrets-scanner와 code-pattern-scanner가 같은 하드코딩 키를 발견한 경우)
2. **순차 번호 부여**: 에이전트별 접두사를 1, 2, 3...으로 대체
3. **심각도 순 정렬**: Critical > High > Medium > Low > Informational
4. **심각도별 합계** 계산

## Step 4: 리포트 생성

```mermaid
flowchart TD
    Start([병합된 발견 사항]) --> MkDir["mkdir -p ./security-report"]
    MkDir --> Timestamp["date +%Y-%m-%d-%H%M%S"]
    Timestamp --> ReadLang["config에서 language 읽기"]

    ReadLang --> Translate["SKILL.md 내 i18n 테이블<br>참조"]
    Translate --> Write["리포트 파일 작성:<br>codeinspector-{timestamp}.md"]

    Write --> Structure["리포트 구조"]
    Structure --> S1["# 제목 (번역됨)"]
    Structure --> S2["## 요약<br>심각도 카운트 + 설명"]
    Structure --> S3["## 발견 사항 요약<br>표: 심각도, 분류, 위치"]
    Structure --> S4["## 상세 발견 사항<br>각 항목의 증거 + 개선 방안"]
    Structure --> S5["## 분석 범위<br>표: 검사 항목, 스캔 파일 수"]
    Structure --> S6["## 권장 사항<br>우선순위 상위 3-5개"]

    S1 --> Redact["모든 민감값에<br>마스킹 규칙 적용"]
    S2 --> Redact
    S3 --> Redact
    S4 --> Redact
    S5 --> Redact
    S6 --> Redact

    Redact --> Save["./security-report/에 저장"]
    Save --> End([끝])
```

### i18n 번역

SKILL.md 파일에 `en`, `ko`, `ja` 컬럼이 있는 번역 테이블이 포함되어 있다.
모든 섹션 헤더와 라벨이 이 테이블에서 조회된다. 예시:

| en | ko | ja |
|---|---|---|
| Executive Summary | 요약 | エグゼクティブサマリー |
| Findings Summary | 발견 사항 요약 | 検出事項サマリー |
| Severity | 심각도 | 深刻度 |

보안 용어 (CVE, XSS, CSRF, OWASP, CWE, SQLi, SSRF, IDOR)는 **절대 번역하지
않으며** 모든 언어에서 영어로 유지된다.

### 심각도 라벨

| en | ko | ja |
|---|---|---|
| Critical | Critical (치명적) | Critical (致命的) |
| High | High (높음) | High (高) |
| Medium | Medium (중간) | Medium (中) |
| Low | Low (낮음) | Low (低) |
| Informational | Informational (정보) | Informational (情報) |

## Step 5: 사용자 요약

리포트 작성 후 터미널에 간략 요약을 표시:
- 리포트 파일 경로
- 심각도별 카운트
- 우선순위 상위 3개 항목
- `/vulchk.hacksimulator`로 런타임 테스트 권고

## 에러 처리

- 서브에이전트가 실패하거나 타임아웃되면, **분석 범위** 표에서
  `SKIPPED`로 표기하고 다른 에이전트의 결과로 리포트를 계속 생성한다
- 분석 계획은 표시되지만 사용자 승인이 **필요 없다**
  (코드 점검은 비파괴적)
- 취약점이 발견되지 않더라도 어떤 검사를 수행했고 결과가
  깨끗했다는 내용의 리포트를 생성한다
