# layered-architecture — Taller de Arquitectura de Software

Proyecto académico cuyo objetivo es demostrar una solución basada en **Arquitectura en Capas**. Actualmente cuenta con una base técnica funcional que integra frontend, backend y base de datos mediante Docker Compose. El dominio del caso práctico, sus tres entidades de negocio y el flujo funcional definitivo se incorporarán posteriormente.

## Integrantes

- Andrés Ortiz
- Tomás Ramírez
- Santiago Hernández

## Stack tecnológico

| Componente | Tecnología |
| --- | --- |
| Frontend | SvelteKit + TypeScript |
| Backend | NestJS |
| Interfaz de comunicación | GraphQL |
| Base de datos | MariaDB (SQL) |
| Persistencia | TypeORM |
| Contenedores | Docker / Docker Compose |

## Arquitectura

El backend tiene una estructura inicial de cuatro capas en `backend/src/`, con las siguientes responsabilidades:

- **presentation:** exposición de GraphQL mediante resolvers. Actualmente incluye la consulta de prueba `hello`.
- **application:** casos de uso y servicios de aplicación.
- **domain:** entidades y reglas de negocio.
- **infrastructure:** persistencia con TypeORM y MariaDB, e integraciones externas.

Las carpetas `application`, `domain` e `infrastructure` están preparadas, pero aún no contienen implementaciones. La conexión actual a MariaDB mediante TypeORM está configurada en `AppModule`; todavía no existen las entidades ni los casos de uso del dominio definitivo.

## Estructura del repositorio

```text
layered-architecture/
├── frontend/           # Aplicación SvelteKit + TypeScript
├── backend/            # Aplicación NestJS y estructura inicial en capas
├── docker-compose.yml  # Servicios de frontend, backend y MariaDB
└── README.md
```

## Requisitos previos

- Git.
- Docker Desktop o Docker Engine con Docker Compose, instalado y en ejecución.

## Ejecución con Docker Compose

Desde la raíz del repositorio:

```bash
docker compose up -d --build
```

Una vez iniciados los servicios, los accesos son:

| Servicio | Acceso |
| --- | --- |
| Frontend | [http://localhost:5173](http://localhost:5173) |
| GraphQL | [http://localhost:3000/graphql](http://localhost:3000/graphql) |
| MariaDB | `localhost:3306` (puerto SQL) |

Para detener los servicios, ejecutar desde la raíz:

```bash
docker compose down
```

## Estado actual

- La infraestructura base está operativa y el stack fue probado en conjunto con Docker Compose.
- Existe comunicación frontend-backend mediante GraphQL con la consulta de prueba `hello`.
- El backend tiene conexión a MariaDB mediante TypeORM.
- El dominio del caso práctico, las tres entidades de negocio y el flujo funcional definitivo de extremo a extremo están pendientes de implementación.
