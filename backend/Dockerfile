FROM node:slim

RUN mkdir /usr/src/app
ADD . /usr/src/app

WORKDIR /usr/src/app

RUN npm install

EXPOSE 3001
CMD [ "npm", "start" ]