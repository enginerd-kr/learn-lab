from fastapi import FastAPI
from pydantic import BaseModel

from agent import agent

app = FastAPI(title="simple_agent_graph")


class ChatRequest(BaseModel):
    thread_id: str
    messages: list[tuple[str, str]]


class ChatResponse(BaseModel):
    answer: str


@app.post("/invoke", response_model=ChatResponse)
def invoke(req: ChatRequest) -> ChatResponse:
    config = {"configurable": {"thread_id": req.thread_id}}
    result = agent.invoke(input={"messages": req.messages}, config=config)
    last = result["messages"][-1]
    return ChatResponse(answer=last.content)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
