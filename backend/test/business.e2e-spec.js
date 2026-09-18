import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { CategoriaService } from '../src/business/categoria.service';
import { EventoService } from '../src/business/evento.service';
import { InscripcionService } from '../src/business/inscripcion.service';

describe('Business con MariaDB (e2e)', () => {
  let context;
  let manager;
  let categorias;
  let eventos;
  let inscripciones;
  let categoria;
  let organizador;
  const estudiantes = [];
  const eventosCreados = [];

  beforeAll(async () => {
    context = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    manager = context.get(DataSource).manager;
    categorias = context.get(CategoriaService);
    eventos = context.get(EventoService);
    inscripciones = context.get(InscripcionService);
    categoria = await categorias.crear({ nombre: 'Prueba business' });
    organizador = await manager.save('Organizador', {
      nombre: 'Prueba business',
      email: 'business@example.test',
    });
    for (const nombre of ['Ana', 'Luis']) {
      estudiantes.push(
        await manager.save('Estudiante', {
          nombre,
          email: `${nombre}@example.test`,
        }),
      );
    }
  });

  async function crearEvento(cupoMaximo) {
    const evento = await eventos.crear({
      nombre: 'Prueba business',
      descripcion: 'Integración de servicios',
      fecha: new Date('2027-01-01T12:00:00Z'),
      cupoMaximo,
      categoriaId: categoria.id,
      organizadorId: organizador.id,
    });
    eventosCreados.push(evento);
    return evento;
  }

  it('crea, consulta, inscribe y cambia asistencia mediante servicios inyectados', async () => {
    const evento = await crearEvento(2);
    expect(
      (await categorias.consultar()).some((item) => item.id === categoria.id),
    ).toBe(true);
    expect(
      (await eventos.consultar()).some((item) => item.id === evento.id),
    ).toBe(true);
    expect(await eventos.consultarPorId(evento.id)).toMatchObject({
      categoria: { id: categoria.id },
      organizador: { id: organizador.id },
    });
    const inscripcion = await inscripciones.inscribir(
      estudiantes[0].id,
      evento.id,
    );
    await expect(
      inscripciones.inscribir(estudiantes[0].id, evento.id),
    ).rejects.toThrow('ya está inscrito');
    expect(await inscripciones.consultarInscritos(evento.id)).toEqual([
      estudiantes[0],
    ]);
    await inscripciones.marcarAsistencia(inscripcion.id, true);
    expect(
      await manager.findOneBy('Inscripcion', { id: inscripcion.id }),
    ).toMatchObject({ asistio: true });
    await inscripciones.marcarAsistencia(inscripcion.id, false);
    expect(
      await manager.findOneBy('Inscripcion', { id: inscripcion.id }),
    ).toMatchObject({ asistio: false });
  });

  it('no sobrepasa el último cupo ante dos solicitudes simultáneas', async () => {
    const evento = await crearEvento(1);
    const results = await Promise.allSettled(
      estudiantes.map((estudiante) =>
        inscripciones.inscribir(estudiante.id, evento.id),
      ),
    );
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.find((result) => result.status === 'rejected').reason.message,
    ).toBe('El evento alcanzó el cupo máximo');
    expect(
      await manager.countBy('Inscripcion', { evento: { id: evento.id } }),
    ).toBe(1);
  });

  it('rechaza solicitudes duplicadas simultáneas con un error de negocio', async () => {
    const evento = await crearEvento(2);
    const results = await Promise.allSettled([
      inscripciones.inscribir(estudiantes[0].id, evento.id),
      inscripciones.inscribir(estudiantes[0].id, evento.id),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.find((result) => result.status === 'rejected').reason.message,
    ).toBe('El estudiante ya está inscrito en el evento');
    expect(
      await manager.countBy('Inscripcion', { evento: { id: evento.id } }),
    ).toBe(1);
  });

  afterAll(async () => {
    try {
      for (const evento of eventosCreados) {
        await manager.delete('Inscripcion', { evento: { id: evento.id } });
        await manager.delete('Evento', { id: evento.id });
      }
      for (const estudiante of estudiantes)
        await manager.delete('Estudiante', { id: estudiante.id });
      if (organizador)
        await manager.delete('Organizador', { id: organizador.id });
      if (categoria) await manager.delete('Categoria', { id: categoria.id });
    } finally {
      await context?.close();
    }
  });
});
