FROM python:3.11-alpine

WORKDIR /usr/src/backend

ENV PYTHONDONTWRITEBYTECODE 1 .pyc
ENV PYTHONUNBUFFERED 1

RUN apk update && apk add netcat-openbsd

RUN pip install --upgrade pip
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY entrypoint.sh .
RUN sed -i 's/\r$//g' /usr/src/backend/entrypoint.sh
RUN chmod +x /usr/src/backend/entrypoint.sh

COPY . .

ENTRYPOINT ["sh", "/usr/src/backend/entrypoint.sh"]




