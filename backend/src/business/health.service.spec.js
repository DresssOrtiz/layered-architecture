import { jest } from '@jest/globals';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('reporta la base de datos disponible cuando la consulta responde', async () => {
    const dataSource = { query: jest.fn().mockResolvedValue([{ 1: 1 }]) };
    await expect(
      new HealthService(dataSource).verificar(),
    ).resolves.toMatchObject({
      status: 'ok',
      database: 'up',
      uptime: expect.any(Number),
    });
    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('reporta la base de datos caída cuando la consulta falla', async () => {
    const dataSource = {
      query: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    };
    await expect(
      new HealthService(dataSource).verificar(),
    ).resolves.toMatchObject({
      status: 'error',
      database: 'down',
      detalle: 'ECONNREFUSED',
    });
  });
});
