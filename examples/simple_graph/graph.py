from typing import Annotated, TypedDict

from langchain.chat_models import init_chat_model
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages

model = init_chat_model("anthropic:claude-sonnet-4-6")


class State(TypedDict):
    messages: Annotated[list, add_messages]


def agent(state: State) -> dict:
    return {"messages": [model.invoke(state["messages"])]}


builder = StateGraph(State)
builder.add_node("agent", agent)
builder.add_edge(START, "agent")
builder.add_edge("agent", END)

graph = builder.compile()
