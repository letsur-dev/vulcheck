# VulChk

[Claude Code](https://claude.ai/claude-code)에서 사용할 수 있는 보안 분석 툴킷. 슬래시 명령어를 통해 코드 취약점 점검과 모의 침투 테스트를 제공합니다.

## 설치

VulChk는 GitHub Packages를 통해 배포됩니다. 설치 전 레지스트리 인증을 설정해야 합니다.

### 2. 설치

```bash
npm install -g @letsur-dev/vulchk
```

### 업데이트

```bash
npm install -g @letsur-dev/vulchk
```

최신 버전이 배포된 경우 `vulchk` 실행 시 자동으로 업데이트 안내가 표시됩니다.

## 빠른 시작

```bash
# 프로젝트에 VulChk 초기화
cd your-project
vulchk init
```

인터랙티브 설정 마법사가 리포트 언어(English, 한국어)를 물어봅니다. `.vulchk/config.json`이 생성되고 Claude Code 슬래시 명령어가 설치됩니다.

## 슬래시 명령어

`vulchk init` 실행 후, Claude Code에서 다음 명령어를 사용할 수 있습니다:

### `/vulchk.codeinspector`

프로젝트 코드베이스의 종합 정적 보안 분석:

- **의존성 CVE 감사** — 사용 중인 의존성의 알려진 취약점 조회
- **OWASP Top 10 스캔** — SQL injection, XSS, CSRF 등 코드 패턴 탐지
- **시크릿 스캐너** — .gitignore 검증 및 하드코딩된 인증정보 탐지
- **Git 히스토리 감사** — 커밋 히스토리에서 실수로 올라간 시크릿 검색
- **컨테이너 보안** — Dockerfile 및 Kubernetes 매니페스트 분석

Node.js, React/Next.js (Vercel 포함), FastAPI 프로젝트에 대해 특화된 분석을 제공합니다. 그 외 스택은 범용 분석을 수행합니다.

리포트 저장 경로: `./security-report/codeinspector.md` (단일 파일, 실행 시마다 업데이트)

### `/vulchk.hacksimulator`

실행 중인 웹 애플리케이션에 대한 모의 침투 테스트:

```
/vulchk.hacksimulator                    # 대화형 타겟 선택
/vulchk.hacksimulator https://my-app.com # URL 직접 지정
```

주요 기능:
- **3단계 강도 선택** — Passive (정찰만), Active (안전한 프로빙), Aggressive (익스플로잇)
- **다중 벡터 테스트** — HTTP 요청, API 프로빙, 브라우저 자동화 (ratatosk-cli)
- **공격 계획 승인** — 어떤 요청도 보내기 전에 테스트 계획을 검토하고 승인
- **코드 인스펙터 연동** — 사전 코드 점검 결과를 활용하여 공격 벡터 우선순위 결정
- **인증 확인** — 외부 타겟에 대해 경고 및 명시적 확인 요구

리포트 저장 경로: `./security-report/hacksimulator-{timestamp}.md`

## 설정

`vulchk init`이 `.vulchk/config.json`을 생성합니다:

```json
{
  "language": "ko",
  "version": "0.1.0"
}
```

| 필드 | 설명 |
|------|------|
| `language` | 리포트 언어: `en`, `ko` |
| `version` | 프로젝트를 초기화한 VulChk 버전 |

## CLI 옵션

```bash
vulchk init              # 인터랙티브 설정
vulchk init --lang ko    # 언어 프롬프트 건너뛰기
vulchk init --force      # 기존 설정 덮어쓰기
vulchk --version         # 버전 표시
vulchk --help            # 도움말 표시
```

## 리포트

리포트는 `./security-report/` 디렉토리에 Markdown 파일로 생성됩니다:

- `codeinspector.md` — 코드 점검 결과 (단일 파일, 증분 업데이트)
- `hacksimulator-{YYYY-MM-DD-HHmmss}.md` — 모의 침투 테스트 결과

### Code Inspector 리포트 특징:
- **단일 파일** — 실행할 때마다 같은 파일이 업데이트됨
- **커밋 기반 추적** — 어떤 커밋 기준으로 분석했는지 기록
- **증분 분석** — 두 번째 실행부터는 변경된 파일만 재분석 (관련 파일 포함)
- **빠른 수정 목록** — 파일 경로와 줄 번호가 포함된 요약 테이블
- **클린 커밋 필수** — 커밋되지 않은 변경사항이 있으면 먼저 커밋 요구

### 공통:
- 심각도별 카운트가 포함된 요약
- 증거, 참조, 개선 방안이 포함된 상세 발견 사항
- 보안 용어 (CVE, XSS, CSRF 등)는 리포트 언어와 관계없이 영어로 유지
- 민감한 값은 항상 마스킹 처리

## 브라우저 자동화

브라우저 기반 침투 테스트를 위해 [ratatosk-cli](https://github.com/letsur-dev/huginn)를 설치하세요:

```bash
# 1. GitHub Packages 레지스트리 설정 (.npmrc에 추가)
echo "@letsur-dev:registry=https://npm.pkg.github.com/" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> ~/.npmrc

# 2. ratatosk-cli 설치 (둘 중 하나 선택)
npm install -g @letsur-dev/ratatosk-cli   # 글로벌 설치
npm install @letsur-dev/ratatosk-cli       # 로컬 설치

# 3. 브라우저 설치
GITHUB_TOKEN=YOUR_GITHUB_TOKEN npx ratatosk install

# 4. 스킬 설치
npx ratatosk install --skills
```

ratatosk-cli가 설치되지 않은 경우, VulChk는 HTTP 기반 테스트만 수행합니다.

## 요구 사항

- Node.js >= 18.0.0
- [Claude Code](https://claude.ai/claude-code) CLI

## 라이선스

MIT
