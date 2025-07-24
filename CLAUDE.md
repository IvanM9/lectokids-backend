# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LectoKids is an educational platform that helps improve children's reading comprehension through readings adapted to their level and interests. This is a NestJS backend API that serves as the core of the platform.

## Development Commands

### Core Development
- `yarn dev` - Start development server with SWC compiler and watch mode (recommended)
- `yarn start:dev` - Start development server with standard TypeScript compiler and watch mode
- `yarn build` - Build the application for production
- `yarn build:swc` - Build with SWC compiler (faster)
- `yarn start:prod` - Start production server
- `yarn start:migrate:prod` - Run Prisma migrations and start production server

### Testing
- `yarn test` - Run unit tests
- `yarn test:watch` - Run tests in watch mode
- `yarn test:cov` - Run tests with coverage report
- `yarn test:e2e` - Run end-to-end tests
- `yarn test:debug` - Run tests in debug mode

### Code Quality
- `yarn lint` - Run ESLint with auto-fix
- `yarn format` - Format code with Prettier

### Database
- `npx prisma migrate dev` - Run database migrations in development
- `npx prisma migrate deploy` - Deploy migrations to production
- `npx prisma generate` - Generate Prisma client
- `npx prisma studio` - Open Prisma Studio for database management

## Architecture Overview

### Core Technologies
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens using Passport
- **Caching**: Multi-tier caching with Redis and in-memory cache
- **Queue Management**: BullMQ with Redis
- **AI Integration**: Multiple AI providers (OpenAI, Google Vertex AI, Google Generative AI)
- **File Processing**: Puppeteer for PDF generation, Firebase Admin or Minio for file storage
- **Email**: Nodemailer integration with multiple providers

### Module Structure

#### Security Module (`src/security/`)
- JWT-based authentication with refresh tokens
- Role-based access control (ADMIN, TEACHER, STUDENT)
- Guards for route protection and role validation
- Session management with device tracking

#### Core Educational Modules
- **Users Module**: User management with role-based access
- **Courses Module**: Course and level management
- **Readings Module**: Reading content management with AI-powered content generation
- **Activities Module**: Interactive activities (quizzes, crosswords, etc.)
- **AI Module**: Integration with multiple AI providers for content generation

#### Supporting Modules
- **Multimedia Module**: File upload and management
- **Notifications Module**: Email notifications with provider abstraction
- **Admin Module**: Administrative functions and configuration
- **Shared Module**: Common utilities, interceptors, and decorators

### Database Schema
- **Multi-tenant architecture** with courses, levels, and readings
- **User roles**: Students, Teachers, and Admins
- **Activity types**: YES_NO, QUIZ, OPEN_ANSWERS, OPEN_TEXT, CROSSWORD, ALPHABET_SOUP
- **Content management**: Text and image content with multimedia support
- **Performance tracking**: Scores and time spent analytics

### Key Configuration
- Environment variables are managed through `@nestjs/config`
- Redis configuration for caching and queue management
- Multi-provider AI configuration with fallback support
- Comprehensive logging with Winston
- API documentation with Swagger at `/api-docs`

### Development Patterns
- **Path aliases**: Use `@/` for src directory imports
- **Validation**: Global validation pipes with class-validator
- **Error handling**: Centralized error handling with proper HTTP status codes
- **Caching**: Multi-tier caching strategy with Redis and memory cache
- **Queue processing**: Background job processing with BullMQ
- **Database**: Prisma migrations with multi-environment support

### Key Files
- `src/main.ts` - Application bootstrap with Swagger, CORS, and middleware setup
- `src/app.module.ts` - Root module with global configuration
- `prisma/schema.prisma` - Database schema definition
- `src/libs/prisma.service.ts` - Database service
- `src/libs/LoggerFactory.ts` - Centralized logging configuration

### Testing Strategy
- Unit tests with Jest
- E2E tests with Supertest
- Test configuration in `jest` section of package.json
- Coverage reporting available with `yarn test:cov`

### Deployment Notes
- Docker support with provided Dockerfile
- Multi-platform Prisma client generation for various deployment targets
- Production migration script with `yarn start:migrate:prod`
- Environment-based configuration for different deployment stages
