pytest:
	DJANGO_SETTINGS_MODULE=backend.settings pytest --disable-warnings tests/

py-cov:
	DJANGO_SETTINGS_MODULE=backend.settings pytest --cov-report --cov=. --ignore=tests tests/

migrate:
	python manage.py makemigrations
	python manage.py migrate

create-super-user:
	export DJANGO_SUPERUSER_PASSWORD=CA9eWjFR7nL3wm && ./manage.py createsuperuser --noinput --username admin --email test@test.com

load:
	python ./scripts/import_data.py

run:
	python manage.py runserver --insecure

start-redis:
	docker run --rm -d -p 6379:6379 --name redis redis:7

stop-redis:
	docker container stop redis

test: migrate pytest
coverage: migrate start-redis py-cov
start: migrate load create-super-user start-redis run