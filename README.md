<!-- <p align="center">
<img src="/" width="200" alt="Nest Logo" />
</p> -->
## Descripción

LectoKids es una plataforma educativa que ayuda a mejorar la comprensión lectora de los niños a través de lecturas adaptadas a su nivel e intereses.

## Instalación

```bash
$ yarn install
```

## Configuración

### Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables de entorno:

```bash
PORT=""
DATABSE_URL=""
BUCCKET_NAME=""
FIREBASE_CONFIG=""
OPENAI_API_KEY=""
JWT_SECRET_KEY=""
PUBLIC_DIR=""
VIEWS_DIR=""
ADMIN_USER=""
ADMIN_PASSWORD=""
```

### Puppeteer

Para el correcto funcionamiento de la aplicación es necesario instalar `puppeteer` en el sistema operativo. Además, es necesario tener instalado un navegador compatible con `puppeteer`. Para más información, visita la [documentación oficial](https://pptr.dev/next/guides/system-requirements)


## Docker

```bash
# build the image
$ docker build -t lectokids .

# run the container
$ docker run -p 4000:4000 lectokids
```

## Ejecución de la aplicación

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Contacto

- Author - Iván Manzaba
- Website - [https://ivan-manzaba.vercel.app/](https://ivan-manzaba.vercel.app/)
