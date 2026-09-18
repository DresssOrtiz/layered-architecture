import { Field, GraphQLISODateTime, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('Categoria')
export class CategoriaType {}
Field(() => Int)(CategoriaType.prototype, 'id');
Field(() => String)(CategoriaType.prototype, 'nombre');

@ObjectType('Organizador')
export class OrganizadorType {}
Field(() => Int)(OrganizadorType.prototype, 'id');
Field(() => String)(OrganizadorType.prototype, 'nombre');
Field(() => String)(OrganizadorType.prototype, 'email');

@ObjectType('Estudiante')
export class EstudianteType {}
Field(() => Int)(EstudianteType.prototype, 'id');
Field(() => String)(EstudianteType.prototype, 'nombre');
Field(() => String)(EstudianteType.prototype, 'email');

@ObjectType('Evento')
export class EventoType {}
Field(() => Int)(EventoType.prototype, 'id');
Field(() => String)(EventoType.prototype, 'nombre');
Field(() => String)(EventoType.prototype, 'descripcion');
Field(() => GraphQLISODateTime)(EventoType.prototype, 'fecha');
Field(() => Int)(EventoType.prototype, 'cupoMaximo');
Field(() => CategoriaType)(EventoType.prototype, 'categoria');
Field(() => OrganizadorType)(EventoType.prototype, 'organizador');

@ObjectType('Inscripcion')
export class InscripcionType {}
Field(() => Int)(InscripcionType.prototype, 'id');
Field(() => GraphQLISODateTime)(InscripcionType.prototype, 'fechaInscripcion');
Field(() => Boolean)(InscripcionType.prototype, 'asistio');

@ObjectType('InscripcionDetalle')
export class InscripcionDetalleType {}
Field(() => Int)(InscripcionDetalleType.prototype, 'id');
Field(() => GraphQLISODateTime)(
  InscripcionDetalleType.prototype,
  'fechaInscripcion',
);
Field(() => Boolean)(InscripcionDetalleType.prototype, 'asistio');
Field(() => EstudianteType)(InscripcionDetalleType.prototype, 'estudiante');
