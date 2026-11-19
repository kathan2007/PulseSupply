from fastapi import APIRouter, Query, status
from app.schemas.analytics import (
    KPISummaryResponse,
    SalesTrendResponse,
    InventoryTurnoverResponse,
    StockAlertsResponse,
    OrderVelocityResponse,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics & Reports"])


@router.get("/healthz", status_code=status.HTTP_200_OK)
def health_check():
    return {
        "status": "healthy",
        "service": "analytics-service",
    }


@router.get("/summary", response_model=KPISummaryResponse)
def get_kpi_summary():
    """
    Returns executive KPI summary (Total Revenue, Orders, Low Stock, Fulfillment Rate, AOV).
    """
    return AnalyticsService.get_kpis()


@router.get("/sales-trend", response_model=SalesTrendResponse)
def get_sales_trend(days: int = Query(7, ge=1, le=90)):
    """
    Returns historical daily revenue and order volume trends.
    """
    return AnalyticsService.get_sales_trends(days=days)


@router.get("/inventory-turnover", response_model=InventoryTurnoverResponse)
def get_inventory_turnover():
    """
    Returns inventory valuation breakdown by product category.
    """
    return AnalyticsService.get_inventory_turnover()


@router.get("/stock-alerts", response_model=StockAlertsResponse)
def get_stock_alerts():
    """
    Returns all real-time inventory items with low or critical stock levels.
    """
    return AnalyticsService.get_stock_alerts()


@router.get("/velocity", response_model=OrderVelocityResponse)
def get_order_velocity():
    """
    Returns order velocity metrics (hourly and 24h intake rates).
    """
    return AnalyticsService.get_order_velocity()

