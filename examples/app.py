from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from langgraph.types import Command
from pydantic import BaseModel

from graph import graph

app = FastAPI(title="langgraph-chain-interrupt-demo")

STATIC_DIR = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


class InvokeRequest(BaseModel):
    thread_id: str
    review: str


class ResumeRequest(BaseModel):
    thread_id: str
    sentiment: str
    summary: str
    keywords: list[str]


@app.get("/")
def index():
    return FileResponse(STATIC_DIR / "index.html")


@app.post("/invoke")
def invoke(req: InvokeRequest):
    cfg = {"configurable": {"thread_id": req.thread_id}}
    result = graph.invoke({"review": req.review}, config=cfg)
    interrupts = result.get("__interrupt__")
    if interrupts:
        return {"status": "interrupted", "payload": interrupts[0].value}
    return {
        "status": "done",
        "final": result["final"].model_dump(),
        "summary": result.get("summary"),
    }


@app.post("/resume")
def resume_endpoint(req: ResumeRequest):
    cfg = {"configurable": {"thread_id": req.thread_id}}
    edited = {
        "sentiment": req.sentiment,
        "summary": req.summary,
        "keywords": req.keywords,
    }
    result = graph.invoke(Command(resume=edited), config=cfg)
    return {
        "status": "done",
        "final": result["final"].model_dump(),
        "summary": result.get("summary"),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
