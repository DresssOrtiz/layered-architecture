import { jest } from '@jest/globals';
import { EventoService } from './evento.service';

describe('EventoService', () => {
  let service;
  let eventos;
  let categorias;
  let organizadores;
  const datos = {
    nombre: 'Taller',
    descripcion: 'Arquitectura',
    fecha: new Date('2027-01-01T12:00:00Z'),
    cupoMaximo: 2,
    categoriaId: 1,
    organizadorId: 2,
  };

  beforeEach(() => {
    eventos = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: 3, ...value })),
      find: jest.fn().mockResolvedValue([{ id: 3 }]),
      findOne: jest.fn().mockResolvedValue({ id: 3 }),
    };
    categorias = { findOneBy: jest.fn().mockResolvedValue({ id: 1 }) };
    organizadores = { findOneBy: jest.fn().mockResolvedValue({ id: 2 }) };
    service = new EventoService(eventos, categorias, organizadores);
  });

  it('crea un evento con categoría y organizador existentes', async () => {
    await expect(service.crear(datos)).resolves.toMatchObject({
      id: 3,
      categoria: { id: 1 },
      organizador: { id: 2 },
      cupoMaximo: 2,
    });
  });

  it('valida la categoría', async () => {
    categorias.findOneBy.mockResolvedValue(null);
    await expect(service.crear(datos)).rejects.toThrow(
      'La categoría no existe',
    );
    expect(eventos.save).not.toHaveBeenCalled();
  });

  it('valida el organizador', async () => {
    organizadores.findOneBy.mockResolvedValue(null);
    await expect(service.crear(datos)).rejects.toThrow(
      'El organizador no existe',
    );
    expect(eventos.save).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5])('rechaza cupo inválido %s', async (cupoMaximo) => {
    await expect(service.crear({ ...datos, cupoMaximo })).rejects.toThrow(
      'entero positivo',
    );
    expect(eventos.save).not.toHaveBeenCalled();
  });

  it('consulta eventos y un evento por id', async () => {
    await expect(service.consultar()).resolves.toEqual([{ id: 3 }]);
    await expect(service.consultarPorId(3)).resolves.toEqual({ id: 3 });
  });

  it('informa cuando el evento no existe', async () => {
    eventos.findOne.mockResolvedValue(null);
    await expect(service.consultarPorId(3)).rejects.toThrow(
      'El evento no existe',
    );
  });
});
