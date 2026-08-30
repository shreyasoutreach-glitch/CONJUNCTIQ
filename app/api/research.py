from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.ai.research_agent import ResearchAgent
from app.services.astronomy_tools import TOOLS_REGISTRY

router = APIRouter(prefix="/api/research", tags=["research"])

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

@router.post("/chat")
def research_chat(request: ChatRequest):
    try:
        agent = ResearchAgent()
        messages_dict = [{"role": m.role, "content": m.content} for m in request.messages]
        result = agent.chat(messages_dict)
        return result
    except Exception as e:
        # Failure handling rule 15: Never return 500 or blank UI
        # Every failure should become structured data
        return {
            "answer": "I encountered an internal error while processing the research query.",
            "tool_calls": [{"tool": "system", "status": "error", "message": str(e)}],
            "sources": [],
            "agent_status": "error"
        }

@router.get("/tools")
def get_tools():
    tools_info = []
    for k, v in TOOLS_REGISTRY.items():
        tools_info.append({
            "name": v["name"],
            "description": v["description"],
            "status": "available"
        })
    return {"tools": tools_info}
