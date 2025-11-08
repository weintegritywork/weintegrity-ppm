from django.apps import AppConfig
import os


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        # Create Mongo indexes at startup (id/email uniqueness, chat uniqueness)
        from .mongo import get_db
        db = get_db()
        try:
            db['users'].create_index('id', unique=True)
            db['users'].create_index('email', unique=True)
            db['users'].create_index('employeeId', unique=True)
            for col in ['teams','projects','stories','epics','sprints','notifications']:
                db[col].create_index('id', unique=True)
            db['story_chats'].create_index('storyId', unique=True)
            db['project_chats'].create_index('projectId', unique=True)
        except Exception:
            # Ignore index errors in dev/tests; logs are handled by Mongo driver
            pass

from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
