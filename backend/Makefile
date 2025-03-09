pytest:
	DJANGO_SETTINGS_MODULE=backend.settings pytest --disable-warnings tests/

check:
	if ! docker ps -q -f name="redis" | grep ^; \
	then \
	   echo "Starting docker container..."; \
	   docker run --rm -d --quiet -p 6379:6379 --name redis redis:7; \
	fi

py-cov:
	DJANGO_SETTINGS_MODULE=backend.settings pytest --cov-report term --cov=. --ignore=tests tests/

migrate:
	python manage.py makemigrations
	python manage.py migrate

create-super-user:
	export DJANGO_SUPERUSER_PASSWORD=CA9eWjFR7nL3wm && ./manage.py createsuperuser --noinput --username admin --email test@test.com

load:
	python ./scripts/import_data.py

locust-ui:
	locust -f locustfile.py


run:
	python manage.py runserver --insecure

start-redis:
	docker run --rm -d -p 6379:6379 --name redis redis:7

stop-redis:
	docker container stop redis

test: migrate check pytest
coverage: migrate check py-cov
start: migrate load create-super-user check run