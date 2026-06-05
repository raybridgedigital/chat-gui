from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from providers.factory import get_provider

app = FastAPI()

from fastapi import UploadFile, File
import fitz


@app.post("/extract-pdf")
async def extract_pdf(
    file: UploadFile = File(...)
):

    pdf_bytes = await file.read()

    doc = fitz.open(
        stream=pdf_bytes,
        filetype="pdf"
    )

    text_content = ""

    for page in doc:
        text_content += page.get_text()

    doc.close()

    return {
        "text": text_content
    }



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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

    provider = get_provider(req.provider)

    response = provider.chat(
        req.model,
        req.messages
    )

    return {
        "response": response
    }


@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):

    provider = get_provider(req.provider)

    return StreamingResponse(
        provider.stream(
            req.model,
            req.messages
        ),
        media_type="text/plain"
    )
