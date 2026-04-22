from langchain_core.tools import tool
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.prebuilt import create_react_agent


@tool
def get_weather(city: str) -> str:
    """도시의 현재 날씨를 반환."""
    return f"{city}: 맑음 22°C"


agent = create_react_agent(
    model="anthropic:claude-sonnet-4-6",
    tools=[get_weather],
    prompt="너는 친절한 한국어 비서야. 필요하면 툴을 사용해서 답해.",
    checkpointer=InMemorySaver(),
)
