from fastapi import FastAPI
from pydantic import BaseModel

from chain import chain

app = FastAPI(title="simple_chain")


class ChatRequest(BaseModel):
    messages: list[tuple[str, str]]


class ChatResponse(BaseModel):
    answer: str


@app.post("/invoke", response_model=ChatResponse)
def invoke(req: ChatRequest) -> ChatResponse:
    answer = chain.invoke(input={"messages": req.messages})
    return ChatResponse(answer=answer)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
