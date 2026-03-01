# Walkthrough: Phase 1 - CLI Foundation

**생성일**: 2026-03-01
**커밋 수**: 1

## 요약

Node.js CLI 프로젝트를 구성하고, `vulchk init` 명령어를 구현했습니다.
commander로 CLI를 구성하고, enquirer로 인터랙티브 언어 선택 프롬프트를
제공하며, fs-extra로 번들된 스킬/에이전트 템플릿을 대상 프로젝트에 복사합니다.

## 변경된 파일

| 상태 | 파일 | 설명 |
|------|------|------|
| A | .gitignore | node_modules, security-report, .vulchk 등 제외 |
| A | bin/vulchk.js | CLI 진입점 (shebang + ESM import) |
| A | package.json | npm 패키지 설정 (bin, dependencies) |
| A | src/index.js | commander CLI 설정 (init 서브커맨드 등록) |
| A | src/commands/init.js | enquirer 기반 init 위저드 + 파일 복사 |
| A | src/utils/file-ops.js | 스킬/에이전트 복사, config 읽기/쓰기 유틸 |
| A | src/templates/config.json | 기본 설정 템플릿 |
| A | src/templates/skills/vulchk-codeinspector/SKILL.md | 코드 인스펙터 스킬 (placeholder) |
| A | src/templates/skills/vulchk-hacksimulator/SKILL.md | 해킹 시뮬레이터 스킬 (placeholder) |
| A | src/templates/agents/*.md | 7개 서브에이전트 (placeholder) |

## 상세 변경 내역

### src/commands/init.js
**목적**: `vulchk init` 핵심 로직. 배너 출력, 기존 설정 감지,
enquirer 프롬프트, 파일 복사까지 전체 흐름 구현.

주요 기능:
- ASCII 아트 배너 (chalk.bold.red)
- 기존 `.vulchk/config.json` 감지 → reconfigure/skip 선택
- `--lang` 플래그로 프롬프트 스킵 가능
- `--force`로 기존 설정 무시하고 재설정

### src/utils/file-ops.js
**목적**: fs-extra 래핑. 스킬/에이전트 복사, config 읽기/쓰기.

주요 포인트:
- fs-extra는 ESM named export 미지원 → `import fse from 'fs-extra'`
  + destructuring 패턴 사용

### src/index.js
**목적**: commander로 CLI 진입점 구성. `vulchk init` 서브커맨드 등록.

## 주요 결정 사항

- **결정**: fs-extra의 default import 사용
  - **이유**: Node.js ESM 환경에서 fs-extra가 named export를 제공하지 않음
  - **고려한 대안**: Node.js 내장 fs/promises 직접 사용 →
    copySync/readJsonSync 등 편의 함수를 직접 구현해야 해서 비효율적

- **결정**: 템플릿을 npm 패키지에 번들
  - **이유**: spec-mix는 GitHub Release ZIP 다운로드 방식이지만,
    VulChk는 Claude Code 전용이라 단일 에이전트 세트만 필요
  - **고려한 대안**: GitHub Release 다운로드 → 네트워크 의존성 발생,
    오프라인 사용 불가

## 작업 메모리 노트

> - `enquirer`는 `new Enquirer()` 인스턴스를 만들어 `.prompt()` 호출해야 함
> - 테스트 디렉토리 `/tmp/vulchk-test-project`에서 정상 동작 확인 완료
> - `--lang en`, `--force`, 기존 설정 감지 모두 테스트 통과
> - Phase 2에서 SKILL.md placeholder들을 실제 분석 로직으로 교체 예정

## 커밋

| 해시 | 메시지 |
|------|--------|
| 0b631ed | feat: implement CLI foundation with vulchk init command |
