from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError
import logging
import os

_CLIENT = None


def get_client() -> MongoClient:
    global _CLIENT
    if _CLIENT is not None:
        return _CLIENT
    uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
    use_mock = os.getenv('USE_MONGOMOCK', 'true').lower() == 'true'
    logger = logging.getLogger(__name__)
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=2000)
        # trigger a selection attempt
        client.admin.command('ping')
        logger.info("Connected to MongoDB at %s (real instance)", uri)
        _CLIENT = client
        return _CLIENT
    except Exception as exc:
        if not use_mock:
            raise
        try:
            import mongomock
            logger.warning(
                "MongoDB connection to %s failed (%s); falling back to mongomock in-memory store",
                uri,
                exc,
            )
            _CLIENT = mongomock.MongoClient()
            return _CLIENT
        except Exception as mock_exc:
            raise RuntimeError(
                "MongoDB unavailable and mongomock fallback could not be initialised. "
                "Install mongomock or provide a reachable MongoDB URI."
            ) from mock_exc


def get_db():
    client = get_client()
    db_name = os.getenv('MONGO_DBNAME', 'weintegration_db')
    return client[db_name]


