# Primera etapa: instalar las dependencias de desarrollo y construir la aplicación
FROM node:20-bookworm-slim as builder
WORKDIR /usr/src/app
RUN apt update && apt upgrade -y
COPY ./package.json ./yarn.lock ./
COPY . .
RUN yarn install --frozen-lockfile
RUN npx prisma generate
RUN yarn build:swc

# Segunda etapa: imagen final
FROM node:20-bookworm-slim
WORKDIR /usr/src/app
RUN apt update && apt upgrade -y
RUN apt install -y openssl
# RUN npx @puppeteer/browsers install chrome@stable
RUN npx puppeteer browsers install chrome
RUN apt-get install -y fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/views ./views
COPY --from=builder /usr/src/app/client ./client
EXPOSE 4000
CMD ["node", "dist/main"]