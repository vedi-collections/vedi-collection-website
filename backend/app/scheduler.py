from __future__ import annotations

import logging

from apscheduler.schedulers.background import BackgroundScheduler

from app.core.config import settings

logger = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None


def start_scheduler() -> BackgroundScheduler | None:
    """Start the in-process scheduler.

    No jobs are registered yet — Phase 5 adds the scheduled→live launch job here.
    """
    global _scheduler

    if not settings.SCHEDULER_ENABLED:
        logger.info("Scheduler is disabled")
        return None

    if _scheduler is not None and _scheduler.running:
        return _scheduler

    scheduler = BackgroundScheduler(timezone="UTC")
    scheduler.start()
    _scheduler = scheduler
    logger.info("Scheduler started")
    return scheduler


def stop_scheduler() -> None:
    global _scheduler

    if _scheduler is not None and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
    _scheduler = None
