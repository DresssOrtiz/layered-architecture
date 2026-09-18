# UniEvents — Arquitectura en Capas

Tarea 2 de **Arquitectura de Software** (grupo G4): selección, modelado e implementación de un estilo y un stack arquitectónico asignados por el docente.

- **Estilo:** Arquitectura en Capas (Layered Architecture)
- **Stack:** SvelteKit + TypeScript · NestJS (JavaScript, sin TypeScript) · GraphQL · MariaDB
- **Caso práctico:** UniEvents

## Qué es UniEvents

UniEvents es una plataforma de gestión de eventos universitarios e inscripción de estudiantes. Permite publicar eventos dentro de una categoría, asignarles un organizador y un cupo máximo, inscribir estudiantes y registrar su asistencia.

### Dominio

Cinco entidades relacionadas:

| Entidad | Descripción | Relaciones |
| --- | --- | --- |
| `Estudiante` | Persona que se inscribe a eventos | 1—N `Inscripcion` |
| `Organizador` | Responsable de uno o varios eventos | 1—N `Evento` |
| `Categoria` | Clasificación temática del evento | 1—N `Evento` |
| `Evento` | Encuentro con fecha y cupo máximo | N—1 `Categoria`, N—1 `Organizador`, 1—N `Inscripcion` |
| `Inscripcion` | Registro de un estudiante en un evento | N—1 `Estudiante`, N—1 `Evento` |

### Reglas de negocio implementadas

1. Cada evento pertenece a una categoría y tiene un organizador; ambos deben existir (FK `RESTRICT` + verificación en el servicio).
2. Un estudiante puede inscribirse a un evento.
3. **No se permiten inscripciones duplicadas** del mismo estudiante al mismo evento (constraint `UQ_inscripcion_estudiante_evento` + verificación transaccional).
4. **No se permiten inscripciones cuando el evento alcanza su cupo máximo** (conteo dentro de una transacción con bloqueo pesimista sobre el evento).
5. Una inscripción puede registrar si el estudiante asistió o no.

## Arquitectura

El backend implementa el estilo en capas con **dependencia unidireccional**: presentación → negocio → persistencia. Ninguna capa conoce a la que está por encima, y presentación nunca toca repositorios directamente.

| Capa | Carpeta | Responsabilidad | Archivos |
| --- | --- | --- | --- |
| Presentación | `backend/src/presentation/` | Resolvers GraphQL, tipos e inputs del esquema, validación de entrada, rate limiting, endpoint `/health` | `unievents.resolver.js`, `unievents.types.js`, `unievents.inputs.js`, `gql-throttler.guard.js`, `health.controller.js` |
| Negocio | `backend/src/business/` | Reglas de negocio, transacciones, orquestación | `categoria.service.js`, `evento.service.js`, `inscripcion.service.js`, `persona.service.js`, `health.service.js` |
| Persistencia | `backend/src/persistence/` | Entidades TypeORM (`EntitySchema`), constraints, datos demo | `*.entity.js`, `persistence.module.js`, `demo.seed.js` |

El frontend es una capa de presentación independiente: el navegador nunca habla directo con el backend, sino con el endpoint `POST /api/graphql` del propio servidor SvelteKit, que reenvía a `GRAPHQL_URL`. Solo ese servidor conoce la URL interna de Docker.

```
Navegador ──▶ SvelteKit (/api/graphql) ──▶ NestJS (/graphql) ──▶ TypeORM ──▶ MariaDB
```

> **Nota sobre NestJS en JavaScript.** El stack asignado excluye TypeScript en el backend, así que no hay metadata de tipos en tiempo de compilación. Por eso el código usa `@Dependencies()` en vez de tipos de constructor, aplica `Field()` y los validadores de forma programática sobre el `prototype`, y registra `design:paramtypes` a mano en `unievents.resolver.js`. Babel compila los decoradores legacy; el Nest CLI no se usa.

## Stack

| Componente | Tecnología |
| --- | --- |
| Frontend | SvelteKit 2 + Svelte 5 (runes) + TypeScript, `adapter-node` |
| Backend | NestJS 12 en JavaScript, compilado con Babel |
| Integración | GraphQL (Apollo Server 5 vía `@nestjs/apollo`) |
| Persistencia | MariaDB 11 + TypeORM |
| Contenedores | Docker / Docker Compose |
| Pruebas | Jest + Supertest (backend), Playwright (frontend) |

