import os
import streamlit as st
from dotenv import load_dotenv
import anthropic

from persona import REDDINGTON_SYSTEM_PROMPT

load_dotenv()

# ── Page config ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Raymond Reddington",
    page_icon="🎩",
    layout="centered",
)

st.title("🎩 Raymond Reddington")
st.caption("*'I'm not a criminal because I need the money. I'm a criminal because it suits me.'*")

# ── Anthropic client ──────────────────────────────────────────────────────────
api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    st.error("ANTHROPIC_API_KEY not found. Create a .env file with your key.")
    st.stop()

client = anthropic.Anthropic(api_key=api_key)

# ── Session state ─────────────────────────────────────────────────────────────
if "messages" not in st.session_state:
    st.session_state.messages = []

if "greeted" not in st.session_state:
    st.session_state.greeted = False

# ── Opening monologue (generated once, on first load) ─────────────────────────
if not st.session_state.greeted:
    with st.chat_message("assistant", avatar="🎩"):
        placeholder = st.empty()
        opening = ""
        with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=400,
            system=REDDINGTON_SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": (
                        "Greet me. You've just arrived — perhaps you've poured yourself "
                        "a drink — and you want to set the tone for our conversation."
                    ),
                }
            ],
        ) as stream:
            for text in stream.text_stream:
                opening += text
                placeholder.markdown(opening + "▌")
        placeholder.markdown(opening)

    # Store the greeting in history so context is preserved
    st.session_state.messages.append({"role": "assistant", "content": opening})
    st.session_state.greeted = True

# ── Render existing history ───────────────────────────────────────────────────
for msg in st.session_state.messages:
    avatar = "🎩" if msg["role"] == "assistant" else "🗣️"
    with st.chat_message(msg["role"], avatar=avatar):
        st.markdown(msg["content"])

# ── Chat input ────────────────────────────────────────────────────────────────
user_input = st.chat_input("Say something…")

if user_input:
    # Show user message
    with st.chat_message("user", avatar="🗣️"):
        st.markdown(user_input)

    # Append to history
    st.session_state.messages.append({"role": "user", "content": user_input})

    # Build API messages list (full history)
    api_messages = [
        {"role": m["role"], "content": m["content"]}
        for m in st.session_state.messages
    ]

    # Stream Red's response
    with st.chat_message("assistant", avatar="🎩"):
        placeholder = st.empty()
        response_text = ""
        with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=REDDINGTON_SYSTEM_PROMPT,
            messages=api_messages,
        ) as stream:
            for text in stream.text_stream:
                response_text += text
                placeholder.markdown(response_text + "▌")
        placeholder.markdown(response_text)

    # Append assistant response to history
    st.session_state.messages.append({"role": "assistant", "content": response_text})
