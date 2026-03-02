# 경쟁사 분석: Aikido Security & OpenAI Codex Security (Aardvark)

> 작성일: 2026-03-02

---

## 1. Aikido Security

### 1.1 개요

Aikido Security는 2022년 벨기에 겐트(Ghent)에서 설립된 올인원 보안 플랫폼이다. 코드 작성 시점부터 런타임까지 전체 SDLC를 커버하며, 개발자 중심(developer-first) 접근 방식을 표방한다. 2026년 1월 DST Global이 리드한 Series B 라운드에서 $60M을 유치하며 $1B 기업가치(유니콘)를 달성했다. 유럽 사이버보안 기업 중 가장 빠른 유니콘 달성(설립 3년) 기록을 세웠다.

- **본사**: 벨기에 겐트
- **설립**: 2022년
- **기업가치**: $1B (2026년 1월 기준)
- **누적 투자**: Series A $17M (2024) + Series B $60M (2026)
- **고객 규모**: 100,000+ 팀 (Premier League, SoundCloud, Revolut 등)
- **ARR**: $13M (2025년 1월 기준), 전년 대비 1,531% 성장

### 1.2 기능 범위

| 카테고리 | 기능 | 설명 |
|---------|------|------|
| **SAST** | 정적 코드 분석 | SQL injection, XSS, buffer overflow 등 탐지. Opengrep 기반 taint analysis |
| **SCA** | 오픈소스 의존성 스캔 | CVE 데이터베이스 대조, 라이선스 검사 |
| **DAST** | 동적 애플리케이션 테스트 | Authenticated DAST — 사용자로 로그인 후 스캔 |
| **Secrets** | 시크릿 탐지 | 코드 내 API 키, 비밀번호, 토큰 등 유출 감지 |
| **Container** | 컨테이너 이미지 스캔 | 컨테이너 취약점 탐지 및 클라우드 결과 중복 제거 |
| **IaC** | Infrastructure-as-Code 스캔 | Terraform, CloudFormation, Kubernetes manifest 검사 |
| **CSPM** | 클라우드 보안 형상 관리 | VM, 서버리스, 컨테이너 이미지의 클라우드 인프라 위험 탐지 |
| **Runtime** | 런타임 보호 (Zen) | 인앱 방화벽(RASP), SQLi/XSS 실시간 차단, API rate limiting |
| **AI Pentest** | 자율 AI 침투 테스트 | 200+ AI 에이전트가 실제 공격 경로 탐색, SOC2/ISO27001 보고서 자동 생성 |

### 1.3 AI 활용 방식

- **AI AutoTriage**: LLM을 활용한 false-positive 자동 필터링. 최대 95% false-positive 감소. Opengrep 기반 taint analysis와 결합
- **AI AutoFix**: Claude Sonnet(Amazon Bedrock 경유) 사용. 보안 취약점에 대한 수정 코드를 자동 생성하여 PR로 제출. 수정 대상 취약점만 정확히 수정하도록 제한
- **자율 AI 침투 테스트**: 200+ AI 에이전트가 코드 및 배포된 웹앱/API를 분석하고 실제 공격자 행동을 시뮬레이션
- **코드 프라이버시**: AI가 고객 코드를 저장하거나 학습에 사용하지 않음. SOC2, ISO 27001 준수. 수정 작업은 읽기 전용 repo 접근이 가능한 단기 샌드박스에서 실행

### 1.4 통합 지원

- **SCM**: GitHub, GitLab (Self-Managed 포함), Bitbucket, Azure Repos
- **IDE**: VS Code, Cursor, JetBrains, Windsurf — 실시간 파일 스캔
- **CI/CD**: CI Gating 기능으로 feature branch의 CVE, IaC, Secrets, SAST 취약점 차단
- **알림**: Slack, Jira, 기타 워크플로우 도구 연동
- **마켓플레이스**: AWS Marketplace, Azure Marketplace

### 1.5 가격 모델

| 플랜 | 월 요금 | 주요 제한 |
|------|--------|----------|
| **Developer (Free)** | $0 | 2 사용자, 10 repos |
| **Basic** | $350 | — |
| **Pro** | $700 | — |
| **Advanced** | $1,050 | — |
| **Enterprise** | 커스텀 | — |

Free 티어가 실질적으로 유용하다는 평가를 받고 있으며, 대부분의 보안 도구 무료 플랜보다 더 많은 기능을 제공한다.

### 1.6 강점과 약점

