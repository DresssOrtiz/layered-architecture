import { EntitySchema } from 'typeorm';

export const Evento = new EntitySchema({
  name: 'Evento',
  tableName: 'evento',
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
    descripcion: {
      type: 'text',
    },
    fecha: {
      type: 'datetime',
    },
    cupoMaximo: {
      type: 'int',
    },
  },
  relations: {
    categoria: {
      type: 'many-to-one',
      target: 'Categoria',
      inverseSide: 'eventos',
      joinColumn: {
        name: 'categoriaId',
      },
      nullable: false,
      onDelete: 'RESTRICT',
    },
    organizador: {
      type: 'many-to-one',
      target: 'Organizador',
      inverseSide: 'eventos',
      joinColumn: {
        name: 'organizadorId',
      },
      nullable: false,
      onDelete: 'RESTRICT',
    },
    inscripciones: {
      type: 'one-to-many',
      target: 'Inscripcion',
      inverseSide: 'evento',
    },
  },
});
