FROM python:3.11-alpine

WORKDIR /usr/src/backend

ENV PYTHONDONTWRITEBYTECODE 1 .pyc
ENV PYTHONUNBUFFERED 1

RUN pip install --upgrade pip
COPY ./requirements.txt .

RUN pip install -r requirements.txt

COPY . .