## Estructura del repositorio

```text
layered-architecture/
├── backend/               # NestJS en tres capas
│   ├── src/
│   │   ├── presentation/  # resolvers, tipos, inputs, guard, health
│   │   ├── business/      # servicios y reglas de negocio
│   │   ├── persistence/   # entidades TypeORM y seed demo
│   │   ├── app.module.js  # composición: GraphQL, Throttler, TypeORM, ValidationPipe
│   │   └── main.js
│   └── test/              # suites e2e contra MariaDB real
├── frontend/              # SvelteKit + TypeScript
│   ├── src/lib/           # cliente GraphQL y componentes
│   ├── src/routes/        # página principal y proxy /api/graphql
│   └── tests/             # Playwright
├── docker-compose.yml     # mariadb + backend + frontend
├── .env.example
└── README.md
```

## Cómo ejecutarlo con Docker

Requisito: Docker con Compose v2.

```bash
cp .env.example .env     # opcional: sin .env se usan los mismos valores por defecto
docker compose up --build
```

| Servicio | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| GraphQL (GraphiQL) | http://localhost:3000/graphql |
| Health | http://localhost:3000/health |
| MariaDB | `localhost:3306` |

El arranque está encadenado por healthchecks: el backend no inicia hasta que MariaDB responde (`healthcheck.sh --connect --innodb_initialized`), y el frontend no inicia hasta que `GET /health` del backend devuelve 200. El esquema se crea solo (`synchronize: true`) y `DemoSeed` inserta de forma idempotente dos estudiantes y un organizador de demostración.

Para apagar y borrar el volumen de datos:

```bash
docker compose down -v
```

## Cómo ejecutarlo sin Docker

Se necesita Node 24+ y una instancia de MariaDB accesible.

```bash
# MariaDB suelta, si no tienes una
docker compose up -d mariadb

# Backend en http://localhost:3000
cd backend && npm ci && npm run start:dev

# Frontend en http://localhost:5173
cd frontend && npm ci && npm run dev
```

El backend toma sus valores por defecto de `.env.example` (`localhost:3306`, `layered_user` / `layered_password`, base `layered_db`), así que no hace falta exportar nada si usas el MariaDB del compose.

## Variables de entorno

| Variable | Defecto | Para qué sirve |
| --- | --- | --- |
| `DB_HOST` | `localhost` (`mariadb` en Docker) | Host de MariaDB |
| `DB_PORT` | `3306` | Puerto de MariaDB |
| `DB_USER` / `DB_PASSWORD` | `layered_user` / `layered_password` | Credenciales de la aplicación |
| `DB_NAME` | `layered_db` | Base de datos |
| `DB_ROOT_PASSWORD` | `root` | Solo para inicializar el contenedor de MariaDB |
| `PORT` | `3000` | Puerto del backend |
| `CORS_ORIGIN` | `http://localhost:5173` | Origen permitido si se consume `/graphql` directamente |
| `RATE_LIMIT_INSCRIPCION` | `5` | Inscripciones permitidas por ventana y por IP |
| `RATE_LIMIT_TTL` | `60000` | Tamaño de la ventana en milisegundos |
| `GRAPHQL_URL` | `http://localhost:3000/graphql` | URL que usa el servidor SvelteKit para alcanzar el backend |
| `BACKEND_PORT` / `FRONTEND_PORT` | `3000` / `5173` | Puertos publicados en el host por Compose |

`.env` está en `.gitignore`; `.env.example` sí se versiona.

## API GraphQL

### Queries

| Query | Argumentos | Devuelve |
| --- | --- | --- |
| `categorias` | — | `[Categoria]` |
| `eventos` | — | `[Evento]` con categoría y organizador |
| `evento` | `id: Int!` | `Evento` |
| `estudiantes` | — | `[Estudiante]` |
| `organizadores` | — | `[Organizador]` |
| `inscritos` | `eventoId: Int!` | `[Estudiante]` inscritos al evento |
| `inscripciones` | `eventoId: Int!` | `[InscripcionDetalle]` con estudiante y asistencia |

