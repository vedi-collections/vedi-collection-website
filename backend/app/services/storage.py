from __future__ import annotations

import mimetypes
import uuid

import boto3
import httpx

from app.core.config import settings


class StorageError(RuntimeError):
    pass


class StorageClient:
    """Downloads Meta CDN images and uploads them to S3-compatible storage."""

    def __init__(
        self,
        *,
        endpoint_url: str = settings.STORAGE_ENDPOINT,
        region_name: str = settings.STORAGE_REGION,
        bucket: str = settings.STORAGE_BUCKET,
        access_key: str = settings.STORAGE_ACCESS_KEY,
        secret_key: str = settings.STORAGE_SECRET_KEY,
        public_base_url: str = settings.STORAGE_PUBLIC_BASE_URL,
        timeout_seconds: float = 20.0,
    ) -> None:
        self.bucket = bucket
        self.public_base_url = public_base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds
        self._client = boto3.client(
            "s3",
            endpoint_url=endpoint_url or None,
            region_name=region_name or None,
            aws_access_key_id=access_key or None,
            aws_secret_access_key=secret_key or None,
        )

    def mirror_image(self, image_url: str, *, retailer_id: str) -> str:
        if not self.bucket or not self.public_base_url:
            raise StorageError("STORAGE_BUCKET and STORAGE_PUBLIC_BASE_URL are required")

        response = httpx.get(image_url, timeout=self.timeout_seconds)
        response.raise_for_status()

        content_type = response.headers.get(
            "content-type", "application/octet-stream"
        ).split(";")[0]
        extension = mimetypes.guess_extension(content_type) or ".jpg"
        key = f"products/{retailer_id}/{uuid.uuid4().hex}{extension}"

        self._client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=response.content,
            ContentType=content_type,
        )
        return f"{self.public_base_url}/{key}"
