# Snyk Code & Semgrep 경쟁사 분석

> 조사일: 2026-03-02

---

## 1. Snyk Code

### 1.1 개요

Snyk Code는 Snyk 플랫폼의 SAST(Static Application Security Testing) 제품으로, **DeepCode AI** 엔진을 기반으로 한다. 2020년 Snyk이 DeepCode를 인수한 후, 기존 ML 기반 코드 분석 엔진을 Snyk 플랫폼에 통합하여 발전시켜 왔다.

핵심 특징:
- **2,500만 건 이상의 데이터플로우 케이스**로 학습된 ML 모델
- Symbolic AI + Generative AI 하이브리드 아키텍처
- 보안 연구원의 전문 지식과 ML을 결합하여 환각(hallucination) 없는 높은 정확도 보장
- 실시간 코드 스캔 (IDE에서 타이핑과 동시에 분석)

### 1.2 작동 방식: ML 기반 시맨틱 코드 분석

Snyk Code는 단순한 패턴 매칭이 아닌 **시맨틱(의미론적) 코드 분석**을 수행한다:

| 분석 기법 | 설명 |
|-----------|------|
| **데이터플로우 분석** | 소스에서 싱크까지 데이터 흐름을 추적. 여러 파일에 걸친 inter-file 분석 지원 |
| **테인트 분석** | AI 기반 외부 데이터 소스 학습으로 강력한 taint tracking |
| **API 사용 분석** | 잘못된 API 사용 및 안전하지 않은 함수 호출 탐지 |
| **제어 흐름 분석** | null dereference, race condition 등 가능한 모든 제어 흐름 모델링 |
| **인터파일 분석** | 함수 호출 체인을 추적하여 2차 SQL Injection 같은 복잡한 취약점 탐지 |

핵심은 **ML 모델이 코드의 의미를 이해**한다는 점이다. 전통적인 SAST가 정규식/AST 패턴 매칭에 의존하는 반면, Snyk Code는 코드의 의도와 맥락을 파악한다.

### 1.3 기능 범위

Snyk은 단일 플랫폼에서 5가지 보안 스캔을 제공한다:

| 제품 | 기능 | 설명 |
|------|------|------|
| **Snyk Code** | SAST | 자체 코드의 보안 취약점 + 하드코딩된 시크릿 탐지 |
| **Snyk Open Source** | SCA | 오픈소스 의존성의 취약점 및 라이선스 문제 |
| **Snyk Container** | Container | 컨테이너 이미지 및 워크로드 취약점 |
| **Snyk IaC** | IaC | Terraform, CloudFormation, K8s, Helm, ARM 템플릿 스캔 |
| **Snyk AppRisk** | ASPM | 애플리케이션 전체 가시성 및 리스크 관리 |

Snyk Code 자체에도 Secrets 탐지가 내장되어 있어, 하드코딩된 API 키, 비밀번호, 토큰 등을 감지한다.

### 1.4 AI 활용: DeepCode AI

**DeepCode AI Fix (자동 수정):**
- 8개 언어에 대해 AI 기반 자동 수정 제안
- **80% 정확도**의 보안 자동 수정
- 멀티모달 하이브리드 AI로 모델 다양성을 통한 견고성 확보
- 단순 패치가 아닌 코드 맥락을 이해한 수정안 제시

**컨텍스트 인식 우선순위:**
- 패키지 인기도, 취약 코드의 도달 가능성(reachability) 평가
- 익스플로잇 성숙도 모니터링
- AI 기반 자동 트리아지로 개발자가 가장 중요한 이슈에 집중 가능

### 1.5 False Positive 처리

Snyk Code는 업계 최저 수준의 false positive 비율을 주장한다:

- **0.08% false positive 비율** (Snyk API & Web 기준)
- 전통적인 SAST 도구의 50~80% false positive 비율 대비 획기적 개선
- ML이 과거 데이터에서 효과적으로 학습하고, 실시간 새 정보에 적응
- 컨텍스트 인식 스캔으로 애플리케이션의 운영 맥락을 이해

**작동 원리:**
1. ML 모델이 대규모 코드 데이터셋에서 진짜 취약점 패턴 학습
2. 시맨틱 분석으로 코드의 실제 의미와 맥락 파악
3. 데이터플로우 + 테인트 분석으로 실제 도달 가능한 취약점만 보고
4. 보안 연구원의 큐레이션으로 규칙 품질 유지

### 1.6 통합

**IDE 통합:**
- VS Code, IntelliJ IDEA, PyCharm, Eclipse, Visual Studio
- 실시간 인라인 하이라이트 및 설명 제공
- 타이핑과 동시에 스캔

