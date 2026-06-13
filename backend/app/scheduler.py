from __future__ import annotations

import logging

from apscheduler.schedulers.background import BackgroundScheduler

from app.core.config import settings
from app.core.database import SessionLocal
from app.services.sync import sync_catalog

logger = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None


def start_scheduler() -> BackgroundScheduler | None:
    global _scheduler

    if not settings.CATALOG_SYNC_SCHEDULER_ENABLED:
        logger.info("Catalog sync scheduler is disabled")
        return None

    if _scheduler is not None and _scheduler.running:
        return _scheduler

    scheduler = BackgroundScheduler(timezone="UTC")
    scheduler.add_job(
        _run_sync_job,
        "interval",
        minutes=settings.CATALOG_SYNC_INTERVAL_MINUTES,
        id="catalog_sync",
        replace_existing=True,
        max_instances=1,
    )
    scheduler.start()
    _scheduler = scheduler
    logger.info(
        "Catalog sync scheduler started; interval=%s minutes",
        settings.CATALOG_SYNC_INTERVAL_MINUTES,
    )
    return scheduler


def stop_scheduler() -> None:
    global _scheduler

    if _scheduler is not None and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Catalog sync scheduler stopped")
    _scheduler = None


def _run_sync_job() -> None:
    with SessionLocal() as db:
        try:
            result = sync_catalog(db)
        except Exception:
            logger.exception("Scheduled Meta catalog sync failed")
        else:
            logger.info(
                "Scheduled Meta catalog sync completed: upserted=%s deactivated=%s",
                result.products_upserted,
                result.products_deactivated,
            )
