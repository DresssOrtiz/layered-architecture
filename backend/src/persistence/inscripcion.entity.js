import { EntitySchema } from 'typeorm';

export const Inscripcion = new EntitySchema({
  name: 'Inscripcion',
  tableName: 'inscripcion',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
    },
    fechaInscripcion: {
      type: 'datetime',
      createDate: true,
    },
    asistio: {
      type: 'boolean',
      default: false,
    },
  },
  relations: {
    estudiante: {
      type: 'many-to-one',
      target: 'Estudiante',
      inverseSide: 'inscripciones',
      joinColumn: {
        name: 'estudianteId',
      },
      nullable: false,
      onDelete: 'RESTRICT',
    },
    evento: {
      type: 'many-to-one',
      target: 'Evento',
      inverseSide: 'inscripciones',
      joinColumn: {
        name: 'eventoId',
      },
      nullable: false,
      onDelete: 'RESTRICT',
    },
  },
  uniques: [
    {
      name: 'UQ_inscripcion_estudiante_evento',
      columns: ['estudiante', 'evento'],
    },
  ],
});
