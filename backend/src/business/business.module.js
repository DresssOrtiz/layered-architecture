import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { CategoriaService } from './categoria.service';
import { EventoService } from './evento.service';
import { InscripcionService } from './inscripcion.service';
import { PersonaService } from './persona.service';

@Module({
  imports: [PersistenceModule],
  providers: [
    CategoriaService,
    EventoService,
    InscripcionService,
    PersonaService,
  ],
  exports: [
    CategoriaService,
    EventoService,
    InscripcionService,
    PersonaService,
  ],
})
export class BusinessModule {}
