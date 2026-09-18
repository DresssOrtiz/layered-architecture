import { Dependencies, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Estudiante } from './estudiante.entity';
import { Organizador } from './organizador.entity';

// Demo local: inicializa dos estudiantes y un organizador, sin eventos ni inscripciones.
// Los emails son las claves estables del seed; no se modifican registros existentes.
@Injectable()
@Dependencies(DataSource)
export class DemoSeed {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  async onApplicationBootstrap() {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    try {
      // Evita duplicados también si dos instancias inicializan el demo a la vez.
      const [result] = await runner.query(
        "SELECT GET_LOCK('unievents_demo_seed', 30) AS acquired",
      );
      if (Number(result.acquired) !== 1)
        throw new Error('No se pudo inicializar el demo');
      await runner.startTransaction();
      try {
        for (const [entity, nombre, email] of [
          [Estudiante, 'Ana Demo', 'ana.demo@unievents.test'],
          [Estudiante, 'Luis Demo', 'luis.demo@unievents.test'],
          [
            Organizador,
            'Equipo UniEvents Demo',
            'organizador.demo@unievents.test',
          ],
        ]) {
          const repository = runner.manager.getRepository(entity);
          if (!(await repository.findOneBy({ email }))) {
            await repository.save(repository.create({ nombre, email }));
          }
        }
        await runner.commitTransaction();
      } catch (error) {
        await runner.rollbackTransaction();
        throw error;
      }
    } finally {
      try {
        await runner.query("SELECT RELEASE_LOCK('unievents_demo_seed')");
      } finally {
        await runner.release();
      }
    }
  }
}
