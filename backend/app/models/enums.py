import enum


class UserRole(enum.StrEnum):
    customer = "customer"
    admin = "admin"


class OrderStatus(enum.StrEnum):
    new = "new"
    confirmed = "confirmed"
    shipped = "shipped"
    cancelled = "cancelled"


class ProductStatus(enum.StrEnum):
    """Launch lifecycle. Public storefront shows `live` only; `scheduled` is
    flipped to `live` by the APScheduler job in Phase 5. `inactive` is distinct
    from the soft-delete flag `is_active` (a row can be live-but-soft-deleted)."""

    draft = "draft"
    scheduled = "scheduled"
    live = "live"
    inactive = "inactive"


class ProductAudience(enum.StrEnum):
    """Fixed top-level category: every product is Women or Men. The storefront's
    "All" tab is just a view that shows both. Sub-categories (free text) sit
    under this and are seller-managed."""

    women = "women"
    men = "men"


class ChangeAction(enum.StrEnum):
    """The kind of admin mutation recorded in the change_log audit trail."""

    create = "create"
    update = "update"
    delete = "delete"
