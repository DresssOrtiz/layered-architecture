import { jest } from '@jest/globals';
import { InscripcionService } from './inscripcion.service';
import { Estudiante } from '../persistence/estudiante.entity';
import { Evento } from '../persistence/evento.entity';
import { Inscripcion } from '../persistence/inscripcion.entity';

describe('InscripcionService', () => {
  let service;
  let inscripciones;
  let eventos;
  let estudiantes;
  let dataSource;

  beforeEach(() => {
    inscripciones = {
      findOneBy: jest.fn().mockResolvedValue(null),
      countBy: jest.fn().mockResolvedValue(0),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: 1, ...value })),
      find: jest.fn().mockResolvedValue([]),
    };
    eventos = {
      findOne: jest.fn().mockResolvedValue({ id: 2, cupoMaximo: 1 }),
      findOneBy: jest.fn().mockResolvedValue({ id: 2 }),
    };
    estudiantes = { findOneBy: jest.fn().mockResolvedValue({ id: 3 }) };
    const repositories = new Map([
      [Inscripcion, inscripciones],
      [Evento, eventos],
      [Estudiante, estudiantes],
    ]);
    dataSource = {
      transaction: jest.fn(async (_isolation, callback) =>
        callback({
          getRepository: (entity) => repositories.get(entity),
        }),
      ),
    };
    service = new InscripcionService(inscripciones, eventos, dataSource);
  });

  it('inscribe un estudiante cuando hay cupo', async () => {
    await expect(service.inscribir(3, 2)).resolves.toMatchObject({
      id: 1,
      estudiante: { id: 3 },
      evento: { id: 2 },
    });
    expect(inscripciones.countBy).toHaveBeenCalledWith({ evento: { id: 2 } });
    expect(eventos.findOne).toHaveBeenCalledWith({
      where: { id: 2 },
      lock: { mode: 'pessimistic_write' },
    });
  });

  it('rechaza duplicados antes de intentar guardar', async () => {
    inscripciones.findOneBy.mockResolvedValue({ id: 7 });
    await expect(service.inscribir(3, 2)).rejects.toThrow('ya está inscrito');
    expect(inscripciones.save).not.toHaveBeenCalled();
    expect(inscripciones.countBy).not.toHaveBeenCalled();
  });

  it.each([1, 2])(
    'rechaza un evento lleno con %i inscripciones',
    async (cantidad) => {
      inscripciones.countBy.mockResolvedValue(cantidad);
      await expect(service.inscribir(3, 2)).rejects.toThrow('cupo máximo');
      expect(inscripciones.save).not.toHaveBeenCalled();
    },
  );

  it('rechaza un estudiante inexistente', async () => {
    estudiantes.findOneBy.mockResolvedValue(null);
    await expect(service.inscribir(3, 2)).rejects.toThrow(
      'El estudiante no existe',
    );
    expect(inscripciones.save).not.toHaveBeenCalled();
  });

  it('rechaza un evento inexistente', async () => {
    eventos.findOne.mockResolvedValue(null);
    await expect(service.inscribir(3, 2)).rejects.toThrow(
      'El evento no existe',
    );
    expect(inscripciones.save).not.toHaveBeenCalled();
  });

  it('traduce la protección adicional de unicidad de la base', async () => {
    inscripciones.save.mockRejectedValue({
      driverError: { code: 'ER_DUP_ENTRY' },
    });
    await expect(service.inscribir(3, 2)).rejects.toThrow('ya está inscrito');
  });

  it.each([true, false])('marca asistencia como %s', async (asistio) => {
    inscripciones.findOneBy.mockResolvedValue({ id: 1, asistio: !asistio });
    await expect(service.marcarAsistencia(1, asistio)).resolves.toEqual({
      id: 1,
      asistio,
    });
    expect(inscripciones.save).toHaveBeenCalledWith({ id: 1, asistio });
  });

  it('rechaza una inscripción inexistente al marcar asistencia', async () => {
    await expect(service.marcarAsistencia(1, true)).rejects.toThrow(
      'La inscripción no existe',
    );
    expect(inscripciones.save).not.toHaveBeenCalled();
  });

  it('rechaza valores de asistencia que no sean booleanos', async () => {
    await expect(service.marcarAsistencia(1, 'false')).rejects.toThrow(
      'true o false',
    );
    expect(inscripciones.save).not.toHaveBeenCalled();
  });

  it('devuelve los estudiantes inscritos', async () => {
    inscripciones.find.mockResolvedValue([
      { estudiante: { id: 3, nombre: 'Ana' } },
    ]);
    await expect(service.consultarInscritos(2)).resolves.toEqual([
      { id: 3, nombre: 'Ana' },
    ]);
  });

  it('rechaza la consulta de inscritos de un evento inexistente', async () => {
    eventos.findOneBy.mockResolvedValue(null);
    await expect(service.consultarInscritos(2)).rejects.toThrow(
      'El evento no existe',
    );
  });

  it('no consulta sin identificadores válidos', async () => {
    await expect(service.inscribir(undefined, 2)).rejects.toThrow(
      'El estudiante no existe',
    );
    await expect(service.inscribir(3, undefined)).rejects.toThrow(
      'El evento no existe',
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});
