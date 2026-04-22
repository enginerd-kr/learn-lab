# LangGraph + Chain + Interrupt Demo

영화 리뷰를 **LangChain 체인**(`prompt | model | with_structured_output`)으로 분석하고,
**LangGraph interrupt**로 사람이 결과를 검토·수정 후 재개하는 최소 예제.

- 서빙: FastAPI + uvicorn
- 프론트엔드: 단일 HTML (`static/index.html`)

## 실행

```bash
cd examples
uv sync
uv run python app.py
# → http://localhost:8000
```

## 흐름

```
START → analyze (chain) → ⏸ human_review (interrupt) → END
```

1. `POST /invoke` → 체인이 리뷰를 분석하고 `human_review` 노드의 `interrupt()`에서 멈춤
2. 프론트에서 결과 수정 → `POST /resume` → `Command(resume=...)`로 재개 → 최종 결과 반환

동일 `thread_id`의 상태는 `InMemorySaver` 체크포인터가 유지.