**SCM 통합:**
- GitHub, GitHub Enterprise, GitLab, Bitbucket, Azure Repos
- PR Check: 새 PR에 대해 자동 보안 스캔 → 상태 체크 전송
- 자동 수정 PR 생성 기능

**CI/CD 통합:**
- GitHub Actions, Jenkins, CircleCI, AWS CodePipeline
- Azure Pipelines, Bitbucket Pipelines, TeamCity
- Terraform CI/CD 워크플로우 지원

**CLI:**
- `snyk code test` 명령어로 로컬 스캔
- CI/CD 파이프라인에 쉽게 통합

### 1.7 지원 언어

Snyk Code는 **15개 이상의 언어**를 지원한다:

| 언어 | 상태 | Autofix 지원 |
|------|------|-------------|
| JavaScript | GA | O |
| TypeScript | GA | O |
| Python | GA | O |
| Java | GA | O |
| C# | GA | O |
| Go | GA | O |
| PHP | GA | O |
| Ruby | GA | O |
| C/C++ | GA | O |
| Kotlin | GA | - |
| Scala | GA | - |
| Swift | GA | - |
| Rust | Early Access | - |
| Apex | GA | - |
| VB.NET | GA | - |

- 인터파일 분석: Ruby를 제외한 모든 언어에서 지원
- DeepCode AI Fix (자동 수정): 8개 언어 지원

### 1.8 가격

| 플랜 | 가격 | 주요 제한/기능 |
|------|------|---------------|
| **Free** | $0 | Code 100회/월, Open Source 400회/월, IaC 300회/월, Container 100회/월. 주간 자동 스캔 |
| **Team** | $25/개발자/월 | 최소 5명, 최대 10명. 더 많은 테스트 한도 |
| **Enterprise** | 커스텀 견적 | 무제한 테스트, SSO, RBAC, 전용 지원 |

Free 플랜은 개인 개발자나 소규모 프로젝트에 적합하며, 실제 팀 단위 사용에는 Team 이상이 필요하다.

### 1.9 VulChk와의 차이

| 항목 | Snyk Code | VulChk |
|------|-----------|--------|
| **접근 방식** | 독립형 SaaS 제품, DeepCode AI ML 엔진 | Claude Code 플러그인, LLM 추론 기반 |
| **설치 모델** | SaaS + CLI + IDE 플러그인 (클라우드 분석) | 로컬 CLI, Claude Code 에이전트 내 실행 |
| **분석 방식** | 사전 학습된 ML 모델 + 시맨틱 분석 | LLM의 실시간 코드 추론 |
| **비용** | Free 제한적, Team $25/dev/월~ | Claude Code 구독 내 포함 (추가 비용 없음) |
| **설정** | 계정 생성, 프로젝트 연동, 정책 설정 필요 | `npx vulchk` 한 줄로 즉시 실행 |
| **규칙 커스텀** | 제한적 (Snyk 관리 규칙셋) | LLM이 코드 맥락에 맞게 동적 분석 |
| **오프라인** | 불가 (클라우드 분석 필요) | 불가 (LLM API 필요) |
| **강점** | 대규모 데이터셋 학습, 낮은 FP, 자동 수정 | 제로 설정, 맥락 이해, 동적 추론 |

---

## 2. Semgrep

### 2.1 개요

Semgrep은 오픈소스 정적 분석 도구로, **YAML 기반 규칙**과 **패턴 매칭**을 핵심으로 한다. 코드처럼 보이는 패턴으로 규칙을 작성할 수 있어 개발자 친화적이며, 속도가 매우 빠르다.

핵심 특징:
- 오픈소스 기반 (LGPL-2.1, 단 일부 기능은 상용으로 이동)
- **30개 이상의 언어** 지원
- 코드와 유사한 패턴 문법으로 직관적인 규칙 작성
- 커뮤니티 주도의 대규모 규칙 레지스트리

### 2.2 작동 방식: 패턴 매칭 + AI 추론

**기본 엔진 (Community Edition):**
- YAML로 정의된 규칙을 코드에 패턴 매칭
- AST(Abstract Syntax Tree) 레벨에서 매칭하여 포맷팅에 무관한 정확한 탐지
- 메타변수(`$X`, `$FUNC`)로 동적 패턴 정의
- 불리언 연산자(`pattern-either`, `pattern-not`, `patterns`)로 복합 조건

**Pro 엔진 (상용):**
- 인터프로시저 테인트 분석 (함수 경계를 넘는 데이터 추적)
- 인터파일 분석
- 상수 전파, 타입 추론
- 30개 이상 언어에 대한 심층 분석

