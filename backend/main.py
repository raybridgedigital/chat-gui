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

openrouter_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)

SYSTEM_PROMPT = {
    "role": "system",
    "content": """
You are ChatGUI Assistant.

You are an AI systems architect and agent-engineering expert.
"""
}


class ChatRequest(BaseModel):
    provider: str = "openrouter"
    model: str
    messages: list


@app.get("/")
async def root():
    return {"status": "ok"}


@app.get("/models")
async def get_models():

    return {
        "openrouter": [
            {
                "name": "GPT OSS 120B",
                "id": "openai/gpt-oss-120b:free"
            },
            {
                "name": "DeepSeek R1",
                "id": "deepseek/deepseek-r1"
            },
            {
                "name": "Qwen3 32B",
                "id": "qwen/qwen3-32b"
            }
        ],
        "ollama": [
            {
                "name": "Qwen3 14B",
                "id": "qwen3:14b"
            },
            {
                "name": "Qwen3 32B",
                "id": "qwen3:32b"
            }
        ]
    }


@app.post("/chat")
async def chat(req: ChatRequest):

    if req.provider == "openrouter":

        completion = openrouter_client.chat.completions.create(
            model=req.model,
            messages=[SYSTEM_PROMPT] + req.messages
        )

        return {
            "response":
            completion.choices[0].message.content
        }

    return {
        "response":
        f"Provider '{req.provider}' not implemented yet."
    }
