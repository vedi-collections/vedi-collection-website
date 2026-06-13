from __future__ import annotations

import httpx

from app.services.meta_catalog import MetaCatalogClient


def test_meta_catalog_client_follows_pagination() -> None:
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if len(requests) == 1:
            return httpx.Response(
                200,
                json={
                    "data": [{"retailer_id": "ONE"}],
                    "paging": {"next": "https://graph.test/page-2"},
                },
            )
        return httpx.Response(200, json={"data": [{"retailer_id": "TWO"}]})

    client = MetaCatalogClient(
        access_token="token",
        catalog_id="catalog",
        base_url="https://graph.test",
        transport=httpx.MockTransport(handler),
    )

    products = client.fetch_products()

    assert products == [{"retailer_id": "ONE"}, {"retailer_id": "TWO"}]
    assert str(requests[0].url).startswith("https://graph.test/v21.0/catalog/products")
    assert str(requests[1].url) == "https://graph.test/page-2"
