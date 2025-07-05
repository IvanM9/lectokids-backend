<!-- <p align="center">
<img src="/" width="200" alt="Nest Logo" />
</p> -->
## Descripción

LectoKids es una plataforma educativa que ayuda a mejorar la comprensión lectora de los niños a través de lecturas adaptadas a su nivel e intereses.

## Almacenamiento de Archivos

Esta aplicación soporta múltiples proveedores de almacenamiento para archivos multimedia:

- **Firebase Storage** (predeterminado): Almacenamiento basado en Google Cloud
- **MINIO**: Almacenamiento de objetos de código abierto compatible con S3

Para configuración detallada, consulta la [Documentación de Almacenamiento MINIO](./docs/MINIO_STORAGE.md).

### Configuración Rápida

1. **Para Firebase Storage:**
   ```bash
   cp .env.firebase.example .env
   # Edita .env con tus credenciales de Firebase
   ```

2. **Para MINIO Storage:**
   ```bash
   cp .env.minio.example .env
   # Edita .env con tu configuración de MINIO
   ```

## Instalación

```bash
$ yarn install
```

## Configuración

### Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables de entorno:

#### Configuración General
```env
DATABASE_URL=""
BUCKET_NAME=""
STORAGE_PROVIDER="firebase" # o "minio"
PUBLIC_DIR="./src/public"
```

#### Configuración Firebase (cuando STORAGE_PROVIDER=firebase)
```env
FIREBASE_CONFIG=''
```

#### Configuración MINIO (cuando STORAGE_PROVIDER=minio)
```env
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_PUBLIC_URL="http://localhost:9000"
```

#### Configuración AI
```env
OPENAI_API_KEY=""
GOOGLE_GENERATIVE_AI_API_KEY=""
MODEL_TEXT=""
TEXT_PROVIDER_AI=""
IMAGE_PROVIDER_AI=""
MODEL_IMAGE=""
```

#### Configuración Redis
```env
REDIS_HOST=""
REDIS_PASSWORD=""
REDIS_SSL=false
REDIS_USERNAME=""
```

#### Configuración Admin
```env
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