**강점:**
- 코드 → 클라우드 → 런타임까지 단일 플랫폼에서 통합 커버
- AI AutoTriage로 95% false-positive 감소
- 자율 AI 침투 테스트 (200+ 에이전트, 수시간 내 감사 보고서)
- 개발자 친화적 UX, IDE 실시간 스캔
- 유의미한 Free 티어

**약점:**
- SaaS 플랫폼 의존 (온프레미스 옵션 제한적)
- 유료 플랜 진입 비용 $350/월로 소규모 팀에게 부담
- 코드를 플랫폼에 연결해야 하므로 보안 민감 조직에서 우려 가능

---

## 2. OpenAI Codex Security (구 Aardvark)

### 2.1 개요

Aardvark는 OpenAI가 2025년 10월에 발표한 GPT-5 기반 자율 보안 연구 에이전트이다. 2026년 2월 **Codex Security**로 리브랜딩되었으며, 맬웨어 분석 파이프라인이 추가되었다. 현재 Private Beta 상태이며, 소규모 Early Access 파트너 그룹을 대상으로 운영 중이다.

- **출시**: 2025년 10월 (Private Beta)
- **리브랜딩**: 2026년 2월 → Codex Security
- **기반 모델**: GPT-5 → GPT-5.2-Codex → GPT-5.3-Codex (2026년 2월)
- **접근 방식**: 전통적 프로그램 분석(fuzzing, SCA) 대신 LLM 추론과 도구 활용으로 코드 동작 이해
- **벤치마크**: 92% recall rate (golden repo 기준)
- **실적**: 오픈소스 프로젝트에서 10개 CVE 발견 (OpenSSH 메모리 손상 결함 포함)
- **사이버 방어 지원**: $10M API 크레딧 제공 프로그램

### 2.2 작동 방식 (Multi-Stage Pipeline)

```
1. Threat Modeling    → 전체 리포지토리 분석, 보안 목표·설계 이해
2. Commit Scanning    → 새 코드 커밋 시 diff + 전체 컨텍스트 대비 취약점 탐지
3. Vulnerability Detection → LLM 추론으로 취약점 식별, 심각도 평가
4. Sandbox Validation → 격리 환경에서 취약점 실제 트리거 → 익스플로잇 가능성 검증
5. Patching           → Codex가 수정 패치 생성 + Aardvark가 패치 스캔 → 원클릭 적용
```

### 2.3 핵심 기능

| 기능 | 설명 |
|------|------|
| **커밋 레벨 스캐닝** | 새 코드 변경 시 자동으로 리포지토리 전체 + threat model 대비 스캔 |
| **샌드박스 검증** | 탐지된 취약점을 격리 환경에서 실제로 트리거하여 확인. false-positive 감소 |
| **원클릭 패치** | Codex 생성 패치를 Aardvark가 재스캔 후 개발자 리뷰용으로 제시 |
| **맬웨어 분석** | 2026년 2월 추가. 번들 샘플 업로드 → 자동 분석 → 구조화된 보고서·아티팩트 |
| **자율 에이전트** | Threat Modeling → 탐지 → 검증 → 패치 전 과정을 자율적으로 수행 |

### 2.4 차별화 요소

- **LLM 네이티브 분석**: 전통적 정적/동적 분석이 아닌 GPT-5 추론 기반. 난독화된 코드 해석 및 광범위한 위협 인텔리전스 연결 가능
- **탐지 → 검증 → 패치 완전 자동화**: 인간 개입 없이 전 과정 수행 후 리뷰만 요청
- **커밋 감시 방식**: 지속적으로 새 코드 변경을 모니터링 (온디맨드 스캔이 아님)
- **실전 검증 실적**: 10개 CVE 발견, 92% recall

### 2.5 제한사항

- **Private Beta**: 일반 이용 불가, 초대 기반 소규모 접근
- **가격 미공개**: API 가격 및 서비스 비용 정보 없음
- **SaaS 전용**: 온프레미스 배포 옵션 없음
- **코드 전송 필요**: OpenAI 인프라에서 코드 분석이 이루어지므로 보안 민감 조직에서 우려
- **맬웨어 분석 초기 단계**: 문서화 미비, 어떤 모델/시스템이 분석을 수행하는지 불명확

---

## 3. VulChk와의 비교

### 3.1 포지셔닝 차이

