FROM keymetrics/pm2:latest-jessie
WORKDIR /work
COPY package.json .
COPY .env.example .env
RUN cat .env
RUN npm install
COPY . .
CMD [ "npm", "start", "src/index.js"]
