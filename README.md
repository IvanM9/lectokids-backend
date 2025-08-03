# 📚 LectoKids Backend

<p align="center">
  <img src="https://via.placeholder.com/200x200/4CAF50/FFFFFF?text=LK" width="200" alt="LectoKids Logo" />
</p>


<p align="center">
  <strong>Backend API para LectoKids - Plataforma educativa que mejora la comprensión lectora infantil</strong>
</p>

<p align="center">
  <a href="#-descripción">Descripción</a> •
  <a href="#-tecnologías">Tecnologías</a> •
  <a href="#-instalación">Instalación</a> •
  <a href="#-configuración">Configuración</a> •
  <a href="#-uso">Uso</a> •
  <a href="#-documentación">Documentación</a> •
  <a href="#-contribuir">Contribuir</a> •
  <a href="#-licencia">Licencia</a>
</p>

---

## 📖 Descripción

LectoKids es una plataforma educativa innovadora diseñada para mejorar la comprensión lectora de los niños a través de lecturas adaptadas a su nivel e intereses específicos. Este backend, desarrollado con NestJS, proporciona una API robusta y escalable que gestiona:

- 👥 **Gestión de usuarios** con roles diferenciados (Estudiantes, Profesores, Administradores)
- 📘 **Cursos y niveles** educativos personalizables
- 📝 **Lecturas adaptativas** generadas con IA
- 🎯 **Actividades interactivas** (quizzes, crucigramas, sopas de letras)
- 📊 **Análisis de rendimiento** y seguimiento del progreso
- 🤖 **Integración con múltiples proveedores de IA** para generación de contenido
- 📧 **Sistema de notificaciones** por email
- 🗄️ **Gestión multimedia** con soporte para múltiples proveedores de almacenamiento

## 🚀 Tecnologías

