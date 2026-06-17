import uuid

from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin, require_owner
from app.core.security import hash_password
from app.models.change_log import ChangeLog
from app.models.enums import UserRole
from app.models.product import Product
from app.models.user import User
from app.schemas.admin_user import AdminUserCreate, AdminUserOut, AdminUserUpdate
from app.schemas.change_log import ChangeLogOut
from app.schemas.product import ProductAdmin, ProductCreate, ProductUpdate
from app.services import audit
from app.services.storage import StorageClient, StorageError, get_storage_client

router = APIRouter(prefix="/admin", tags=["admin"])

# Product media uploads (images + short videos). Kept generous for video but
# bounded so a stray huge file can't exhaust memory on this single-process app.
MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25 MB per file
ALLOWED_MEDIA_PREFIXES = ("image/", "video/")


def _normalize_email(email: str) -> str:
    return email.strip().lower()


@router.get("/orders")
def list_orders(_: User = Depends(require_admin)) -> dict[str, list[dict]]:
    return {"orders": []}


@router.get("/products")
def list_products(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, list[ProductAdmin]]:
    """All products, every status (draft/scheduled/live/inactive) and soft-deleted."""
    products = db.scalars(select(Product).order_by(Product.created_at.desc())).all()
    return {"products": [ProductAdmin.model_validate(p) for p in products]}


@router.post("/products", status_code=status.HTTP_201_CREATED, response_model=ProductAdmin)
def create_product(
    payload: ProductCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Product:
    product = Product(**payload.model_dump())
    db.add(product)
    db.flush()  # assign product.id before writing the audit row (same transaction)
    audit.log_create(db, admin_id=admin.id, product_id=product.id)
    db.commit()
    db.refresh(product)
    return product


@router.post("/uploads", status_code=status.HTTP_201_CREATED)
def upload_media(
    files: list[UploadFile] = File(...),
    _: User = Depends(require_admin),
    storage: StorageClient = Depends(get_storage_client),
) -> dict[str, list[str]]:
    """Upload one or more product images/videos to object storage.

    Returns the public URLs in upload order; the admin form then stores them on
    the product's `images` list. Files are validated by MIME type and size.
    """
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files uploaded.")

    urls: list[str] = []
    for upload in files:
        label = upload.filename or "File"
        content_type = (upload.content_type or "").split(";")[0].strip().lower()
        if not content_type.startswith(ALLOWED_MEDIA_PREFIXES):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"{label}: only images and videos are allowed.",
            )

        content = upload.file.read()
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"{label} is larger than {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
            )

        try:
            url = storage.upload_file(
                content, content_type=content_type, filename=upload.filename
            )
        except StorageError as exc:  # storage misconfigured (missing bucket/url)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)
            ) from exc
        except ClientError as exc:  # storage accepted the call but rejected the file
            err = getattr(exc, "response", {}).get("Error", {})
            code = err.get("Code", "")
            if code == "InvalidMimeType":
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail=f"{label}: storage does not allow {content_type} files.",
                ) from exc
            if code in ("EntityTooLarge", "MaxFileSizeExceeded"):
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"{label} exceeds the storage size limit.",
                ) from exc
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Could not upload {label}: {err.get('Message') or 'storage error'}.",
            ) from exc
        except Exception as exc:  # network / boto failure — keep the site usable
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Could not upload {label} to storage.",
            ) from exc
        urls.append(url)

    return {"urls": urls}


@router.patch("/products/{product_id}", response_model=ProductAdmin)
def update_product(
    product_id: uuid.UUID,
    payload: ProductUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # Apply only fields that actually change, and audit each one.
    diffs: list[tuple[str, object, object]] = []
    for field, new_value in payload.model_dump(exclude_unset=True).items():
        old_value = getattr(product, field)
        if old_value != new_value:
            diffs.append((field, old_value, new_value))
            setattr(product, field, new_value)

    audit.log_updates(db, admin_id=admin.id, product_id=product.id, diffs=diffs)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}", response_model=ProductAdmin)
def delete_product(
    product_id: uuid.UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Product:
    """Soft delete: flip is_active=false. The row is never removed (order history)."""
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if product.is_active:  # idempotent: only log a real state change
        product.is_active = False
        audit.log_delete(db, admin_id=admin.id, product_id=product.id)
    db.commit()
    db.refresh(product)
    return product


@router.get("/change-log")
def list_change_log(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, list[ChangeLogOut]]:
    """Admin audit history, newest first."""
    entries = db.scalars(select(ChangeLog).order_by(ChangeLog.created_at.desc())).all()
    return {"entries": [ChangeLogOut.model_validate(e) for e in entries]}


# ---- Admin team management (owner-only mutations; no public registration) ---
# Every admin may VIEW the team (GET, require_admin) so the dashboard can render
# it, but only the store owner may add or deactivate admins (require_owner).


@router.get("/users")
def list_admins(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, list[AdminUserOut]]:
    """All admin accounts (active and deactivated), oldest first."""
    admins = db.scalars(
        select(User).where(User.role == UserRole.admin).order_by(User.created_at)
    ).all()
    return {"admins": [AdminUserOut.model_validate(a) for a in admins]}


@router.post("/users", status_code=status.HTTP_201_CREATED, response_model=AdminUserOut)
def create_admin(
    payload: AdminUserCreate,
    _: User = Depends(require_owner),
    db: Session = Depends(get_db),
) -> User:
    email = _normalize_email(payload.email)
    if db.scalar(select(User).where(User.email == email)) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )
    user = User(
        name=payload.name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
        role=UserRole.admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=AdminUserOut)
def update_admin(
    user_id: uuid.UUID,
    payload: AdminUserUpdate,
    admin: User = Depends(require_owner),
    db: Session = Depends(get_db),
) -> User:
    """Activate or deactivate an admin. You can't deactivate yourself (lockout)."""
    if user_id == admin.id and not payload.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can't deactivate your own account.",
        )
    user = db.get(User, user_id)
    if user is None or user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found")

    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user