**참고:** 2023년부터 Semgrep은 테인트 분석, 인터프로시저 분석 등 고급 기능을 Community Edition에서 제거하고 Pro 엔진으로 이동시켰다. 이에 대한 커뮤니티 반발로 **OpenGrep**이라는 포크가 탄생, 제거된 기능을 복원하여 유지 중이다.

### 2.3 기능 범위

| 제품 | 기능 | 설명 |
|------|------|------|
| **Semgrep Code** | SAST | 소스코드 정적 분석, 규칙 기반 취약점 탐지 |
| **Semgrep Supply Chain** | SCA | 오픈소스 의존성 취약점, 리치어빌리티 분석, SBOM 생성, 라이선스 컴플라이언스 |
| **Semgrep Secrets** | Secrets | 시맨틱 분석 + 엔트로피 분석 + 유효성 검증으로 시크릿 탐지 |

**Semgrep Secrets의 차별점:**
- 단순 정규식이 아닌 **시맨틱 분석**으로 코드에서 데이터가 어떻게 사용되는지 추론
- 탐지된 자격증명의 **유효성 검증**(실제 활성 상태인지 확인)
- 이를 통해 가장 위험한 시크릿 우선순위 지정

**Semgrep Supply Chain의 차별점:**
- **리치어빌리티 분석**: 실제로 사용되는 취약한 코드 경로만 플래그 → 고/위험 심각도 FP 최대 98% 감소
- 직접 의존성 + 전이 의존성 탐지
- 악성 의존성 탐지
- AI 기반 업그레이드 가이드

### 2.4 규칙 생태계

**Semgrep Registry (커뮤니티 규칙):**
- 수천 개의 공개 규칙 (OWASP 카테고리, 프레임워크, 언어별 정리)
- 커뮤니티 기여 + Semgrep 팀 유지보수
- Semgrep Rules License 하에 무료 사용 가능

**커스텀 규칙 작성:**
```yaml
rules:
  - id: hardcoded-password
    patterns:
      - pattern: password = "$VALUE"
      - metavariable-regex:
          metavariable: $VALUE
          regex: .+
    message: "하드코딩된 비밀번호 발견"
    languages: [python, javascript]
    severity: WARNING
```

- 코드와 유사한 패턴 문법으로 직관적
- `metavariable-pattern`, `metavariable-regex` 등 고급 필터링
- 테스트 케이스 기반 규칙 검증 (true positive + true negative 필수)
- Semgrep Playground에서 온라인 규칙 작성/테스트

**Pro Rules:**
- Semgrep 보안 연구팀이 관리하는 상용 규칙셋
- 더 높은 정확도와 더 넓은 커버리지

### 2.5 AI 활용: Semgrep Assistant

Semgrep Assistant는 LLM을 활용한 AI 보안 어시스턴트로, 2025년 크게 발전했다:

**노이즈 필터링 (자동 트리아지):**
- SAST 결과의 약 **20%를 false positive로 필터링**, 95% 사용자 동의율
- 결정론적 SAST 엔진 + LLM의 하이브리드 접근
- 2025년 기준 **전체 트리아지 작업의 60%를 자동 처리**

**AI 기반 탐지 (비즈니스 로직 취약점):**
- IDOR, 권한 우회, 접근 제어 결함 등 규칙으로 탐지하기 어려운 취약점
- 결정론적 분석 결과 위에 LLM 추론을 적용하여 true positive 비율 향상
- 2025년 Private Beta로 출시

**설명 및 수정 제안:**
- 취약점이 왜 true positive인지 코드와 위협 모델 연결하여 설명
- PR/MR 코멘트에 단계별 수정 지침 제공
- Autofix 제안

**Memories (메모리 시스템):**
- LLM이 과거 트리아지 결정을 기억하고 참조하는 검색 시스템
- 시간이 지남에 따라 해당 코드베이스에 맞게 정확도 향상

**멀티 모델 지원:**
- OpenAI를 기본으로, AWS Bedrock 자동 폴백
- 사용자가 AI 제공자 선택 가능 (데이터 프라이버시, 계약, 성능)

### 2.6 통합

**CLI:**
- `semgrep scan` 명령어로 로컬 스캔
- Pre-commit hook 지원
- Docker 이미지 제공

**CI/CD:**
- GitHub Actions (공식 지원)
- GitLab CI/CD
- Jenkins, CircleCI, Bitbucket Pipelines 등
- Semgrep Managed Scans: 주간 100만+ 스캔 처리 (엔터프라이즈)

**SCM 통합:**
- GitHub PR 코멘트
- GitLab MR 코멘트
- PR diff-only 스캔 (변경된 코드만 스캔)

