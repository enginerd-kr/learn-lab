# AGENTS.md

이 문서는 코딩 에이전트가 이 저장소에서 작업할 때 반드시 지켜야 할 규칙을 정의합니다.

## 1. 패키지 관리

### Python (uv 전용, pip 금지)

- 버전 확인: `pip index versions <패키지명>`
- 런타임 의존성 추가: `uv add <패키지명>==<버전>`
- 개발 의존성 추가: `uv add --dev <패키지명>==<버전>`
- **의존성 버전은 반드시 `==`로 고정할 것.** (`>=`, `^`, `~` 금지)

## 2. 버전 확인 명령어

```bash
python --version
node --version
uv --version
```
