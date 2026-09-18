import { EntitySchema } from 'typeorm';

export const Estudiante = new EntitySchema({
  name: 'Estudiante',
  tableName: 'estudiante',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
    },
    nombre: {
      type: 'varchar',
      length: 255,
    },
    email: {
      type: 'varchar',
      length: 255,
    },
  },
  relations: {
    inscripciones: {
      type: 'one-to-many',
      target: 'Inscripcion',
      inverseSide: 'estudiante',
    },
  },
});
