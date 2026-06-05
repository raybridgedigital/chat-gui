from providers import openrouter
from providers import ollama


def get_provider(name):

    if name == "openrouter":
        return openrouter

    if name == "ollama":
        return ollama

    raise ValueError(f"Unknown provider: {name}")
