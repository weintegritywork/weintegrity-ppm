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
    # Use mock if explicitly set to true
    use_mock = os.getenv('USE_MONGOMOCK', 'false').lower() == 'true'
    logger = logging.getLogger(__name__)
    
    # Debug logging
    print(f"[DEBUG] MONGO_URI from env: {uri}")
    print(f"[DEBUG] USE_MONGOMOCK from env: {use_mock}")
    
    try:
        # Add SSL/TLS parameters to fix handshake issues on Render
        client = MongoClient(
            uri, 
            serverSelectionTimeoutMS=5000,
            tls=True,
            tlsAllowInvalidCertificates=True
        )
        # trigger a selection attempt
        client.admin.command('ping')
        logger.info("Connected to MongoDB at %s (real instance)", uri)
        print(f"[SUCCESS] Connected to MongoDB Atlas!")
        _CLIENT = client
        return _CLIENT
    except Exception as exc:
        print(f"[ERROR] MongoDB connection failed: {exc}")
        logger.error("MongoDB connection to %s failed: %s", uri, exc)
        if not use_mock:
            print("[ERROR] USE_MONGOMOCK is false, raising exception")
            raise
        try:
            import mongomock
            logger.warning(
                "MongoDB connection to %s failed (%s); falling back to mongomock in-memory store",
                uri,
                exc,
            )
            print("[WARNING] Falling back to mongomock (in-memory database)")
            _CLIENT = mongomock.MongoClient()
            return _CLIENT
        except Exception as mock_exc:
            raise RuntimeError(
                "MongoDB unavailable and mongomock fallback could not be initialised. "
                "Install mongomock or provide a reachable MongoDB URI."
            ) from mock_exc


def get_db():
    client = get_client()
    db_name = os.getenv('MONGO_DBNAME', 'weintegrity')
    print(f"[DEBUG] Using database: {db_name}")
    return client[db_name]


