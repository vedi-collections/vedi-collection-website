from __future__ import annotations

import mimetypes
import uuid
from functools import lru_cache

import boto3
import httpx

from app.core.config import settings


class StorageError(RuntimeError):
    pass


def _extension_for(filename: str | None, content_type: str) -> str:
    """Pick a file extension: trust the uploaded filename, else guess from MIME."""
    if filename and "." in filename:
        ext = filename[filename.rfind(".") :].lower()
        if 1 < len(ext) <= 6 and ext[1:].isalnum():
            return ext
    return mimetypes.guess_extension(content_type) or ""


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

    def upload_file(
        self,
        content: bytes,
        *,
        content_type: str,
        filename: str | None = None,
        prefix: str = "products",
    ) -> str:
        """Upload raw bytes (an admin-supplied image or video) and return its
        public URL. The key is randomised so re-uploads never collide."""
        if not self.bucket or not self.public_base_url:
            raise StorageError("STORAGE_BUCKET and STORAGE_PUBLIC_BASE_URL are required")

        extension = _extension_for(filename, content_type)
        key = f"{prefix.strip('/')}/{uuid.uuid4().hex}{extension}"
        self._client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=content,
            ContentType=content_type,
        )
        return f"{self.public_base_url}/{key}"

    def mirror_image(self, image_url: str, *, retailer_id: str) -> str:
        response = httpx.get(image_url, timeout=self.timeout_seconds)
        response.raise_for_status()

        content_type = response.headers.get(
            "content-type", "application/octet-stream"
        ).split(";")[0]
        return self.upload_file(
            response.content,
            content_type=content_type or "image/jpeg",
            prefix=f"products/{retailer_id}",
        )


@lru_cache
def get_storage_client() -> StorageClient:
    """FastAPI dependency: a process-wide StorageClient built from settings.

    Cached so boto3 isn't re-initialised per request; tests override it via
    `app.dependency_overrides[get_storage_client]`.
    """
    return StorageClient()
