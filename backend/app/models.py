import enum

from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class ApplicationStatus(str, enum.Enum):
    SAVED = "saved"
    APPLIED = "applied"
    INTERVIEWING = "interviewing"
    OFFER = "offer"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    # NULL = not yet claimed by any account (e.g. rows migrated from the old SQLite DB).
    # SET NULL rather than CASCADE so deleting a user never deletes job data.
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    company = Column(String, nullable=False)
    role = Column(String, nullable=False)
    status = Column(Enum(ApplicationStatus), nullable=False, default=ApplicationStatus.SAVED)
    job_url = Column(String, nullable=True)
    location = Column(String, nullable=True)
    salary = Column(String, nullable=True)
    applied_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    company_notes = Column(Text, nullable=True)
    prep_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    contacts = relationship(
        "Contact",
        back_populates="application",
        cascade="all, delete-orphan",
        order_by="Contact.id",
    )


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(
        Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False
    )
    name = Column(String, nullable=False)
    role = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    met_on = Column(Date, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    application = relationship("Application", back_populates="contacts")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False, unique=True, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class UserSession(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    # SHA-256 of the cookie token, so a leaked DB doesn't leak live sessions.
    token_hash = Column(String, nullable=False, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User")