| 항목 | VulChk | Aikido Security | Codex Security |
|------|--------|----------------|----------------|
| **형태** | CLI 플러그인 (Claude Code 기반) | SaaS 플랫폼 | SaaS 에이전트 (Private Beta) |
| **설치** | `npm install`, 로컬 실행 | 클라우드 계정 생성 + SCM 연동 | 초대 기반 Beta 접근 |
| **LLM** | Claude (Anthropic) | Claude Sonnet (Bedrock) + 자체 엔진 | GPT-5/5.3-Codex |
| **대상** | 개발자 개인/소규모 팀 | 스타트업 ~ 엔터프라이즈 | 엔터프라이즈 보안 팀 |
| **비용** | Claude API 비용만 | Free ~ $1,050+/월 | 미공개 |

### 3.2 기능 범위 비교

| 기능 | VulChk | Aikido | Codex Security |
|------|--------|--------|----------------|
| SAST (정적 분석) | O (LLM 기반) | O (Opengrep + AI) | O (GPT-5 추론) |
| SCA (의존성) | O | O | X (코드 중심) |
| DAST (동적 테스트) | O (curl 프로브) | O (Authenticated DAST) | O (샌드박스 검증) |
| Secrets 스캔 | O | O | X (별도 기능 없음) |
| Container 스캔 | X | O | X |
| IaC 스캔 | X | O | X |
| CSPM | X | O | X |
| Runtime 보호 | X | O (RASP/Zen) | X |
| 커밋 감시 | X (온디맨드) | O (CI/CD 연동) | O (실시간 커밋 스캔) |
| AI 자동 패치 | O (수정 제안) | O (AutoFix PR) | O (원클릭 패치) |
| 맬웨어 분석 | X | X | O (2026년 추가) |
| AI 침투 테스트 | O (attack-executor) | O (200+ 에이전트) | X |

### 3.3 핵심 차별점

**VulChk의 강점:**
- **제로 인프라**: npm 설치만으로 즉시 사용, 별도 계정·플랫폼 불필요
- **로컬 실행**: 코드가 외부 플랫폼에 저장되지 않음 (API 호출 시 LLM에 전송되긴 함)
- **낮은 진입 장벽**: Claude API 사용료만 발생, 월 구독 없음
- **Claude Code 생태계 통합**: 기존 개발 워크플로우에 자연스럽게 삽입

**Aikido 대비 VulChk 약점:**
- Container, IaC, CSPM, Runtime 보호 기능 부재
- 통합 대시보드·트렌드 분석 없음
- CI/CD 자동 게이팅 미지원
- AI AutoTriage 수준의 false-positive 자동 필터링 없음

**Codex Security 대비 VulChk 약점:**
- 커밋 레벨 지속 모니터링 미지원
- 샌드박스 환경에서의 익스플로잇 검증 미지원
- 맬웨어 분석 기능 없음
- GPT-5 수준의 코드 추론 능력 차이 가능성

**Aikido/Codex Security 대비 VulChk 강점:**
- 즉시 사용 가능 (가입·승인 불필요)
- 플랫폼 종속 없음
- 비용 예측 가능 (토큰 기반 종량제)
- 오프라인/에어갭 환경에서도 사용 가능 (로컬 모델 연동 시)

---

## 4. 시사점

### 4.1 시장 트렌드

1. **AI 네이티브 보안 도구의 부상**: Aikido(AutoTriage/AutoFix)와 Codex Security(자율 에이전트) 모두 LLM을 핵심 엔진으로 활용. 전통적 룰 기반 도구에서 AI 추론 기반으로 전환 가속화
2. **통합 플랫폼화**: Aikido의 성공은 파편화된 보안 도구를 하나로 통합하는 것의 가치를 증명 (SAST + SCA + DAST + Container + IaC + CSPM + Runtime)
3. **자동화 수준 심화**: Codex Security의 "탐지 → 검증 → 패치" 완전 자동화가 업계 방향성 제시
4. **커밋 기반 지속 스캔**: 온디맨드 스캔에서 커밋 시점 자동 스캔으로 이동

### 4.2 VulChk 로드맵 참고 사항

- **CI/CD 연동**: Aikido의 CI Gating, Codex Security의 커밋 스캔처럼 자동화된 파이프라인 통합 고려
- **False-positive 감소**: Aikido의 AutoTriage(95% 감소) 수준의 자동 필터링 메커니즘 검토
- **검증 강화**: Codex Security의 샌드박스 검증처럼 탐지된 취약점의 실제 익스플로잇 가능성 확인 기능
- **차별화 유지**: CLI 기반 경량성·즉시성·플랫폼 독립성은 유지하되 기능 깊이 강화
