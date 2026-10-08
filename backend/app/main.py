from pathlib import Path

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, Response
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from . import auth, crud, models, schemas
from .database import Base, SessionLocal, engine, get_db

Base.metadata.create_all(bind=engine)

FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"

app = FastAPI(title="Job Tracker API")

# Every route on this router requires a logged-in user.
router = APIRouter(dependencies=[Depends(auth.get_current_user)])


@app.post("/api/auth/login", response_model=schemas.UserOut)
def login(
    credentials: schemas.LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    user = auth.authenticate(request, db, credentials.email, credentials.password)
    auth.start_session(request, response, db, user)
    return user


@app.post("/api/auth/logout", status_code=204)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    auth.end_session(request, response, db)


@app.get("/api/auth/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(auth.get_current_user)):
    return user


@router.get("/api/applications", response_model=list[schemas.ApplicationOut])
def list_applications(
    db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)
):
    return crud.get_applications(db, user)


@router.post("/api/applications", response_model=schemas.ApplicationOut, status_code=201)
def create_application(
    application: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    return crud.create_application(db, user, application)


@router.get("/api/applications/{application_id}", response_model=schemas.ApplicationOut)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    db_application = crud.get_application(db, user, application_id)
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return db_application


@router.patch("/api/applications/{application_id}", response_model=schemas.ApplicationOut)
def update_application(
    application_id: int,
    changes: schemas.ApplicationUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    db_application = crud.get_application(db, user, application_id)
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return crud.update_application(db, db_application, changes)


@router.delete("/api/applications/{application_id}", status_code=204)
def delete_application(
    application_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    db_application = crud.get_application(db, user, application_id)
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    crud.delete_application(db, db_application)


@router.post(
    "/api/applications/{application_id}/contacts",
    response_model=schemas.ContactOut,
    status_code=201,
)
def create_contact(
    application_id: int,
    contact: schemas.ContactCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    db_application = crud.get_application(db, user, application_id)
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return crud.create_contact(db, application_id, contact)


@router.patch("/api/contacts/{contact_id}", response_model=schemas.ContactOut)
def update_contact(
    contact_id: int,
    changes: schemas.ContactUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    db_contact = crud.get_contact(db, user, contact_id)
    if db_contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    return crud.update_contact(db, db_contact, changes)


@router.delete("/api/contacts/{contact_id}", status_code=204)
def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    db_contact = crud.get_contact(db, user, contact_id)
    if db_contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    crud.delete_contact(db, db_contact)


app.include_router(router)

# Serve the built frontend (npm run build) so the app and API share one origin.
if FRONTEND_DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str):
        if path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        file = (FRONTEND_DIST / path).resolve()
        if path and file.is_file() and FRONTEND_DIST in file.parents:
            return FileResponse(file)
        return FileResponse(FRONTEND_DIST / "index.html")
