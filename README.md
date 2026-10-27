# Filo Barbería

Sistema de reservas online para una barbería de barrio. Proyecto para ISY1102 Seguridad y calidad en el desarrollo de software.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS 4, React Router |
| Backend | Node.js, Express 5, TypeScript, Zod |
| Base de datos | SQLite con TypeORM (ORM, equivalente a JPA/Hibernate) |
| Seguridad | JWT, bcrypt, Helmet, rate limiting en login |
| Pruebas | Vitest, Supertest, Testing Library |

## Requisitos

- Node.js 20 o superior
- pnpm 10

## Cómo levantarlo

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3000/api

La base de datos se crea sola con datos de ejemplo (3 barberos, 5 servicios y algunas reservas). Para dejarla en cero: `pnpm db:reset`.

### Panel de administración

http://localhost:5173/admin con las credenciales del `.env` (por defecto `admin@filobarberia.cl` / `FiloAdmin2026!`).

### Reservas de ejemplo

En **Mi reserva** puedes consultar `DEMO01` con el RUT `16.543.210-K`.

## Modo producción

Necesario para Lighthouse y JMeter: los resultados de `pnpm dev` no son representativos.

```bash
pnpm build
pnpm start
```

Todo queda en http://localhost:3000. En producción `JWT_SECRET` es obligatorio.

## Pruebas

```bash
pnpm test             # API y web
pnpm test:coverage    # genera coverage/lcov.info en cada app (lo usa SonarQube)
```

## SonarQube

El archivo `sonar-project.properties` ya está configurado. Con SonarQube corriendo en Docker:

```bash
docker run -d --name sonarqube -p 9000:9000 sonarqube:community
pnpm test:coverage
npx sonar-scanner -Dsonar.host.url=http://localhost:9000 -Dsonar.token=TU_TOKEN
```

## Arquitectura de la API

Organizada en capas como un proyecto Spring Boot:

```
src/
├── models/        Entidades TypeORM (@Entity), como las entidades JPA
├── repositories/  Acceso a datos con el ORM, sin SQL escrito a mano
├── services/      Lógica de negocio (@Service)
├── controllers/   Manejo de requests HTTP (@RestController)
├── routes/        Mapeo de URLs a controladores (@RequestMapping)
├── dto/           Validación de entrada con Zod (@Valid) y formato de respuesta
├── rules/         Reglas de negocio puras de la reserva
├── middleware/    Autenticación JWT y manejo global de errores (@ControllerAdvice)
├── exceptions/    Excepciones de negocio
├── security/      JWT, bcrypt y generador de códigos
├── config/        Variables de entorno, DataSource y contexto de la app (inyección de dependencias)
├── database/      Datos iniciales y reinicio
└── utils/         RUT, teléfono, horarios y bloqueo de concurrencia
```

El esquema de la base se genera desde las entidades (`synchronize: true`), con columnas en snake_case, claves foráneas, índices y restricciones.

Las reservas se crean dentro de una sección crítica (`Mutex`). Así, si varios clientes piden la misma hora al mismo tiempo, solo uno la obtiene; los demás reciben 409.

## Reglas de negocio

| Regla | Valor |
|---|---|
| Horario | Lunes a viernes 10:00–20:00, sábado 10:00–18:00, domingo cerrado |
| Bloques | Cada 30 minutos; el servicio ocupa su duración completa |
| Ventana de reserva | Desde la hora actual hasta 30 días hacia adelante |
| Cancelación | En cualquier momento, con código y RUT |
| Reservas activas por cliente (RUT) | Máximo 2 |
| Doble agendamiento | Bloqueado por barbero, considerando duración |
| Datos personales | Requiere consentimiento explícito, se registra la fecha |

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/services` | Servicios activos |
| GET | `/api/barbers` | Barberos activos |
| GET | `/api/availability?barberId&serviceId&date` | Horas libres |
| POST | `/api/appointments` | Crear reserva |
| GET | `/api/appointments/:code?rut=` | Consultar reserva |
| POST | `/api/appointments/:code/cancel` | Cancelar reserva |
| POST | `/api/auth/login` | Login de administrador |
| GET | `/api/admin/agenda?date=` | Agenda del día (requiere token) |
