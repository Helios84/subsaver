from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-memory storage (temporary, no DB yet) ---
users: dict[str, str] = {}  # email -> password (TEMP)

class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/auth/register")
def register(payload: RegisterRequest):
    email = payload.email.strip().lower()
    if email in users:
        raise HTTPException(status_code=400, detail="User already exists")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    users[email] = payload.password
    return {"message": "registered"}

@app.post("/auth/login")
def login(payload: LoginRequest):
    email = payload.email.strip().lower()
    if email not in users:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if users[email] != payload.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    # TEMP token (we'll replace with JWT later)
    return {"token": f"token-{email}"}
