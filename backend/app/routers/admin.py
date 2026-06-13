from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_role
from app.models.user import User
from app.services.sync import SyncResult
from app.services.sync import sync_catalog as run_catalog_sync

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/orders")
def list_orders(_: User = Depends(require_role("seller"))) -> dict[str, list[dict]]:
    return {"orders": []}


@router.get("/products/{product_id}/extras")
def get_product_extras(
    product_id: str, _: User = Depends(require_role("seller"))
) -> dict[str, str | None]:
    return {"product_id": product_id, "long_description": None}


@router.post("/products/{product_id}/extras", status_code=status.HTTP_202_ACCEPTED)
def update_product_extras(
    product_id: str, _: User = Depends(require_role("seller"))
) -> dict[str, str]:
    return {"detail": "Product extras editor is planned for Phase 5", "product_id": product_id}


@router.post("/sync")
def sync_catalog(
    _: User = Depends(require_role("seller")),
    db: Session = Depends(get_db),
) -> SyncResult:
    try:
        return run_catalog_sync(db)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Catalog sync failed: {exc}",
        ) from exc
