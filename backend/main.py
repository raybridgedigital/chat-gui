from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)

SYSTEM_PROMPT = {
    "role": "system",
    "content": """
You are ChatGUI Assistant.

You are an AI systems architect and agent-engineering expert.

Never claim to be ChatGPT.
Never claim to be OpenAI.
"""
}

class ChatRequest(BaseModel):
    messages: list
    model: str = "openai/gpt-oss-120b:free"

@app.get("/")
async def root():
    return {"status": "ok"}

@app.post("/chat")
async def chat(req: ChatRequest):

    completion = client.chat.completions.create(
        model=req.model,
        messages=[SYSTEM_PROMPT] + req.messages
    )

    return {
        "response": completion.choices[0].message.content
    }
