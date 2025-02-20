import logging
import sys
import django
import os

logging.basicConfig(level=logging.INFO)

def prepare_env():
    sys.path.append("../uol_awd_final")
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "server.settings")
    django.setup()

prepare_env()

from seeding.fill_db import fill_database

if __name__ == "__main__":
    try:
        fill_database()
    except BaseException as e:
        logging.error(f"Unexpected error: {e}")
        exit(1)