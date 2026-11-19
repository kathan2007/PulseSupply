import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_healthz():
    response = client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "analytics-service"


def test_analytics_healthz():
    response = client.get("/api/v1/analytics/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_kpi_summary():
    response = client.get("/api/v1/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_revenue" in data
    assert "total_orders" in data
    assert "active_products" in data
    assert "low_stock_count" in data
    assert "average_order_value" in data
    assert "fulfillment_rate" in data
    assert isinstance(data["total_revenue"], (int, float))


def test_sales_trends():
    response = client.get("/api/v1/analytics/sales-trend?days=7")
    assert response.status_code == 200
    data = response.json()
    assert "timeframe" in data
    assert "trends" in data
    assert isinstance(data["trends"], list)
    if len(data["trends"]) > 0:
        first = data["trends"][0]
        assert "date" in first
        assert "revenue" in first
        assert "order_count" in first


def test_inventory_turnover():
    response = client.get("/api/v1/analytics/inventory-turnover")
    assert response.status_code == 200
    data = response.json()
    assert "categories" in data
    assert "overall_inventory_valuation" in data
    assert isinstance(data["categories"], list)


def test_stock_alerts():
    response = client.get("/api/v1/analytics/stock-alerts")
    assert response.status_code == 200
    data = response.json()
    assert "alerts_count" in data
    assert "alerts" in data
    assert isinstance(data["alerts"], list)


def test_order_velocity():
    response = client.get("/api/v1/analytics/velocity")
    assert response.status_code == 200
    data = response.json()
    assert "orders_last_hour" in data
    assert "orders_last_24h" in data
    assert "average_velocity_per_hour" in data

