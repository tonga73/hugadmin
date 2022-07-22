FROM node:16

WORKDIR /usr/src/app

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY . .

ENV REACT_APP_REST=/api

RUN npm run build

RUN npm i -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "tcp://0.0.0.0:3000"]
# CMD ["npm", "start"]