import { EntitySchema } from 'typeorm';

export const Categoria = new EntitySchema({
  name: 'Categoria',
  tableName: 'categoria',
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
  },
  relations: {
    eventos: {
      type: 'one-to-many',
      target: 'Evento',
      inverseSide: 'categoria',
    },
  },
});
