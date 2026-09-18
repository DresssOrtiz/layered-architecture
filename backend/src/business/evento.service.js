import { Dependencies, Injectable } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Evento } from '../persistence/evento.entity';
import { Categoria } from '../persistence/categoria.entity';
import { Organizador } from '../persistence/organizador.entity';

@Injectable()
@Dependencies(
  getRepositoryToken(Evento),
  getRepositoryToken(Categoria),
  getRepositoryToken(Organizador),
)
export class EventoService {
  constructor(eventos, categorias, organizadores) {
    this.eventos = eventos;
    this.categorias = categorias;
    this.organizadores = organizadores;
  }

  async crear({
    nombre,
    descripcion,
    fecha,
    cupoMaximo,
    categoriaId,
    organizadorId,
  }) {
    if (!Number.isInteger(cupoMaximo) || cupoMaximo <= 0) {
      throw new Error('El cupo máximo debe ser un entero positivo');
    }
    const categoria =
      Number.isInteger(categoriaId) && categoriaId > 0
        ? await this.categorias.findOneBy({ id: categoriaId })
        : null;
    if (!categoria) throw new Error('La categoría no existe');
    const organizador =
      Number.isInteger(organizadorId) && organizadorId > 0
        ? await this.organizadores.findOneBy({ id: organizadorId })
        : null;
    if (!organizador) throw new Error('El organizador no existe');
    return this.eventos.save(
      this.eventos.create({
        nombre,
        descripcion,
        fecha,
        cupoMaximo,
        categoria,
        organizador,
      }),
    );
  }

  consultar() {
    return this.eventos.find({
      relations: { categoria: true, organizador: true },
      order: { id: 'ASC' },
    });
  }

  async consultarPorId(id) {
    const evento =
      Number.isInteger(id) && id > 0
        ? await this.eventos.findOne({
            where: { id },
            relations: { categoria: true, organizador: true },
          })
        : null;
    if (!evento) throw new Error('El evento no existe');
    return evento;
  }
}
