#!bin/sh

python manage.py makemigrations
python manage.py migrate
python seeding/run.py

exec "$@"