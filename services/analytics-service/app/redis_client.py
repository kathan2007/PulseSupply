import logging
import redis
from app.config import settings

logger = logging.getLogger(__name__)

try:
    redis_conn = redis.from_url(
        settings.redis_url,
        decode_responses=True,
        socket_timeout=5,
        socket_connect_timeout=5,
    )
except Exception as e:
    logger.warning(f"Could not connect to Redis: {e}")
    redis_conn = None


def get_redis():
    return redis_conn

