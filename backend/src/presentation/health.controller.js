import {
  Controller,
  Dependencies,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HealthService } from '../business/health.service';

@Controller('health')
@Dependencies(HealthService)
export class HealthController {
  constructor(healthService) {
    this.healthService = healthService;
  }

  @Get()
  async comprobar() {
    const resultado = await this.healthService.verificar();
    // 503 para que el healthcheck de Docker marque el contenedor como unhealthy.
    if (resultado.status !== 'ok')
      throw new ServiceUnavailableException(resultado);
    return resultado;
  }
}
