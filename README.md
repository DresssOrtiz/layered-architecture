# UniEvents — Taller de Arquitectura de Software

Proyecto académico desarrollado para la materia **Arquitectura de Software**, cuyo objetivo es demostrar la aplicación del estilo **Arquitectura en Capas** utilizando un stack tecnológico compuesto por Svelte, NestJS, GraphQL y MariaDB.

El caso práctico definido es **UniEvents**, una plataforma para la gestión de eventos universitarios e inscripción de estudiantes.

Actualmente el proyecto cuenta con una base técnica funcional que integra frontend, backend y base de datos mediante Docker Compose. La infraestructura y comunicación entre componentes ya funcionan, mientras que la lógica de negocio específica de UniEvents se encuentra pendiente de implementación.

## Integrantes

- Andrés Ortiz
- Tomás Ramírez
- Santiago Hernández

## Caso práctico: UniEvents

UniEvents permitirá gestionar eventos universitarios y la inscripción de estudiantes.

El dominio definido contempla cinco entidades principales:

- Estudiante
- Categoría
- Evento
- Organizador
- Inscripción

Entre las reglas de negocio principales se encuentran:

- Cada evento pertenece a una categoría.
- Cada evento tiene un organizador.
- Un estudiante puede inscribirse a un evento.
- No se permiten inscripciones duplicadas del mismo estudiante al mismo evento.
- No se permiten nuevas inscripciones cuando el evento alcanza su cupo máximo.
- Una inscripción puede registrar si el estudiante asistió o no al evento.

Estas funcionalidades todavía están pendientes de implementación en el código.

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

El backend se organiza en tres capas en `backend/src/`, con las siguientes responsabilidades:

- **presentation (Presentación):** resolvers GraphQL, inputs/DTOs y puntos de entrada al backend. Actualmente contiene el resolver de la consulta `hello`, el controlador de prueba existente y su prueba unitaria.
- **business (Negocio):** servicios, reglas de negocio y lógica de aplicación. Actualmente contiene `AppService`, el servicio de prueba existente.
- **persistence (Persistencia):** entidades TypeORM, repositorios y acceso a MariaDB. Por ahora solo contiene `.gitkeep` para conservar la carpeta.

La configuración global de NestJS y la conexión actual a MariaDB mediante TypeORM permanecen en `app.module.js`; el arranque está en `main.js`. Todavía no existen las entidades ni los casos de uso del dominio definitivo de UniEvents.

## Estructura del repositorio

```text
layered-architecture/
├── frontend/           # Aplicación SvelteKit + TypeScript
├── backend/            # Aplicación NestJS organizada en capas
├── docker-compose.yml  # Frontend, backend y MariaDB
└── README.md
```
