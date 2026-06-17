import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import ProductStatus
from app.models.product import Product
from app.schemas.product import ProductPublic

router = APIRouter(tags=["shop"])

# Public storefront only ever sees launched, non-deleted products.
_PUBLIC = (Product.status == ProductStatus.live, Product.is_active.is_(True))


@router.get("/products")
def list_products(db: Session = Depends(get_db)) -> dict[str, list[ProductPublic]]:
    products = db.scalars(
        select(Product).where(*_PUBLIC).order_by(Product.created_at.desc())
    ).all()
    return {"products": [ProductPublic.model_validate(p) for p in products]}


@router.get("/products/{product_id}", response_model=ProductPublic)
def get_product(product_id: uuid.UUID, db: Session = Depends(get_db)) -> Product:
    product = db.scalar(select(Product).where(Product.id == product_id, *_PUBLIC))
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product
