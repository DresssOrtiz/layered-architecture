import { Dependencies, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

// Táctica de disponibilidad: el estado del backend depende de que MariaDB responda,
// no solo de que el proceso Node siga vivo.
@Injectable()
@Dependencies(DataSource)
export class HealthService {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  async verificar() {
    const uptime = Math.round(process.uptime());
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', database: 'up', uptime };
    } catch (error) {
      return {
        status: 'error',
        database: 'down',
        uptime,
        detalle: error.message,
      };
    }
  }
}
