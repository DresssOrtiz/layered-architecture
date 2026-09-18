import { Dependencies, Injectable } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Estudiante } from '../persistence/estudiante.entity';
import { Organizador } from '../persistence/organizador.entity';

@Injectable()
@Dependencies(getRepositoryToken(Estudiante), getRepositoryToken(Organizador))
export class PersonaService {
  constructor(estudiantes, organizadores) {
    this.estudiantes = estudiantes;
    this.organizadores = organizadores;
  }

  consultarEstudiantes() {
    return this.estudiantes.find({ order: { id: 'ASC' } });
  }
  consultarOrganizadores() {
    return this.organizadores.find({ order: { id: 'ASC' } });
  }
}
