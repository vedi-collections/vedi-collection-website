from __future__ import annotations

import httpx

from app.services import storage as storage_module
from app.services.storage import StorageClient


class FakeS3Client:
    def __init__(self) -> None:
        self.objects: list[dict] = []

    def put_object(self, **kwargs: object) -> None:
        self.objects.append(kwargs)


def test_storage_client_downloads_and_uploads_image(monkeypatch) -> None:
    fake_s3 = FakeS3Client()

    def fake_boto_client(*args: object, **kwargs: object) -> FakeS3Client:
        return fake_s3

    def fake_get(url: str, *, timeout: float) -> httpx.Response:
        assert url == "https://meta.test/image.jpg"
        assert timeout == 20.0
        return httpx.Response(
            200,
            content=b"image-bytes",
            headers={"content-type": "image/jpeg"},
            request=httpx.Request("GET", url),
        )

    monkeypatch.setattr(storage_module.boto3, "client", fake_boto_client)
    monkeypatch.setattr(storage_module.httpx, "get", fake_get)

    client = StorageClient(
        bucket="vedi-products",
        public_base_url="https://cdn.vedi.test",
        access_key="key",
        secret_key="secret",
    )

    url = client.mirror_image("https://meta.test/image.jpg", retailer_id="ABC-1")

    assert url.startswith("https://cdn.vedi.test/products/ABC-1/")
    assert url.endswith(".jpg")
    assert fake_s3.objects[0]["Bucket"] == "vedi-products"
    assert fake_s3.objects[0]["Body"] == b"image-bytes"
    assert fake_s3.objects[0]["ContentType"] == "image/jpeg"
