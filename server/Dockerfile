FROM node:14.15.1-buster-slim

WORKDIR /sources

COPY ./src ./src

COPY ./package*.json ./

COPY ./db ./db

RUN npm install

CMD [ "sh", "-c", "npm run migrate && npm start" ]
