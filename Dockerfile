FROM keymetrics/pm2:latest-jessie
WORKDIR /work
COPY package.json .
COPY .env.example .env
RUN npm install
COPY . .
CMD [ "pm2-runtime", "start", "src/index.js"]
