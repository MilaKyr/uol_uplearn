#!bin/sh

python manage.py makemigrations
python manage.py migrate
python manage.py collectstatic --noinput
python seeding/run.py
python manage.py createsuperuser --noinput  --username admin --email test@test.com

exec "$@"