### Framework y Lenguaje
- **[NestJS](https://nestjs.com/)** - Framework de Node.js progresivo
- **[TypeScript](https://www.typescriptlang.org/)** - Lenguaje tipado sobre JavaScript

### Base de Datos
- **[PostgreSQL](https://www.postgresql.org/)** - Base de datos relacional
- **[Prisma ORM](https://www.prisma.io/)** - ORM moderno para TypeScript

### Autenticación y Seguridad
- **[JWT](https://jwt.io/)** - JSON Web Tokens para autenticación
- **[Passport](https://www.passportjs.org/)** - Middleware de autenticación
- **Refresh Tokens** - Gestión segura de sesiones

### Cache y Colas
- **[Redis](https://redis.io/)** - Cache en memoria y almacén de colas
- **[BullMQ](https://docs.bullmq.io/)** - Procesamiento de trabajos en segundo plano

### Inteligencia Artificial
- **[OpenAI API](https://openai.com/api/)** - Generación de texto e imágenes
- **[Google Generative AI](https://ai.google.dev/)** - Modelos de IA de Google
- **[Google Vertex AI](https://cloud.google.com/vertex-ai)** - Plataforma de ML de Google Cloud

### Almacenamiento y Multimedia
- **[Firebase Admin](https://firebase.google.com/docs/admin/setup)** - Servicio de almacenamiento
- **[MinIO](https://min.io/)** - Almacenamiento de objetos S3-compatible
- **[Puppeteer](https://pptr.dev/)** - Generación de PDFs

### Comunicaciones
- **[Nodemailer](https://nodemailer.com/)** - Envío de emails
- **[Resend](https://resend.com/)** - Servicio de email moderno

### Herramientas de Desarrollo
- **[SWC](https://swc.rs/)** - Compilador rápido para desarrollo
- **[Jest](https://jestjs.io/)** - Framework de testing
- **[ESLint](https://eslint.org/)** - Linter para código limpio
- **[Prettier](https://prettier.io/)** - Formateador de código
- **[Winston](https://github.com/winstonjs/winston)** - Sistema de logging
- **[Swagger](https://swagger.io/)** - Documentación automática de API

## 📦 Instalación

### Prerrequisitos

- **Node.js** (versión 18 o superior)
- **PostgreSQL** (versión 13 o superior)
- **Redis** (versión 6 o superior)
- **Yarn** (recomendado) o npm

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/IvanM9/lectokids-backend.git
   cd lectokids-backend
   ```

2. **Instalar dependencias**
   ```bash
   yarn install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

4. **Configurar base de datos**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Instalar Puppeteer (requerido para generación de PDFs)**

   Para el correcto funcionamiento de la aplicación es necesario instalar un navegador compatible con Puppeteer. Para más información, visita la [documentación oficial](https://pptr.dev/next/guides/system-requirements).

## ⚙️ Configuración

### Variables de entorno

Copia el archivo `.env.example` a `.env` y configura las siguientes variables según tu entorno:


```bash
cp .env.example .env
```

Las variables incluyen configuraciones para:
- 🗄️ Base de datos PostgreSQL
- 🔥 Firebase (almacenamiento y configuración)
- 🤖 APIs de IA (OpenAI, Google Generative AI, Vertex AI)
- 📧 Servicios de email (Nodemailer, Resend)
- 🚀 Redis para cache y colas
- 📁 Proveedores de almacenamiento (Firebase, MinIO)

### Configuración con Docker

Si prefieres usar Docker:

```bash
# Construir la imagen
docker build -t lectokids .

# Ejecutar el contenedor
docker run -p 4000:4000 lectokids
```

## 🚀 Uso

### Comandos de desarrollo

```bash
# Servidor de desarrollo (recomendado - con SWC)
yarn dev

# Servidor de desarrollo (estándar)
yarn start:dev

# Modo producción
yarn start:prod

# Producción con migraciones
yarn start:migrate:prod
```

### Comandos de testing

```bash
# Tests unitarios
yarn test

# Tests en modo watch
yarn test:watch

# Tests con cobertura
yarn test:cov

# Tests end-to-end
yarn test:e2e

# Tests en modo debug
yarn test:debug
```

### Comandos de calidad de código

```bash
# Linting con auto-fix
yarn lint

# Formateo de código
yarn format
```

### Comandos de base de datos

```bash
# Ejecutar migraciones en desarrollo
npx prisma migrate dev

# Aplicar migraciones en producción
npx prisma migrate deploy

# Generar cliente de Prisma
npx prisma generate

# Abrir Prisma Studio
npx prisma studio
```

## 📚 Documentación

### API Documentation
- **Swagger UI**: `http://localhost:4000/api-docs` (en desarrollo)
- Documentación interactiva con todos los endpoints disponibles

### Arquitectura del Proyecto

El proyecto sigue una arquitectura modular basada en NestJS:

```
src/
├── security/          # Autenticación y autorización
├── users/            # Gestión de usuarios
├── courses/          # Cursos y niveles
├── readings/         # Contenido de lecturas
├── activities/       # Actividades interactivas
├── ai/              # Integración con IA
├── multimedia/      # Gestión de archivos
├── notifications/   # Sistema de notificaciones
├── admin/           # Funciones administrativas
└── shared/          # Utilidades compartidas
```

### Para más detalles técnicos

Consulta nuestra [Wiki del proyecto](../../wiki) para obtener información detallada sobre:
- 🏗️ Arquitectura del sistema
- 🔄 Flujos de trabajo
- 📋 Especificaciones de API
- 🧪 Guías de testing
- 🚀 Guías de despliegue

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor lee nuestras [guías de contribución](CONTRIBUTING.md) para conocer:

- 🐞 Cómo reportar bugs
- ✨ Cómo proponer nuevas características
- 🔄 Proceso de Pull Requests
- 📝 Estándares de código y documentación

### Pasos básicos para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia GPL v3. Consulta el archivo [LICENSE](LICENSE) para más detalles.

```
Copyright (C) 2025 Iván Manzaba G.

Este programa es software libre: puedes redistribuirlo y/o modificarlo
bajo los términos de la Licencia Pública General GNU según se publica por
la Free Software Foundation, ya sea la versión 3 de la Licencia, o
(a tu elección) cualquier versión posterior.
```

## 📞 Contacto

- **Autor**: Iván Manzaba
- **Website**: [https://imanzabag.com/](https://imanzabag.com/)
- **Repositorio**: [https://github.com/IvanM9/lectokids-backend](https://github.com/IvanM9/lectokids-backend)

---

<p align="center">
  Hecho con ❤️ para mejorar la educación infantil
</p>
