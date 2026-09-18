import { Field, GraphQLISODateTime, InputType, Int } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

// Aplicación explícita de Field y de los validadores para fuentes JavaScript
// sin metadata TypeScript: class-validator registra contra prototype.constructor.
const texto = (clase, propiedad, maximo = 255) => {
  // Recorta antes de validar: así " " no pasa como nombre válido.
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))(
    clase.prototype,
    propiedad,
  );
  IsString()(clase.prototype, propiedad);
  IsNotEmpty()(clase.prototype, propiedad);
  MaxLength(maximo)(clase.prototype, propiedad);
};
const identificador = (clase, propiedad) => {
  IsInt()(clase.prototype, propiedad);
  Min(1)(clase.prototype, propiedad);
};

@InputType()
export class CrearCategoriaInput {}
Field(() => String)(CrearCategoriaInput.prototype, 'nombre');
texto(CrearCategoriaInput, 'nombre');

@InputType()
export class CrearEventoInput {}
Field(() => String)(CrearEventoInput.prototype, 'nombre');
Field(() => String)(CrearEventoInput.prototype, 'descripcion');
Field(() => GraphQLISODateTime)(CrearEventoInput.prototype, 'fecha');
Field(() => Int)(CrearEventoInput.prototype, 'cupoMaximo');
Field(() => Int)(CrearEventoInput.prototype, 'categoriaId');
Field(() => Int)(CrearEventoInput.prototype, 'organizadorId');
texto(CrearEventoInput, 'nombre');
texto(CrearEventoInput, 'descripcion', 2000);
IsDate()(CrearEventoInput.prototype, 'fecha');
IsInt()(CrearEventoInput.prototype, 'cupoMaximo');
Min(1)(CrearEventoInput.prototype, 'cupoMaximo');
identificador(CrearEventoInput, 'categoriaId');
identificador(CrearEventoInput, 'organizadorId');

@InputType()
export class InscribirEstudianteInput {}
Field(() => Int)(InscribirEstudianteInput.prototype, 'estudianteId');
Field(() => Int)(InscribirEstudianteInput.prototype, 'eventoId');
identificador(InscribirEstudianteInput, 'estudianteId');
identificador(InscribirEstudianteInput, 'eventoId');

@InputType()
export class MarcarAsistenciaInput {}
Field(() => Int)(MarcarAsistenciaInput.prototype, 'inscripcionId');
Field(() => Boolean)(MarcarAsistenciaInput.prototype, 'asistio');
identificador(MarcarAsistenciaInput, 'inscripcionId');
IsBoolean()(MarcarAsistenciaInput.prototype, 'asistio');
