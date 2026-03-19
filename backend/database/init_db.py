from database.engine import Base, engine
# Import models so SQLAlchemy registers them before create_all
from database import models  # noqa: F401


def init():
    Base.metadata.create_all(bind=engine)
