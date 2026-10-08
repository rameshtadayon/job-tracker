from __future__ import annotations

from sqlalchemy.orm import Session

from . import models, schemas


def get_application(
    db: Session, user: models.User, application_id: int
) -> models.Application | None:
    return (
        db.query(models.Application)
        .filter(models.Application.id == application_id, models.Application.user_id == user.id)
        .first()
    )


def get_applications(db: Session, user: models.User) -> list[models.Application]:
    return (
        db.query(models.Application)
        .filter(models.Application.user_id == user.id)
        .order_by(models.Application.updated_at.desc())
        .all()
    )


def create_application(
    db: Session, user: models.User, application: schemas.ApplicationCreate
) -> models.Application:
    db_application = models.Application(user_id=user.id, **application.model_dump())
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    return db_application


def update_application(
    db: Session, db_application: models.Application, changes: schemas.ApplicationUpdate
) -> models.Application:
    for field, value in changes.model_dump(exclude_unset=True).items():
        setattr(db_application, field, value)
    db.commit()
    db.refresh(db_application)
    return db_application


def delete_application(db: Session, db_application: models.Application) -> None:
    db.delete(db_application)
    db.commit()


def get_contact(db: Session, user: models.User, contact_id: int) -> models.Contact | None:
    return (
        db.query(models.Contact)
        .join(models.Application)
        .filter(models.Contact.id == contact_id, models.Application.user_id == user.id)
        .first()
    )


def create_contact(
    db: Session, application_id: int, contact: schemas.ContactCreate
) -> models.Contact:
    db_contact = models.Contact(application_id=application_id, **contact.model_dump())
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact


def update_contact(
    db: Session, db_contact: models.Contact, changes: schemas.ContactUpdate
) -> models.Contact:
    for field, value in changes.model_dump(exclude_unset=True).items():
        setattr(db_contact, field, value)
    db.commit()
    db.refresh(db_contact)
    return db_contact


def delete_contact(db: Session, db_contact: models.Contact) -> None:
    db.delete(db_contact)
    db.commit()
