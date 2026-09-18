import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Health y persistencia (e2e)', () => {
  let app;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET) reporta el backend y MariaDB disponibles', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    expect(body).toEqual({
      status: 'ok',
      database: 'up',
      uptime: expect.any(Number),
    });
  });

  it('connects TypeORM to MariaDB and executes SQL', async () => {
    const dataSource = app.get(DataSource);
    expect(dataSource.isInitialized).toBe(true);
    expect(dataSource.options.type).toBe('mariadb');
    expect(await dataSource.query('SELECT 1 AS connected')).toEqual([
      { connected: 1 },
    ]);
  });

  it('persists UniEvents relations and enforces enrollment integrity', async () => {
    const runner = app.get(DataSource).createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    try {
      const manager = runner.manager;
      const estudiante = await manager.save('Estudiante', {
        nombre: 'Estudiante de prueba',
        email: 'estudiante@example.test',
      });
      const organizador = await manager.save('Organizador', {
        nombre: 'Organizador de prueba',
        email: 'organizador@example.test',
      });
      const categoria = await manager.save('Categoria', { nombre: 'Prueba' });
      const evento = await manager.save('Evento', {
        nombre: 'Evento de prueba',
        descripcion: 'Prueba de persistencia',
        fecha: new Date('2027-01-15T15:00:00Z'),
        cupoMaximo: 10,
        categoria,
        organizador,
      });
      const inscripcion = await manager.save('Inscripcion', {
        estudiante,
        evento,
      });
      expect(inscripcion.id).toEqual(expect.any(Number));
      expect(inscripcion.fechaInscripcion).toBeInstanceOf(Date);
      expect(inscripcion.asistio).toBe(false);

      const loaded = await manager.findOneOrFail('Inscripcion', {
        where: { id: inscripcion.id },
        relations: {
          estudiante: true,
          evento: { categoria: true, organizador: true },
        },
      });
      expect(loaded.estudiante.id).toBe(estudiante.id);
      expect(loaded.evento.categoria.id).toBe(categoria.id);
      expect(loaded.evento.organizador.id).toBe(organizador.id);

      for (const [entity, id, relation, childId] of [
        ['Categoria', categoria.id, 'eventos', evento.id],
        ['Organizador', organizador.id, 'eventos', evento.id],
        ['Estudiante', estudiante.id, 'inscripciones', inscripcion.id],
        ['Evento', evento.id, 'inscripciones', inscripcion.id],
      ]) {
        const parent = await manager.findOneOrFail(entity, {
          where: { id },
          relations: { [relation]: true },
        });
        expect(parent[relation].map((child) => child.id)).toContain(childId);
      }

      await expect(
        manager.insert('Inscripcion', { estudiante, evento }),
      ).rejects.toMatchObject({ driverError: { code: 'ER_DUP_ENTRY' } });
      await expect(
        manager.insert('Inscripcion', {
          estudiante: { id: -1 },
          evento,
        }),
      ).rejects.toMatchObject({
        driverError: { code: 'ER_NO_REFERENCED_ROW_2' },
      });
      await expect(
        manager.insert('Inscripcion', { estudiante: null, evento }),
      ).rejects.toMatchObject({ driverError: { code: 'ER_BAD_NULL_ERROR' } });
    } finally {
      await runner.rollbackTransaction();
      await runner.release();
    }
  });

  afterAll(async () => {
    await app.close();
  });
});
