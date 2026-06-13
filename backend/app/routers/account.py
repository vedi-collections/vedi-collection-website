from fastapi import APIRouter, Depends, status

from app.core.deps import require_role
from app.models.user import User

router = APIRouter(prefix="/account", tags=["account"])


@router.get("/orders")
def order_history(_: User = Depends(require_role("customer"))) -> dict[str, list[dict]]:
    return {"orders": []}


@router.post("/orders", status_code=status.HTTP_202_ACCEPTED)
def create_whatsapp_order(_: User = Depends(require_role("customer"))) -> dict[str, str]:
    return {"detail": "WhatsApp checkout is planned for Phase 3"}
