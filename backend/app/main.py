from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import Base, SessionLocal, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Job Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/applications", response_model=list[schemas.ApplicationOut])
def list_applications(db: Session = Depends(get_db)):
    return crud.get_applications(db)


@app.post("/api/applications", response_model=schemas.ApplicationOut, status_code=201)
def create_application(application: schemas.ApplicationCreate, db: Session = Depends(get_db)):
    return crud.create_application(db, application)


@app.get("/api/applications/{application_id}", response_model=schemas.ApplicationOut)
def get_application(application_id: int, db: Session = Depends(get_db)):
    db_application = crud.get_application(db, application_id)
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return db_application


@app.patch("/api/applications/{application_id}", response_model=schemas.ApplicationOut)
def update_application(
    application_id: int, changes: schemas.ApplicationUpdate, db: Session = Depends(get_db)
):
    db_application = crud.get_application(db, application_id)
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return crud.update_application(db, db_application, changes)


@app.delete("/api/applications/{application_id}", status_code=204)
def delete_application(application_id: int, db: Session = Depends(get_db)):
    db_application = crud.get_application(db, application_id)
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    crud.delete_application(db, db_application)


@app.post(
    "/api/applications/{application_id}/contacts",
    response_model=schemas.ContactOut,
    status_code=201,
)
def create_contact(
    application_id: int, contact: schemas.ContactCreate, db: Session = Depends(get_db)
):
    db_application = crud.get_application(db, application_id)
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return crud.create_contact(db, application_id, contact)


@app.patch("/api/contacts/{contact_id}", response_model=schemas.ContactOut)
def update_contact(contact_id: int, changes: schemas.ContactUpdate, db: Session = Depends(get_db)):
    db_contact = crud.get_contact(db, contact_id)
    if db_contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    return crud.update_contact(db, db_contact, changes)


@app.delete("/api/contacts/{contact_id}", status_code=204)
def delete_contact(contact_id: int, db: Session = Depends(get_db)):
    db_contact = crud.get_contact(db, contact_id)
    if db_contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    crud.delete_contact(db, db_contact)
