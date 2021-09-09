FROM keymetrics/pm2:latest-jessie
WORKDIR /work
COPY package.json .
COPY .env.test .env
RUN npm install
COPY . .
CMD [ "pm2-runtime", "start", "src/index.js"]
