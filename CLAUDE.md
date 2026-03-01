# VulChk — Claude Code 프로젝트 설정

## 설계 문서 자동 동기화

`src/templates/` 하위의 스킬 또는 에이전트 파일을 수정하거나,
CLI 코드(`src/commands/`, `src/utils/`)를 변경한 경우,
작업 완료 후 반드시 `design/` 폴더의 설계 문서를 업데이트해야 한다.

변경 대상 매핑:
- `src/templates/skills/` 변경 → `design/architecture.md` + 해당 기능 문서
- `src/templates/agents/` 변경 → `design/architecture.md` + 해당 기능 문서
- `src/commands/`, `src/utils/` 변경 → `design/architecture.md`
- 새 기능 추가 → 해당하는 `design/*.md` 신규 작성 또는 기존 문서에 섹션 추가

설계 문서는 **한국어**로 작성한다. 기술 용어(CVE, OWASP, API 등)는 영어 유지.

수동으로도 가능: `/sync-design-docs` 슬래시 명령어로 전체 동기화 실행.

## 코드 규칙

- ESM 모듈 (`"type": "module"`)
- fs-extra는 디폴트 임포트 패턴 사용: `import fse from 'fs-extra'`
- 테스트: vitest (`npx vitest run`)
- 스킬/에이전트 내부 지시사항은 영어로 작성 (LLM 프롬프트)
- 사용자 대면 문서(README, design/)는 한국어로 작성
