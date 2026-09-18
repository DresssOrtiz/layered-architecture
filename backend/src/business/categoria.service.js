import { Dependencies, Injectable } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Categoria } from '../persistence/categoria.entity';

@Injectable()
@Dependencies(getRepositoryToken(Categoria))
export class CategoriaService {
  constructor(categorias) {
    this.categorias = categorias;
  }

  async crear({ nombre }) {
    return this.categorias.save(this.categorias.create({ nombre }));
  }

  consultar() {
    return this.categorias.find({ order: { id: 'ASC' } });
  }
}
