from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from .models import ApplicationStatus


class ContactBase(BaseModel):
    name: str
    role: Optional[str] = None
    notes: Optional[str] = None
    met_on: Optional[date] = None


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    notes: Optional[str] = None
    met_on: Optional[date] = None


class ContactOut(ContactBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    application_id: int
    created_at: datetime


class ApplicationBase(BaseModel):
    company: str
    role: str
    status: ApplicationStatus = ApplicationStatus.SAVED
    job_url: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    applied_date: Optional[date] = None
    notes: Optional[str] = None
    company_notes: Optional[str] = None
    prep_notes: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    status: Optional[ApplicationStatus] = None
    job_url: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    applied_date: Optional[date] = None
    notes: Optional[str] = None
    company_notes: Optional[str] = None
    prep_notes: Optional[str] = None


class ApplicationOut(ApplicationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    contacts: list[ContactOut] = []
