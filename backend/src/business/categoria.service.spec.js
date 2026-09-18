import { jest } from '@jest/globals';
import { CategoriaService } from './categoria.service';

describe('CategoriaService', () => {
  it('crea y consulta categorías mediante el repositorio', async () => {
    const categoria = { id: 1, nombre: 'Cultura' };
    const repository = {
      create: jest.fn((value) => value),
      save: jest.fn().mockResolvedValue(categoria),
      find: jest.fn().mockResolvedValue([categoria]),
    };
    const service = new CategoriaService(repository);
    await expect(service.crear({ nombre: 'Cultura' })).resolves.toEqual(
      categoria,
    );
    expect(repository.save).toHaveBeenCalledWith({ nombre: 'Cultura' });
    await expect(service.consultar()).resolves.toEqual([categoria]);
  });
});
