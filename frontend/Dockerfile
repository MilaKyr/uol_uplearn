FROM node:20-alpine

WORKDIR /usr/src/frontend

COPY . .

WORKDIR /usr/src/frontend/elearning

RUN npm install

RUN npm run build

EXPOSE 3000

CMD [ "npm", "start" ]