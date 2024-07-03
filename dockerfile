# Primera etapa: instalar las dependencias de desarrollo y construir la aplicación
FROM node:20-alpine as builder
WORKDIR /usr/src/app
RUN apk update && apk upgrade
RUN apk add --no-cache openssl
COPY ./package.json ./yarn.lock ./
COPY . .
RUN yarn install --frozen-lockfile
RUN npx prisma generate
RUN yarn build:swc

# Segunda etapa: imagen final
FROM node:20-alpine
WORKDIR /usr/src/app
RUN apk update && apk upgrade
RUN apk add --no-cache \
    udev \
    ttf-freefont \
    chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/views ./views
EXPOSE 4000
CMD ["node", "dist/main"]