### Mutations

| Mutation | Input | Devuelve |
| --- | --- | --- |
| `crearCategoria` | `CrearCategoriaInput { nombre }` | `Categoria` |
| `crearEvento` | `CrearEventoInput { nombre, descripcion, fecha, cupoMaximo, categoriaId, organizadorId }` | `Evento` |
| `inscribirEstudiante` | `InscribirEstudianteInput { estudianteId, eventoId }` | `Inscripcion` |
| `marcarAsistencia` | `MarcarAsistenciaInput { inscripcionId, asistio }` | `Inscripcion` |

Ejemplo:

```graphql
mutation {
  inscribirEstudiante(input: { estudianteId: 1, eventoId: 1 }) {
    id
    fechaInscripcion
    asistio
  }
}
```

### Endpoint REST

`GET /health` → `200` con `{ "status": "ok", "database": "up", "uptime": 42 }`, o `503` con `database: "down"` si MariaDB no responde.

## Flujo funcional disponible

En http://localhost:5173, con los datos demo ya cargados:

1. **Crear categoría** — pestaña *Categorías* → nombre → se agrega al catálogo.
2. **Crear evento** — pestaña *Crear evento* → nombre, descripción, fecha, cupo, categoría y organizador → redirige al detalle del evento.
3. **Inscribir estudiante** — en el detalle del evento, elegir un estudiante e inscribirlo.
4. **Marcar asistencia** — alternar la asistencia de cada inscrito.

Errores que el flujo muestra en pantalla:

| Situación | Mensaje |
| --- | --- |
| Inscripción repetida | «El estudiante ya está inscrito en el evento.» |
| Evento sin cupo | «El evento alcanzó su cupo máximo.» |
| Demasiadas inscripciones seguidas | «Demasiadas inscripciones seguidas. Intenta de nuevo en un minuto.» |
| Backend caído | «No fue posible conectar con UniEvents. Intenta de nuevo.» |

## Tácticas arquitectónicas implementadas

| Táctica | Dónde | Atributo de calidad |
| --- | --- | --- |
| Endpoint `/health` con ping a MariaDB | `health.service.js` + `health.controller.js` | Disponibilidad |
| Healthcheck + `restart: unless-stopped` + arranque encadenado | `docker-compose.yml` | Disponibilidad |
| Rate limiting sobre `inscribirEstudiante` | `gql-throttler.guard.js` + `ThrottlerModule` | Seguridad / Rendimiento |
| Validación explícita de inputs GraphQL | `unievents.inputs.js` + `ValidationPipe` | Seguridad / Integridad |
| Transacción `READ COMMITTED` con bloqueo pesimista sobre el evento | `inscripcion.service.js` | Integridad bajo concurrencia |
| Constraint `UNIQUE (estudianteId, eventoId)` | `inscripcion.entity.js` | Integridad |
| Repository + inyección de dependencias | servicios de `business/` | Modificabilidad / Testabilidad |

La validación vive en dos niveles a propósito: la capa de presentación rechaza la **forma** del input (tipos, rangos, cadenas vacías) y la de negocio rechaza lo que solo se sabe consultando el estado (existencia de FK, cupo, duplicados).

## Pruebas

```bash
# Backend — unitarias, con repositorios simulados, sin base de datos
cd backend && npm test

# Backend — e2e contra MariaDB real (requiere `docker compose up -d mariadb`)
cd backend && DB_HOST=127.0.0.1 npm run test:e2e

# Frontend — Playwright (requiere el stack arriba)
cd frontend && npm run test:e2e

# Estático
cd backend && npm run lint
cd frontend && npm run lint && npm run check
```

Las suites e2e del backend cubren: salud y conexión SQL, integridad relacional y constraints (`app.e2e-spec.js`), servicios de negocio incluida la carrera por el último cupo (`business.e2e-spec.js`), el esquema GraphQL completo con errores de negocio y de validación (`graphql.e2e-spec.js`) y el rate limiting (`throttler.e2e-spec.js`).

## Integrantes

- Andrés Ortiz Forero
- Tomás Ramírez Roa
- Santiago Hernández
