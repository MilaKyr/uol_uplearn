FROM node:20-alpine

WORKDIR /usr/src/frontend

COPY . .

WORKDIR /usr/src/frontend/elearning

RUN npm install -g npm@11.2.0

RUN npm install --force

RUN npm run build

EXPOSE 3000

CMD [ "npm", "start" ]