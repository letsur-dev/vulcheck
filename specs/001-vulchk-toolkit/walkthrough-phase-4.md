# Walkthrough: Phase 4 - Report Templates and i18n

**생성일**: 2026-03-01
**커밋 수**: 1

## 요약

codeinspector와 hacksimulator 양쪽 SKILL.md에 3개 언어(en/ko/ja) 번역
테이블과 포괄적인 비밀값 마스킹(redaction) 패턴을 추가했습니다. 리포트 섹션
헤더, 심각도 라벨, 필드 라벨이 모두 번역 테이블로 정의되어 있으며, 리포트
템플릿은 `{placeholder}` 구문으로 참조합니다.

## 변경된 파일

| 상태 | 파일 | 설명 |
|------|------|------|
| M | src/templates/skills/vulchk-codeinspector/SKILL.md | i18n 번역 테이블 + 마스킹 패턴 추가 |
| M | src/templates/skills/vulchk-hacksimulator/SKILL.md | i18n 번역 테이블 + 마스킹 패턴 추가 |
| M | specs/001-vulchk-toolkit/tasks.md | Phase 4 완료 표시 |

## 상세 변경 내역

### codeinspector SKILL.md
**목적**: 리포트 생성 시 언어별 번역을 정확하게 적용할 수 있도록 참조 테이블 제공.

추가된 섹션:
- **Report Language Reference**: en/ko/ja 3개 언어의 30+ 항목 번역 테이블
  - 리포트 제목, 날짜, 프로젝트, 기술 스택, 요약, 심각도 설명 등
  - 분석 범위 테이블 헤더 (검사 항목, 상태, 스캔된 파일 수, 발견 수)
  - 권장 사항, 생성 크레딧 등
- **Severity Labels by Language**: Critical~Informational 5단계 심각도의 3개 언어 표기
  - 영어 원문 유지 + 괄호 안에 번역 (예: `Critical (치명적)`)
- **Redaction Rules**: 민감 데이터 마스킹 규칙
  - API Key, AWS Key, Password, Token, Private Key, Connection String, JWT
  - 첫 4자 + 마지막 4자만 표시, 나머지는 `****...****`로 대체
  - 8자 미만은 첫 2자 + 마지막 2자
  - Private Key는 전체 `[PRIVATE KEY REDACTED]`로 대체
  - Connection String은 비밀번호 부분만 마스킹

### hacksimulator SKILL.md
**목적**: 모의해킹 리포트에도 동일한 i18n 및 마스킹 기준 적용.

추가된 섹션:
- **Report Language Reference**: en/ko/ja 3개 언어의 35+ 항목 번역 테이블
  - codeinspector와 동일한 공통 항목 + 모의해킹 전용 항목
  - 공격 계획 요약, 공격 벡터, 페이로드, 공격 로그 등
  - 테스트 범위 (수행/건너뛴 테스트, 제약 사항)
- **Severity Labels by Language**: codeinspector와 동일
- **Intensity Labels by Language**: Passive/Active/Aggressive 3단계 강도의 3개 언어 표기
- **Redaction Rules**: codeinspector와 동일한 마스킹 규칙 + 추가 항목
  - Session Cookie, Set-Cookie 값 마스킹
  - 테스트 페이로드(XSS 프로브, SQLi 문자열)는 마스킹 불필요 (테스터 입력이므로)

### 리포트 템플릿 변경
- 기존: 영어 하드코딩된 섹션 헤더 → 새로운: `{placeholder}` 구문 사용
- 예: `## Executive Summary` → `## {Executive Summary}`
- LLM이 번역 테이블에서 해당 언어의 값을 참조하여 대체

## 주요 결정 사항

- **결정**: 번역 테이블을 SKILL.md에 직접 임베딩 (별도 파일 아님)
  - **이유**: LLM이 스킬 실행 시 단일 파일만 읽으므로 참조 효율성 극대화
  - **고려한 대안**: `src/templates/i18n/` 디렉토리에 별도 파일 → 추가 파일 읽기 필요

- **결정**: 보안 용어는 모든 언어에서 영어 유지 + 괄호 번역
  - **이유**: CVE, XSS, CSRF 등은 국제 표준 용어이며 번역하면 의미 왜곡 위험
  - **고려한 대안**: 완전 번역 → 전문가가 리포트를 볼 때 혼란 가능

- **결정**: 심각도 라벨을 `Critical (치명적)` 형식으로 통일
  - **이유**: 영어 원문 유지로 다국어 팀에서의 커뮤니케이션 일관성 확보
  - **고려한 대안**: 한국어/일본어만 표시 → 영어권 팀원이 이해 어려움

- **결정**: Redaction 규칙을 두 스킬에 각각 포함 (중복)
  - **이유**: 각 스킬이 독립적으로 실행되므로 자체 참조 필요
  - **고려한 대안**: 공유 파일 참조 → 스킬 실행 중 추가 파일 로딩 불확실

## 작업 메모리 노트

> - 번역 테이블은 확장 가능: 새 언어(zh 등) 추가 시 컬럼만 추가하면 됨
> - `{placeholder}` 구문은 리포트 템플릿 내에서만 사용 — 실제 코드 변수가 아님
> - 마스킹 규칙은 sub-agent에도 이미 존재 (secrets-scanner, git-history-auditor)
>   하지만 최종 리포트 작성 시 스킬 수준에서 한번 더 검증
> - Phase 5에서 테스트 시 YAML frontmatter 유효성 + 번역 테이블 완전성 검증 예정

## 커밋

| 해시 | 메시지 |
|------|--------|
| f60a00a | feat: add i18n report templates and redaction patterns to both skills |
