import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DemoSeed } from '../src/persistence/demo.seed';

describe('UniEvents GraphQL (e2e)', () => {
  // Id con forma válida que nunca existe: separa el error de negocio del de validación.
  const INEXISTENTE = 2147483647;
  let app;
  let manager;
  let categoria;
  let organizador;
  let evento;
  let estudiantes;
  let categoriasCreadas;
  let eventosCreados;

  beforeAll(async () => {
    const context = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = context.createNestApplication();
    await app.init();
    manager = app.get(DataSource).manager;
  });

  beforeEach(async () => {
    categoriasCreadas = [];
    eventosCreados = [];
    estudiantes = [];
    organizador = null;
    categoria = await manager.save('Categoria', {
      nombre: 'Categoría fixture GraphQL',
    });
    categoriasCreadas.push(categoria.id);
    organizador = await manager.save('Organizador', {
      nombre: 'Organizador fixture',
      email: 'organizador@example.test',
    });
    for (const nombre of ['Ana fixture', 'Luis fixture']) {
      estudiantes.push(
        await manager.save('Estudiante', {
          nombre,
          email: 'estudiante@example.test',
        }),
      );
    }
    evento = await manager.save('Evento', {
      nombre: 'Evento fixture GraphQL',
      descripcion: 'Fixture temporal de prueba',
      fecha: new Date('2027-01-15T15:00:00Z'),
      cupoMaximo: 1,
      categoria,
      organizador,
    });
    eventosCreados.push(evento.id);
  });

  async function graphql(query, variables = {}) {
    // La misma suite puede validar HTTP real contra el backend Docker local.
    const target = process.env.GRAPHQL_TEST_URL || app.getHttpServer();
    const response = await request(target)
      .post('/graphql')
      .send({ query, variables });
    expect(response.status).toBe(200);
    return response.body;
  }

  function sinErrores(body) {
    expect(body.errors).toBeUndefined();
    if (process.env.GRAPHQL_TEST_URL) console.log(JSON.stringify(body));
    return body.data;
  }

  async function inscribir(estudianteId = estudiantes[0].id) {
    return graphql(
      `
        mutation ($input: InscribirEstudianteInput!) {
          inscribirEstudiante(input: $input) {
            id
            fechaInscripcion
            asistio
          }
        }
      `,
      { input: { estudianteId, eventoId: evento.id } },
    );
  }

  it('lista categorías', async () => {
    const data = sinErrores(await graphql('{ categorias { id nombre } }'));
    expect(data.categorias).toContainEqual({
      id: categoria.id,
      nombre: categoria.nombre,
    });
  });

  it('expone personas e inscripciones con asistencia para el frontend', async () => {
    const personas = sinErrores(
      await graphql(
        '{ estudiantes { id nombre email } organizadores { id nombre email } }',
      ),
    );
    expect(personas.estudiantes).toContainEqual(estudiantes[0]);
    expect(personas.organizadores).toContainEqual(organizador);
    const { inscribirEstudiante: registro } = sinErrores(await inscribir());
    const data = sinErrores(
      await graphql(
        'query($id: Int!) { inscripciones(eventoId: $id) { id asistio estudiante { id nombre email } } }',
        { id: evento.id },
      ),
    );
    expect(data.inscripciones).toEqual([
      { id: registro.id, asistio: false, estudiante: estudiantes[0] },
    ]);
  });

  it('inicializa los datos demo de forma idempotente', async () => {
    await app.get(DemoSeed).onApplicationBootstrap();
    await app.get(DemoSeed).onApplicationBootstrap();
    expect(
      await manager.countBy('Estudiante', { email: 'ana.demo@unievents.test' }),
    ).toBe(1);
    expect(
      await manager.countBy('Estudiante', {
        email: 'luis.demo@unievents.test',
      }),
    ).toBe(1);
    expect(
      await manager.countBy('Organizador', {
        email: 'organizador.demo@unievents.test',
      }),
    ).toBe(1);
  });

  it('crea una categoría', async () => {
    const body = await graphql(
      `
        mutation ($input: CrearCategoriaInput!) {
          crearCategoria(input: $input) {
            id
            nombre
          }
        }
      `,
      { input: { nombre: 'Categoría creada por GraphQL' } },
    );
    if (body.data?.crearCategoria)
      categoriasCreadas.push(body.data.crearCategoria.id);
    expect(sinErrores(body).crearCategoria).toEqual({
      id: expect.any(Number),
      nombre: 'Categoría creada por GraphQL',
    });
  });

  it('lista eventos con categoría y organizador', async () => {
    const data = sinErrores(
      await graphql(
        '{ eventos { id nombre descripcion fecha cupoMaximo categoria { id nombre } organizador { id nombre email } } }',
      ),
    );
    expect(data.eventos).toContainEqual(
      expect.objectContaining({
        id: evento.id,
        cupoMaximo: 1,
        categoria: { id: categoria.id, nombre: categoria.nombre },
        organizador: {
          id: organizador.id,
          nombre: organizador.nombre,
          email: organizador.email,
        },
      }),
    );
  });

  it('consulta el detalle de un evento', async () => {
    const data = sinErrores(
      await graphql(
        `
          query ($id: Int!) {
            evento(id: $id) {
              id
              nombre
              descripcion
              fecha
              cupoMaximo
              categoria {
                id
                nombre
              }
              organizador {
                id
                nombre
                email
              }
            }
          }
        `,
        { id: evento.id },
      ),
    );
    expect(data.evento).toMatchObject({
      id: evento.id,
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      fecha: '2027-01-15T15:00:00.000Z',
      cupoMaximo: 1,
      categoria: { id: categoria.id },
      organizador: { id: organizador.id },
    });
  });

  it('crea un evento', async () => {
    const body = await graphql(
      `
        mutation ($input: CrearEventoInput!) {
          crearEvento(input: $input) {
            id
            nombre
            descripcion
            fecha
            cupoMaximo
            categoria {
              id
              nombre
            }
            organizador {
              id
              nombre
              email
            }
          }
        }
      `,
      {
        input: {
          nombre: 'Evento creado por GraphQL',
          descripcion: 'Prueba de entrada',
          fecha: '2027-02-01T10:00:00Z',
          cupoMaximo: 3,
          categoriaId: categoria.id,
          organizadorId: organizador.id,
        },
      },
    );
    if (body.data?.crearEvento) eventosCreados.push(body.data.crearEvento.id);
    expect(sinErrores(body).crearEvento).toMatchObject({
      id: expect.any(Number),
      nombre: 'Evento creado por GraphQL',
      cupoMaximo: 3,
      fecha: '2027-02-01T10:00:00.000Z',
      categoria: { id: categoria.id },
      organizador: { id: organizador.id },
    });
  });

  it('inscribe un estudiante', async () => {
    const data = sinErrores(await inscribir());
    expect(data.inscribirEstudiante).toEqual({
      id: expect.any(Number),
      fechaInscripcion: expect.any(String),
      asistio: false,
    });
    expect(
      Number.isNaN(Date.parse(data.inscribirEstudiante.fechaInscripcion)),
    ).toBe(false);
  });

  it('propaga el error de inscripción duplicada', async () => {
    sinErrores(await inscribir());
    const body = await inscribir();
    expect(body.errors[0].message).toBe(
      'El estudiante ya está inscrito en el evento',
    );
    expect(
      await manager.countBy('Inscripcion', { evento: { id: evento.id } }),
    ).toBe(1);
    if (process.env.GRAPHQL_TEST_URL)
      console.log(
        JSON.stringify({
          errors: body.errors.map(({ message }) => ({ message })),
        }),
      );
  });

  it('propaga el error de evento lleno', async () => {
    sinErrores(await inscribir());
    const body = await inscribir(estudiantes[1].id);
    expect(body.errors[0].message).toBe('El evento alcanzó el cupo máximo');
    expect(
      await manager.countBy('Inscripcion', { evento: { id: evento.id } }),
    ).toBe(1);
  });

  it('consulta inscritos', async () => {
    sinErrores(await inscribir());
    const data = sinErrores(
      await graphql(
        `
          query ($eventoId: Int!) {
            inscritos(eventoId: $eventoId) {
              id
              nombre
              email
            }
          }
        `,
        { eventoId: evento.id },
      ),
    );
    expect(data.inscritos).toEqual([estudiantes[0]]);
  });

  it.each([true, false])('marca asistencia %s', async (asistio) => {
    const { inscribirEstudiante: inscripcion } = sinErrores(await inscribir());
    // Para false partimos de true y verificamos que no se pierde el valor falsy.
    await manager.update(
      'Inscripcion',
      { id: inscripcion.id },
      { asistio: !asistio },
    );
    const data = sinErrores(
      await graphql(
        `
          mutation ($input: MarcarAsistenciaInput!) {
            marcarAsistencia(input: $input) {
              id
              fechaInscripcion
              asistio
            }
          }
        `,
        { input: { inscripcionId: inscripcion.id, asistio } },
      ),
    );
    expect(data.marcarAsistencia).toMatchObject({
      id: inscripcion.id,
      asistio,
    });
    expect(
      await manager.findOneBy('Inscripcion', { id: inscripcion.id }),
    ).toMatchObject({ asistio });
  });

  it('propaga el error de estudiante inexistente', async () => {
    const body = await inscribir(INEXISTENTE);
    expect(body.errors[0].message).toBe('El estudiante no existe');
  });

  it('propaga el error de evento inexistente', async () => {
    const body = await graphql('query($id: Int!) { evento(id: $id) { id } }', {
      id: -1,
    });
    expect(body.errors[0].message).toBe('El evento no existe');
  });

  it('propaga el error de inscripción inexistente', async () => {
    const body = await graphql(
      `
        mutation ($input: MarcarAsistenciaInput!) {
          marcarAsistencia(input: $input) {
            id
          }
        }
      `,
      { input: { inscripcionId: INEXISTENTE, asistio: false } },
    );
    expect(body.errors[0].message).toBe('La inscripción no existe');
  });

  describe('validación de inputs en la capa de presentación', () => {
    async function rechaza(query, variables, campo) {
      const body = await graphql(query, variables);
      expect(body.data?.[Object.keys(body.data ?? {})[0]] ?? null).toBeNull();
      expect(JSON.stringify(body.errors)).toContain(campo);
    }

    it('rechaza una categoría sin nombre', () =>
      rechaza(
        `mutation ($input: CrearCategoriaInput!) {
          crearCategoria(input: $input) { id }
        }`,
        { input: { nombre: '   ' } },
        'nombre',
      ));

    it('rechaza un evento con cupo no positivo', () =>
      rechaza(
        `mutation ($input: CrearEventoInput!) {
          crearEvento(input: $input) { id }
        }`,
        {
          input: {
            nombre: 'Evento inválido',
            descripcion: 'Cupo fuera de rango',
            fecha: '2027-02-01T10:00:00Z',
            cupoMaximo: 0,
            categoriaId: categoria.id,
            organizadorId: organizador.id,
          },
        },
        'cupoMaximo',
      ));

    it('rechaza una inscripción con identificadores no positivos', () =>
      rechaza(
        `mutation ($input: InscribirEstudianteInput!) {
          inscribirEstudiante(input: $input) { id }
        }`,
        { input: { estudianteId: 0, eventoId: 0 } },
        'eventoId',
      ));

    it('rechaza marcar asistencia sobre un identificador no positivo', () =>
      rechaza(
        `mutation ($input: MarcarAsistenciaInput!) {
          marcarAsistencia(input: $input) { id }
        }`,
        { input: { inscripcionId: 0, asistio: true } },
        'inscripcionId',
      ));
  });

  afterEach(async () => {
    for (const id of eventosCreados) {
      await manager.delete('Inscripcion', { evento: { id } });
      await manager.delete('Evento', { id });
    }
    for (const estudiante of estudiantes)
      await manager.delete('Estudiante', { id: estudiante.id });
    if (organizador)
      await manager.delete('Organizador', { id: organizador.id });
    for (const id of categoriasCreadas)
      await manager.delete('Categoria', { id });
  });

  afterAll(async () => {
    await app?.close();
  });
});
