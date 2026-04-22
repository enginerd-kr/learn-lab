# AGENTS.md — learn-lab 슬라이드 작성 가이드

이 저장소는 정적 HTML 슬라이드 덱 모음이다. 공통 런타임 두 개(`slides.*`, `magic-code.*`)를 `docs/assets/` 에 두고, 각 강의는 자신의 폴더에 `index.html` 만 추가하면 된다. 새 덱을 만들거나 기존 덱을 수정할 때 이 문서를 따른다.

## 저장소 구조

```text
learn-lab/
  AGENTS.md                         ← 이 파일
  docs/                             ← GitHub Pages 소스 루트 (main /docs)
    index.html                      ← TOC (강의 카드 목록)
    assets/
      slides.css  slides.js         ← 슬라이드 네비 라이브러리
      magic-code.css  magic-code.js ← shiki-magic-move 코드 스텝 라이브러리
    <lecture-slug>/
      index.html                    ← 강의 덱
      examples/                     ← (선택) 관련 실행 예제 프로젝트
```

새 강의를 추가하려면 `docs/<lecture-slug>/index.html` 을 만들고 `docs/index.html` TOC 에 카드를 추가한다.

## 강의 덱 템플릿

최소 골격. 경로는 모두 `../assets/...`, `../` 상대경로를 쓴다.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>강의 제목</title>

<style>
  :root {
    --bg: #0f172a; --surface: #1e293b; --surface-2: #334155;
    --text: #e2e8f0; --muted: #94a3b8;
    --accent: #38bdf8; --accent-2: #a78bfa;
    --code-bg: #0b1220;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    height: 100%; background: var(--bg); color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Noto Sans KR", sans-serif;
    overflow: hidden;
  }
  /* 슬라이드 콘텐츠용 스타일(h1/h2/카드/코드 컬러 등)은 강의별로 여기에 */
</style>

<link rel="stylesheet" href="../assets/slides.css">
<link rel="stylesheet" href="../assets/magic-code.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/shiki-magic-move@0.5.0/dist/style.css">

<script type="importmap">
{
  "imports": {
    "shiki": "https://esm.sh/shiki@1.22.0",
    "shiki-magic-move/": "https://esm.sh/shiki-magic-move@0.5.0/"
  }
}
</script>
</head>
<body>
  <div class="hint">← → 키 또는 Space 로 이동</div>

  <div class="deck" id="deck">
    <section class="slide active">
      <h1>제목</h1>
      <p class="subtitle">부제</p>
    </section>
    <!-- 필요한 만큼 <section class="slide"> … </section> 을 추가 -->
  </div>

  <div class="nav">
    <a class="nav-home" href="../" aria-label="목차로" title="목차로">☰</a>
    <button id="prev" aria-label="이전">‹</button>
    <div class="dots" id="dots"></div>
    <span class="counter" id="counter">1 / 1</span>
    <button id="next" aria-label="다음">›</button>
  </div>

<script type="module" src="../assets/slides.js"></script>
<script type="module" src="../assets/magic-code.js"></script>
</body>
</html>
```

- `<head>` 의 **importmap + shiki-magic-move dist/style.css** 는 필수. 브라우저 importmap 은 최상위 문서에서만 선언 가능해서 라이브러리로 빼지 못한다.
- 첫 슬라이드는 `<section class="slide active">` 로 둔다. 나머지는 `class="slide"`.
- `.nav` 의 `#prev`, `#next`, `#dots`, `#counter` id 는 `slides.js` 가 찾는 규약. 구조를 유지.
- `.nav-home` 링크는 강의 덱에서 TOC 로 돌아가는 경로(`../`). 생략해도 무방.

## 슬라이드 애니메이션 · 스크롤 (slides.js)

`docs/assets/slides.js` 가 자동 초기화한다. 호스트가 신경쓸 것:

- **키보드**: ←/→/Space/PageUp/PageDown/Home/End — 자동 바인딩됨.
- **safe center 레이아웃**: `.slide` 는 `justify-content: safe center` 이므로 내용이 길어도 상단부터 스크롤 가능. 슬라이드 전환 시 내부 스크롤은 자동으로 맨 위로 리셋된다.
- **확장점 — 커스텀 이벤트**: 다음 슬라이드로 가기 직전 활성 슬라이드에 **cancelable** 한 `slides:beforenext` / `slides:beforeprev` 가 디스패치된다. 리스너가 `event.preventDefault()` 를 호출하면 해당 네비가 **소비됨** → 슬라이드는 이동하지 않는다. 슬라이드 안에서 로컬 상태(예: 스텝, 클릭 공개, 폼 진행)를 먼저 전진시키고 싶을 때 이 이벤트를 훅한다. `magic-code.js` 가 이 방식으로 코드 스텝을 먼저 돌린다.
- **프로그래밍 API**: 필요하면 `window.__slides = { goTo, next, prev, current, count }` 로 제어 가능.

