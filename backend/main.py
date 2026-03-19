from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database.init_db import init as init_db
from routers import usage, conversations, chat, admin, settings

app = FastAPI(title="Raymond Reddington API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(usage.router, prefix="/api")
app.include_router(conversations.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(settings.router, prefix="/api")


@app.on_event("startup")
def startup():
    init_db()
