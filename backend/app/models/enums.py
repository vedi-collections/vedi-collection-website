import enum


class UserRole(enum.StrEnum):
    customer = "customer"
    seller = "seller"


class OrderStatus(enum.StrEnum):
    new = "new"
    confirmed = "confirmed"
    shipped = "shipped"
    cancelled = "cancelled"
