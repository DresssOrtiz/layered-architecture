import { EntitySchema } from 'typeorm';

export const Organizador = new EntitySchema({
  name: 'Organizador',
  tableName: 'organizador',
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
    eventos: {
      type: 'one-to-many',
      target: 'Evento',
      inverseSide: 'organizador',
    },
  },
});
