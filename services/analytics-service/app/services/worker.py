import asyncio
import json
import logging
from app.redis_client import get_redis

logger = logging.getLogger(__name__)


class QueueWorker:
    def __init__(self):
        self.is_running = False
        self._task = None

    async def start(self):
        self.is_running = True
        self._task = asyncio.create_task(self._consume_loop())
        logger.info("🚀 Background BullMQ/Redis Queue Worker started.")

    async def stop(self):
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("🛑 Background Queue Worker stopped.")

    async def _consume_loop(self):
        """
        Continuously polls BullMQ / Redis queues for analytics & stock alert messages.
        """
        while self.is_running:
            try:
                redis_conn = get_redis()
                if not redis_conn:
                    await asyncio.sleep(2)
                    continue

                # 1. Check BullMQ analytics events
                # BullMQ adds job IDs to bull:analytics-events:wait (list) or bull:analytics-events:id (counter)
                job_id = redis_conn.rpop("bull:analytics-events:wait")
                if job_id:
                    job_data_raw = redis_conn.hget(f"bull:analytics-events:{job_id}", "data")
                    if job_data_raw:
                        payload = json.loads(job_data_raw)
                        logger.info(f"📊 [Worker] Processed Analytics Job #{job_id}: {payload.get('eventType')}")
                        # Update cached hourly velocity counter in Redis
                        redis_conn.incr("analytics:velocity:counter")

                # 2. Check BullMQ stock alerts
                stock_alert_job_id = redis_conn.rpop("bull:stock-alerts:wait")
                if stock_alert_job_id:
                    alert_raw = redis_conn.hget(f"bull:stock-alerts:{stock_alert_job_id}", "data")
                    if alert_raw:
                        payload = json.loads(alert_raw)
                        logger.warning(
                            f"🚨 [Worker Alert] Low Stock Detected for SKU: {payload.get('sku')} "
                            f"(Current: {payload.get('currentStock')}, Threshold: {payload.get('threshold')})"
                        )
                        # Push to recent alert list in Redis
                        redis_conn.lpush("analytics:recent_alerts", json.dumps(payload))
                        redis_conn.ltrim("analytics:recent_alerts", 0, 49)

                await asyncio.sleep(1)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Worker iteration encountered error: {e}")
                await asyncio.sleep(2)


worker = QueueWorker()

