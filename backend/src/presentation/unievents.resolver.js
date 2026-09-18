import 'reflect-metadata';
import { Dependencies, UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlThrottlerGuard } from './gql-throttler.guard';
import { CategoriaService } from '../business/categoria.service';
import { EventoService } from '../business/evento.service';
import { InscripcionService } from '../business/inscripcion.service';
import { PersonaService } from '../business/persona.service';
import {
  CategoriaType,
  EstudianteType,
  EventoType,
  InscripcionType,
  InscripcionDetalleType,
  OrganizadorType,
} from './unievents.types';
import {
  CrearCategoriaInput,
  CrearEventoInput,
  InscribirEstudianteInput,
  MarcarAsistenciaInput,
} from './unievents.inputs';

@Resolver()
@Dependencies(
  CategoriaService,
  EventoService,
  InscripcionService,
  PersonaService,
)
export class UniEventsResolver {
  constructor(
    categoriaService,
    eventoService,
    inscripcionService,
    personaService,
  ) {
    this.categoriaService = categoriaService;
    this.eventoService = eventoService;
    this.inscripcionService = inscripcionService;
    this.personaService = personaService;
  }

  @Query(() => [CategoriaType])
  categorias() {
    return this.categoriaService.consultar();
  }

  @Query(() => [EventoType])
  eventos() {
    return this.eventoService.consultar();
  }

  @Query(() => EventoType)
  evento(id) {
    return this.eventoService.consultarPorId(id);
  }

  @Query(() => [EstudianteType])
  inscritos(eventoId) {
    return this.inscripcionService.consultarInscritos(eventoId);
  }

  @Mutation(() => CategoriaType)
  crearCategoria(input) {
    return this.categoriaService.crear(input);
  }

  @Query(() => [EstudianteType])
  estudiantes() {
    return this.personaService.consultarEstudiantes();
  }

  @Query(() => [OrganizadorType])
  organizadores() {
    return this.personaService.consultarOrganizadores();
  }

  @Query(() => [InscripcionDetalleType])
  inscripciones(eventoId) {
    return this.inscripcionService.consultarInscripciones(eventoId);
  }

  @Mutation(() => EventoType)
  crearEvento(input) {
    return this.eventoService.crear(input);
  }

  // Rate limiting: protege el cupo de intentos automatizados de inscripción.
  // Los límites vienen de ThrottlerModule (RATE_LIMIT_INSCRIPCION / RATE_LIMIT_TTL).
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => InscripcionType)
  inscribirEstudiante(input) {
    return this.inscripcionService.inscribir(
      input.estudianteId,
      input.eventoId,
    );
  }

  @Mutation(() => InscripcionType)
  marcarAsistencia(input) {
    return this.inscripcionService.marcarAsistencia(
      input.inscripcionId,
      input.asistio,
    );
  }
}

// Babel no admite decoradores de parámetros: aplicamos Args explícitamente.
// Nest necesita el arreglo design:paramtypes aun con el tipo GraphQL explícito.
for (const [method, name, type] of [
  ['evento', 'id', Int],
  ['inscritos', 'eventoId', Int],
  ['inscripciones', 'eventoId', Int],
  ['crearCategoria', 'input', CrearCategoriaInput],
  ['crearEvento', 'input', CrearEventoInput],
  ['inscribirEstudiante', 'input', InscribirEstudianteInput],
  ['marcarAsistencia', 'input', MarcarAsistenciaInput],
]) {
  // El metatype real habilita ValidationPipe sobre los InputType; los escalares
  // (Int) no son clases, así que se quedan en Object para que el pipe los ignore.
  Reflect.defineMetadata(
    'design:paramtypes',
    [type === Int ? Object : type],
    UniEventsResolver.prototype,
    method,
  );
  Args(name, { type: () => type })(UniEventsResolver.prototype, method, 0);
}