**IDE:**
- VS Code 확장
- IntelliJ 플러그인 (LSP 기반)

### 2.7 오픈소스 vs 상용

| 기능 | Community Edition (무료) | AppSec Platform (상용) |
|------|------------------------|----------------------|
| **기본 패턴 매칭** | O | O |
| **커뮤니티 규칙** | O | O |
| **커스텀 규칙 작성** | O | O |
| **30+ 언어 지원** | O | O |
| **인터프로시저 분석** | X (Pro 엔진) | O |
| **테인트 분석** | X (Pro 엔진) | O |
| **인터파일 분석** | X (Pro 엔진) | O |
| **Semgrep Supply Chain** | X | O |
| **Semgrep Secrets** | X | O |
| **Semgrep Assistant (AI)** | X | O |
| **대시보드/관리** | X | O |
| **정책 적용** | X | O |
| **Pro Rules** | X | O |
| **SSO/RBAC** | X | O |

**가격:**
| 플랜 | 가격 | 대상 |
|------|------|------|
| **Community** | 무료 (OSS) | 개인, 소규모 프로젝트 |
| **Team** | 프라이빗 레포 10 기여자까지 무료, 이후 유료 (~$13/user/월 협상가) | 소규모~중규모 팀 |
| **Enterprise** | 커스텀 견적 | 대규모 조직, $200K+/년 규모 |

### 2.8 VulChk와의 차이

| 항목 | Semgrep | VulChk |
|------|---------|--------|
| **분석 방식** | 규칙 기반 패턴 매칭 + Pro 엔진 테인트 분석 | LLM 추론 기반 동적 분석 |
| **규칙** | YAML 규칙 명시적 정의 필요 | 규칙 없이 LLM이 코드 이해 후 판단 |
| **커스터마이징** | YAML 규칙 직접 작성, 높은 자유도 | LLM 프롬프트 레벨에서 동적 조절 |
| **실행 속도** | 매우 빠름 (패턴 매칭 기반) | 상대적으로 느림 (LLM 추론 시간) |
| **False Positive** | 규칙 품질에 의존, Assistant로 20% 필터링 | LLM 맥락 이해로 동적 판단 |
| **비즈니스 로직 취약점** | Assistant AI로 일부 지원 (Beta) | LLM 추론으로 자연스럽게 지원 |
| **설정** | 규칙셋 선택/작성, CI/CD 연동 설정 필요 | 제로 설정, 즉시 실행 |
| **오프라인** | CE는 완전 오프라인 가능 | 불가 (LLM API 필요) |
| **비용** | CE 무료, 고급 기능 유료 | Claude Code 구독에 포함 |
| **강점** | 속도, 결정론적 분석, 규칙 투명성, 대규모 배포 | 제로 설정, 맥락 추론, 동적 분석 |

---

## 3. 종합 비교

### 3.1 접근 방식 비교

```
Snyk Code    : ML 사전 학습 모델 → 시맨틱 분석 → 결과 + 자동 수정
Semgrep      : YAML 규칙 → 패턴 매칭 (+ Pro 테인트) → 결과 + AI 트리아지
VulChk       : LLM 실시간 추론 → 동적 코드 분석 → 결과 + 공격 시뮬레이션
```

### 3.2 강점/약점 요약

| 도구 | 강점 | 약점 |
|------|------|------|
| **Snyk Code** | 최저 FP 비율, 자동 수정, 5-in-1 플랫폼, 광범위한 IDE/CI 통합 | 비용, 클라우드 의존, 규칙 커스텀 제한 |
| **Semgrep** | 오픈소스 기반, 빠른 속도, 규칙 투명성/커스텀, 대규모 배포 적합 | 고급 기능 유료화, 규칙 작성 부담, 비즈니스 로직 탐지 한계 |
| **VulChk** | 제로 설정, LLM 맥락 이해, 동적 추론, 공격 시뮬레이션 | LLM 속도, 결정론적 재현성 부족, Claude Code 종속 |

### 3.3 VulChk가 배울 점

**Snyk에서:**
- 자동 수정 제안의 품질과 정확도 (80% 정확도 목표)
- 컨텍스트 인식 우선순위 지정 (리치어빌리티, 익스플로잇 성숙도)
- IDE 실시간 통합의 UX

**Semgrep에서:**
- Memories 시스템 (과거 트리아지 결정을 학습하여 FP 감소)
- 결정론적 분석과 AI 추론의 하이브리드 접근
- 규칙 투명성 (왜 이 취약점이 탐지되었는지 명확한 설명)
- 리치어빌리티 분석 (실제 사용되는 취약 경로만 보고)
