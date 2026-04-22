from fastapi import FastAPI
from pydantic import BaseModel

from graph import graph

app = FastAPI(title="simple_graph")


class ChatRequest(BaseModel):
    messages: list[tuple[str, str]]


class ChatResponse(BaseModel):
    answer: str


@app.post("/invoke", response_model=ChatResponse)
def invoke(req: ChatRequest) -> ChatResponse:
    result = graph.invoke(input={"messages": req.messages})
    last = result["messages"][-1]
    return ChatResponse(answer=last.content)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
