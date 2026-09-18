import { Field, GraphQLISODateTime, InputType, Int } from '@nestjs/graphql';

// Aplicación explícita de Field para fuentes JavaScript sin metadata TypeScript.
@InputType()
export class CrearCategoriaInput {}
Field(() => String)(CrearCategoriaInput.prototype, 'nombre');

@InputType()
export class CrearEventoInput {}
Field(() => String)(CrearEventoInput.prototype, 'nombre');
Field(() => String)(CrearEventoInput.prototype, 'descripcion');
Field(() => GraphQLISODateTime)(CrearEventoInput.prototype, 'fecha');
Field(() => Int)(CrearEventoInput.prototype, 'cupoMaximo');
Field(() => Int)(CrearEventoInput.prototype, 'categoriaId');
Field(() => Int)(CrearEventoInput.prototype, 'organizadorId');

@InputType()
export class InscribirEstudianteInput {}
Field(() => Int)(InscribirEstudianteInput.prototype, 'estudianteId');
Field(() => Int)(InscribirEstudianteInput.prototype, 'eventoId');

@InputType()
export class MarcarAsistenciaInput {}
Field(() => Int)(MarcarAsistenciaInput.prototype, 'inscripcionId');
Field(() => Boolean)(MarcarAsistenciaInput.prototype, 'asistio');