## 코드 스텝 애니메이션 (magic-code.js)

단일 코드 블록을 여러 스텝으로 **모프** 하려면 `.magic-code` 엘리먼트로 감싸고 스텝 소스를 `<template data-step>` 자식으로 넣는다. `slides.js` 와 동일하게 자동 초기화된다.

```html
<section class="slide">
  <h2>LangGraph 시작하기</h2>

  <div class="magic-code" data-lang="python">
    <template data-step>from langgraph.graph import StateGraph, START, END</template>

    <template data-step>from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    review: str
    analysis: ReviewAnalysis | None</template>

    <template data-step>from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    review: str
    analysis: ReviewAnalysis | None

def agent(state: State):
    return {"analysis": chain.invoke({"review": state["review"]})}

builder = StateGraph(State)
builder.add_node("agent", agent)
builder.add_edge(START, "agent")
builder.add_edge("agent", END)
graph = builder.compile()</template>
  </div>
</section>
```

동작 요약:

- `<template data-step>` 안의 텍스트가 각 스텝의 코드 본문. 필요하면 빈 줄/주석도 그대로 유지된다. HTML 엔티티(`<`, `>`, `&`, `"`, `'`) 는 자동 디코딩됨.
- `data-lang="python"` 등 Shiki가 지원하는 언어를 지정. 전체 페이지의 magic-code 에서 사용된 언어가 dedupe 되어 **Shiki highlighter 한 번만 로드**한다.
- 덱 로드 시 첫 스텝이 렌더된다(애니메이션 없음).
- ←/→ 로 슬라이드를 넘길 때, 현재 슬라이드에 `.magic-code` 가 있으면 **코드 스텝을 먼저 전/후진** 한다. 끝/시작에 도달하면 다음/이전 슬라이드로 이동. 이 동작은 `slides:beforenext` 이벤트 훅으로 구현돼 있다.
- 각 블록 우하단에 `N / total` 스텝 카운터가 자동으로 붙는다.
- 코드가 길어서 뷰포트 밖으로 밀려나면 스텝 변경 시 `scrollIntoView` 로 자동 맞춤. `scroll-margin-top/bottom` 으로 상·하 여유 공간도 자동 확보.

튜닝이 필요하면 `docs/assets/magic-code.js` 상단 `RENDERER_OPTIONS` 상수(`duration`, `delayMove`, `delayLeave`, `delayEnter`, `stagger`, `easing`) 를 편집한다 — 전역 적용되며 라이브러리이므로 신중히.

## TOC 에 새 강의 노출

`docs/index.html` 의 `.lectures` 안에 카드 하나 추가:

```html
<a class="lecture" href="<lecture-slug>/">
  <span class="tag">Lecture N</span>
  <h2>강의 제목</h2>
  <p>한 줄 소개.</p>
</a>
```

## 로컬 검증

```bash
python3 -m http.server 8000 -d docs
# http://localhost:8000/ 에서 TOC → 강의 카드 → 덱 순서로 확인
```

확인 체크리스트:

1. ←/→/Space/Home/End 로 슬라이드 이동 + dots/counter 갱신
2. magic-code 가 있는 슬라이드에서 →/← 가 **코드 스텝을 먼저** 움직이고, 끝에서 슬라이드로 넘어감
3. 긴 슬라이드에서 상단부터 스크롤 접근 가능 + 슬라이드 전환 시 스크롤 맨 위로 리셋
4. 콘솔 에러 0

## 금지 / 주의

- 슬라이드/magic-code 공통 CSS·JS 를 강의별 `index.html` 에 다시 인라인하지 말 것. 수정은 `docs/assets/` 한 곳에서.
- `.slide` 의 `justify-content` 를 바꾸지 말 것 (`safe center` 가 상단 스크롤 접근을 보장).
- importmap 이나 shiki-magic-move 스타일시트를 제거하지 말 것 — 둘 다 있어야 애니메이션이 동작.
- `<template data-step>` 안에 DOM 을 넣지 말고 **순수 텍스트(코드)** 만. 들여쓰기는 원본 그대로.
