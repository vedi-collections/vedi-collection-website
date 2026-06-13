from __future__ import annotations

import logging
import time
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

META_PRODUCT_FIELDS = (
    "id",
    "retailer_id",
    "name",
    "description",
    "price",
    "currency",
    "availability",
    "image_url",
)


class MetaCatalogError(RuntimeError):
    pass


class MetaCatalogClient:
    """Small Meta Graph API client for reading catalog products."""

    def __init__(
        self,
        *,
        access_token: str = settings.META_ACCESS_TOKEN,
        catalog_id: str = settings.META_CATALOG_ID,
        api_version: str = settings.META_GRAPH_API_VERSION,
        base_url: str = settings.META_GRAPH_API_BASE_URL,
        timeout_seconds: float = 20.0,
        max_retries: int = 3,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self.access_token = access_token
        self.catalog_id = catalog_id
        self.api_version = api_version.strip("/")
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds
        self.max_retries = max_retries
        self.transport = transport

    def fetch_products(self) -> list[dict[str, Any]]:
        if not self.access_token or not self.catalog_id:
            raise MetaCatalogError("META_ACCESS_TOKEN and META_CATALOG_ID are required")

        products: list[dict[str, Any]] = []
        url: str | None = (
            f"{self.base_url}/{self.api_version}/{self.catalog_id}/products"
        )
        params: dict[str, Any] | None = {
            "access_token": self.access_token,
            "fields": ",".join(META_PRODUCT_FIELDS),
            "limit": 100,
        }

        with httpx.Client(timeout=self.timeout_seconds, transport=self.transport) as client:
            while url is not None:
                payload = self._get_json(client, url, params=params)
                page_products = payload.get("data")
                if not isinstance(page_products, list):
                    raise MetaCatalogError("Meta products response did not include a data list")
                products.extend(page_products)

                next_url = payload.get("paging", {}).get("next")
                url = str(next_url) if next_url else None
                params = None

        logger.info("Fetched %s products from Meta catalog %s", len(products), self.catalog_id)
        return products

    def _get_json(
        self, client: httpx.Client, url: str, *, params: dict[str, Any] | None
    ) -> dict[str, Any]:
        for attempt in range(self.max_retries + 1):
            try:
                response = client.get(url, params=params)
                if response.status_code in {429, 500, 502, 503, 504}:
                    raise httpx.HTTPStatusError(
                        "Retryable Meta Graph API response",
                        request=response.request,
                        response=response,
                    )
                response.raise_for_status()
                payload = response.json()
            except (httpx.HTTPError, ValueError) as exc:
                if attempt >= self.max_retries:
                    raise MetaCatalogError(f"Meta catalog request failed: {exc}") from exc
                delay = min(2**attempt, 8)
                logger.warning("Meta catalog request failed; retrying in %ss: %s", delay, exc)
                time.sleep(delay)
                continue

            if not isinstance(payload, dict):
                raise MetaCatalogError("Meta products response was not a JSON object")
            return payload

        raise MetaCatalogError("Meta catalog request failed after retries")
