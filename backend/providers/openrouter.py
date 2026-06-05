from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

client = OpenAI(
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


def chat(model, messages):

    completion = client.chat.completions.create(
        model=model,
        messages=[SYSTEM_PROMPT] + messages
    )

    return completion.choices[0].message.content


def stream(model, messages):

    stream = client.chat.completions.create(
        model=model,
        messages=[SYSTEM_PROMPT] + messages,
        stream=True
    )

    for chunk in stream:

        delta = chunk.choices[0].delta.content

        if delta:
            yield delta
