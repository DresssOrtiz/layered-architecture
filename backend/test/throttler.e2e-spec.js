import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';

// El límite se lee al inicializar ThrottlerModule (forRootAsync), por eso basta
// con fijar la variable antes de compilar el contexto de pruebas.
const LIMITE = 2;

describe('Rate limiting de inscribirEstudiante (e2e)', () => {
  let app;
  let manager;
  let limiteOriginal;
  let categoria;
  let organizador;
  let evento;
  const estudiantes = [];

  beforeAll(async () => {
    limiteOriginal = process.env.RATE_LIMIT_INSCRIPCION;
    process.env.RATE_LIMIT_INSCRIPCION = String(LIMITE);
    const context = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = context.createNestApplication();
    await app.init();
    manager = app.get(DataSource).manager;

    categoria = await manager.save('Categoria', {
      nombre: 'Categoría fixture throttler',
    });
    organizador = await manager.save('Organizador', {
      nombre: 'Organizador fixture throttler',
      email: 'throttler@example.test',
    });
    for (let i = 0; i < LIMITE + 1; i += 1) {
      estudiantes.push(
        await manager.save('Estudiante', {
          nombre: `Estudiante throttler ${i}`,
          email: `throttler${i}@example.test`,
        }),
      );
    }
    evento = await manager.save('Evento', {
      nombre: 'Evento fixture throttler',
      descripcion: 'Fixture para rate limiting',
      fecha: new Date('2027-03-01T15:00:00Z'),
      cupoMaximo: 50,
      categoria,
      organizador,
    });
  });

  function inscribir(estudianteId) {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `mutation ($input: InscribirEstudianteInput!) {
          inscribirEstudiante(input: $input) { id }
        }`,
        variables: { input: { estudianteId, eventoId: evento.id } },
      });
  }

  it('corta las inscripciones que superan el límite por ventana', async () => {
    for (let i = 0; i < LIMITE; i += 1) {
      const { body } = await inscribir(estudiantes[i].id);
      expect(body.errors).toBeUndefined();
      expect(body.data.inscribirEstudiante.id).toEqual(expect.any(Number));
    }

    const { body } = await inscribir(estudiantes[LIMITE].id);
    expect(body.errors[0].message).toBe(
      'Demasiadas inscripciones seguidas. Intenta de nuevo en un minuto.',
    );
    expect(
      await manager.countBy('Inscripcion', { evento: { id: evento.id } }),
    ).toBe(LIMITE);
  });

  it('no limita las consultas ni las demás mutaciones', async () => {
    for (let i = 0; i < LIMITE + 3; i += 1) {
      const { body } = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ categorias { id } }' });
      expect(body.errors).toBeUndefined();
    }
  });

  afterAll(async () => {
    try {
      if (evento) {
        await manager.delete('Inscripcion', { evento: { id: evento.id } });
        await manager.delete('Evento', { id: evento.id });
      }
      for (const estudiante of estudiantes)
        await manager.delete('Estudiante', { id: estudiante.id });
      if (organizador)
        await manager.delete('Organizador', { id: organizador.id });
      if (categoria) await manager.delete('Categoria', { id: categoria.id });
    } finally {
      await app?.close();
      process.env.RATE_LIMIT_INSCRIPCION = limiteOriginal;
    }
  });
});
