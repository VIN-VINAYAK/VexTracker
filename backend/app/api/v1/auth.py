from fastapi import APIRouter, HTTPException, status

from app.api.v1.deps import CurrentUser
from app.auth.security import create_access_token, get_password_hash, verify_password
from app.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserPublic
from app.services.mock_store import find_memory_user_by_email, login_memory_user, register_memory_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def register_user(payload: RegisterRequest):
    try:
        existing_user = await User.find_one(User.email == payload.email)
    except Exception:
        existing_user = None

    if existing_user is None:
        memory_user = find_memory_user_by_email(payload.email)
        if memory_user is not None:
            existing_user = memory_user

    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    try:
        user = User(
            full_name=payload.full_name,
            email=payload.email,
            phone=payload.phone,
            password_hash=get_password_hash(payload.password),
            role=payload.role,
        )
        await user.insert()
        return UserPublic(
            id=str(user.id),
            full_name=user.full_name,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
        )
    except Exception:
        user = register_memory_user({
            "full_name": payload.full_name,
            "email": payload.email,
            "password": payload.password,
            "phone": payload.phone,
            "role": payload.role,
        })
        return UserPublic(
            id=str(user["id"]),
            full_name=user["full_name"],
            email=user["email"],
            role=user["role"],
            is_active=user.get("is_active", True),
        )


@router.post("/login", response_model=TokenResponse)
async def login_user(payload: LoginRequest):
    try:
        user = await User.find_one(User.email == payload.email)
    except Exception:
        user = None

    if user is not None and hasattr(user, "email") and hasattr(user, "password_hash"):
        if verify_password(payload.password, user.password_hash):
            token = create_access_token(subject=user.email)
            return {"access_token": token, "token_type": "bearer"}

    memory_user = login_memory_user(str(payload.email), payload.password)
    if memory_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(subject=str(memory_user["email"]))
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserPublic)
async def me(current_user: CurrentUser):
    return UserPublic(
        id=str(current_user.id),
        full_name=current_user.full_name,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
    )
