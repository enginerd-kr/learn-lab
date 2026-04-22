from typing import TypedDict

from langchain.agents import create_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import interrupt
from pydantic import BaseModel, Field

from model import llm

# ============================================================
# Chain: prompt | structured_llm 으로 구성된 단순 파이프라인
# ============================================================


class ReviewAnalysis(BaseModel):
    sentiment: str = Field(description="positive | negative | neutral")
    summary: str
    keywords: list[str]


prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "너는 영화 리뷰 분석가야. sentiment(positive|negative|neutral), "
            "summary, keywords를 뽑아 구조화된 결과로 답해.",
        ),
        ("user", "다음 리뷰를 분석해줘:\n{review}"),
    ]
)

structured_llm = llm.with_structured_output(ReviewAnalysis)
chain = prompt | structured_llm


# ============================================================
# Agent: create_react_agent 으로 구성된 tool-calling 에이전트
# ============================================================


@tool
def keyword_count(keywords: list[str]) -> int:
    """주어진 키워드 리스트의 개수를 반환한다."""
    return len(keywords)


@tool
def sentiment_emoji(sentiment: str) -> str:
    """sentiment(positive|negative|neutral)에 해당하는 이모지를 반환한다."""
    return {"positive": "😀", "negative": "😡", "neutral": "😐"}.get(sentiment, "❓")


summary_agent = create_agent(
    model=llm,
    tools=[keyword_count, sentiment_emoji],
    system_prompt=(
        "너는 리뷰 분석 결과를 사람에게 전달하는 요약가야. "
        "제공된 tool들을 활용해서 sentiment 이모지와 키워드 개수를 포함한 "
        "한국어 한 문단짜리 최종 요약을 작성해."
    ),
)


# ============================================================
# Graph: StateGraph 로 analyze → human_review(HITL) → summarize 흐름 구성
# ============================================================


class State(TypedDict):
    review: str
    analysis: ReviewAnalysis | None
    final: ReviewAnalysis | None
    summary: str | None


def analyze(state: State):
    result = chain.invoke({"review": state["review"]})
    return {"analysis": result}


def human_review(state: State):
    edited = interrupt(
        {
            "question": "분석 결과를 확인해 주세요. 필요하면 수정 후 승인하세요.",
            "analysis": state["analysis"].model_dump(),
        }
    )
    return {"final": ReviewAnalysis(**edited)}


def summarize(state: State):
    final = state["final"]
    user_msg = (
        "아래 분석 결과를 바탕으로 최종 요약을 작성해줘.\n"
        f"- sentiment: {final.sentiment}\n"
        f"- summary: {final.summary}\n"
        f"- keywords: {final.keywords}"
    )
    result = summary_agent.invoke({"messages": [{"role": "user", "content": user_msg}]})
    return {"summary": result["messages"][-1].content}


builder = StateGraph(State)
builder.add_node("analyze", analyze)
builder.add_node("human_review", human_review)
builder.add_node("summarize", summarize)
builder.add_edge(START, "analyze")
builder.add_edge("analyze", "human_review")
builder.add_edge("human_review", "summarize")
builder.add_edge("summarize", END)

graph = builder.compile(checkpointer=InMemorySaver())
