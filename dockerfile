# Primera etapa: instalar las dependencias de desarrollo y construir la aplicación
FROM node:22-bookworm-slim AS builder
WORKDIR /usr/src/app
# RUN dnf update -y
# RUN dnf install -y openssl nodejs20.x86_64 npm
# RUN npm install -g yarn
RUN apt update && apt upgrade -y
RUN apt install -y openssl
COPY ./package.json ./yarn.lock ./
COPY . .
RUN yarn install --frozen-lockfile
RUN npx prisma generate
RUN yarn build:swc

# Segunda etapa: imagen final
FROM node:22-bookworm-slim
WORKDIR /usr/src/app
# RUN dnf update -y
# RUN dnf install -y openssl nodejs20.x86_64 npm
# RUN apt-get update && apt-get install -y \
#     wget \
#     gnupg \
#     ca-certificates \
#     procps \
#     libxss1 \
#     && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
#     && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
#     && apt-get update \
#     && apt-get install -y google-chrome-stable \
#     && rm -rf /var/lib/apt/lists/*

RUN apt update && apt install -y chromium

RUN apt install -y openssl
# RUN npm install -g puppeteer
# RUN dnf install -y chromium chromium-headless
ENV PUPPETEER_EXECUTABLE_PATH='/usr/bin/chromium'
# ENV PUPPETEER_EXECUTABLE_PATH='/usr/bin/google-chrome-stable'
# RUN apt-get install -y fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/views ./views
COPY --from=builder /usr/src/app/client ./client
EXPOSE 4000
CMD ["node", "dist/main"]