from typing import AsyncGenerator, List, Dict, Optional

import anthropic

from config import settings
from persona import REDDINGTON_SYSTEM_PROMPT

_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


def build_messages(
    history: List[Dict],
    user_msg: str,
    rag_chunks: List[Dict],
) -> tuple[str, List[Dict]]:
    system = REDDINGTON_SYSTEM_PROMPT

    if rag_chunks:
        context_block = "\n\n---\n## Reference Transcripts\n"
        for chunk in rag_chunks:
            ep = chunk.get("episode", "")
            label = f" [{ep}]" if ep else ""
            context_block += f"\n{chunk['text']}{label}\n"
        system = system + context_block

    messages = [{"role": m["role"], "content": m["content"]} for m in history]
    messages.append({"role": "user", "content": user_msg})

    return system, messages


async def stream_response(
    system: str,
    messages: List[Dict],
    api_key: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    client = anthropic.AsyncAnthropic(api_key=api_key) if api_key else _get_client()
    async with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=800,
        system=[{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}],
        messages=messages,
        extra_headers={"anthropic-beta": "prompt-caching-2024-07-31"},
    ) as stream:
        async for text in stream.text_stream:
            yield text
