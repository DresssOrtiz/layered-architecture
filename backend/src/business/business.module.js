import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { CategoriaService } from './categoria.service';
import { EventoService } from './evento.service';
import { HealthService } from './health.service';
import { InscripcionService } from './inscripcion.service';
import { PersonaService } from './persona.service';

@Module({
  imports: [PersistenceModule],
  providers: [
    CategoriaService,
    EventoService,
    HealthService,
    InscripcionService,
    PersonaService,
  ],
  exports: [
    CategoriaService,
    EventoService,
    HealthService,
    InscripcionService,
    PersonaService,
  ],
})
export class BusinessModule {}
