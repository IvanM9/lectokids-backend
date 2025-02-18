# Primera etapa: instalar las dependencias de desarrollo y construir la aplicación
FROM node:22-bookworm-slim AS builder
WORKDIR /usr/src/app
RUN apt update && apt upgrade -y
COPY ./package.json ./yarn.lock ./
COPY . .
RUN yarn install --frozen-lockfile
RUN yarn build:swc


# Segunda etapa: imagen final
FROM node:22-bookworm-slim
WORKDIR /usr/src/app
ENV NODE_ENV=production

RUN apt update && apt upgrade -y
RUN apt install -y chromium openssl
ENV PUPPETEER_EXECUTABLE_PATH='/usr/bin/chromium'

RUN mkdir logs
RUN chown node:node logs


COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/yarn.lock ./yarn.lock
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/views ./views

RUN yarn install --production --frozen-lockfile
RUN npx prisma generate
EXPOSE 4000
USER node
CMD ["yarn", "run", "start:migrate:prod"]