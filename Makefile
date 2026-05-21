pytest:
	cd backend && DJANGO_SETTINGS_MODULE=backend.settings pytest --disable-warnings tests/

check:
	if ! docker ps -q -f name="redis" | grep ^; \
	then \
	   echo "Starting docker container..."; \
	   docker run --rm -d --quiet -p 6379:6379 --name redis redis:7; \
	fi

py-cov:
	cd backend && DJANGO_SETTINGS_MODULE=backend.settings pytest --cov-report term --cov=. --ignore=tests tests/

migrate:
	cd backend && python manage.py makemigrations
	cd backend && python manage.py migrate

create-super-user:
	cd backend && export DJANGO_SUPERUSER_PASSWORD=kds84md93 && ./manage.py createsuperuser --noinput --username admin --email test@test.com

load:
	cd backend && python seeding/run.py

frontend:
	cd frontend/elearning && npm run

docker-frontend:
	cd frontend && docker build -t frontend-image .
	docker run --rm -p 3000:3000 --name frontend frontend-image

run:
	cd backend && python manage.py runserver

requirements:
	cd backend && pip install -r requirements.txt

start-redis:
	docker run --rm -d -p 6379:6379 --name redis redis:7

stop-redis:
	docker container stop redis

test: migrate check pytest

coverage: migrate check py-cov

backend: migrate load create-super-user check run

locust-ui:
	cd backend && make locust-ui


