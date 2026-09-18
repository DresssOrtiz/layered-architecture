import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estudiante } from './estudiante.entity';
import { Organizador } from './organizador.entity';
import { Categoria } from './categoria.entity';
import { Evento } from './evento.entity';
import { Inscripcion } from './inscripcion.entity';
import { DemoSeed } from './demo.seed';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Estudiante,
      Organizador,
      Categoria,
      Evento,
      Inscripcion,
    ]),
  ],
  exports: [TypeOrmModule],
  providers: [DemoSeed],
})
export class PersistenceModule {}
