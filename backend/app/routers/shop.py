from fastapi import APIRouter

router = APIRouter(prefix="/shop", tags=["shop"])


@router.get("/products")
def list_products() -> dict[str, list[dict]]:
    return {"products": []}


@router.get("/products/{product_id}")
def get_product(product_id: str) -> dict[str, str]:
    return {"product_id": product_id}


@router.get("/search")
def search_products(q: str = "") -> dict[str, str | list[dict]]:
    return {"q": q, "products": []}
