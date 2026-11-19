from typing import List, Optional
from pydantic import BaseModel, Field


class KPISummaryResponse(BaseModel):
    total_revenue: float = Field(..., description="Cumulative gross revenue from confirmed orders")
    total_orders: int = Field(..., description="Total count of customer orders")
    active_products: int = Field(..., description="Total active catalog products")
    low_stock_count: int = Field(..., description="Number of products at or below threshold")
    average_order_value: float = Field(..., description="Average revenue generated per order")
    fulfillment_rate: float = Field(..., description="Percentage of delivered vs total orders")


class SalesTrendPoint(BaseModel):
    date: str
    revenue: float
    order_count: int


class SalesTrendResponse(BaseModel):
    timeframe: str
    trends: List[SalesTrendPoint]


class InventoryCategoryMetric(BaseModel):
    category: str
    product_count: int
    total_stock: int
    valuation: float


class InventoryTurnoverResponse(BaseModel):
    categories: List[InventoryCategoryMetric]
    overall_inventory_valuation: float


class StockAlertItem(BaseModel):
    product_id: str
    sku: str
    name: str
    current_stock: int
    threshold: int
    status: str
    timestamp: Optional[str] = None


class StockAlertsResponse(BaseModel):
    alerts_count: int
    alerts: List[StockAlertItem]


class OrderVelocityResponse(BaseModel):
    orders_last_hour: int
    orders_last_24h: int
    average_velocity_per_hour: float
    peak_hour: Optional[str] = None

