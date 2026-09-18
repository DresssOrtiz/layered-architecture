import { Dependencies, Injectable } from '@nestjs/common';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { Estudiante } from '../persistence/estudiante.entity';
import { Evento } from '../persistence/evento.entity';
import { Inscripcion } from '../persistence/inscripcion.entity';

@Injectable()
@Dependencies(
  getRepositoryToken(Inscripcion),
  getRepositoryToken(Evento),
  getDataSourceToken(),
)
export class InscripcionService {
  constructor(inscripciones, eventos, dataSource) {
    this.inscripciones = inscripciones;
    this.eventos = eventos;
    this.dataSource = dataSource;
  }

  async inscribir(estudianteId, eventoId) {
    if (!Number.isInteger(estudianteId) || estudianteId <= 0)
      throw new Error('El estudiante no existe');
    if (!Number.isInteger(eventoId) || eventoId <= 0)
      throw new Error('El evento no existe');
    try {
      return await this.dataSource.transaction(
        'READ COMMITTED',
        async (manager) => {
          // Serializa las inscripciones del mismo evento hasta terminar la transacción.
          const evento = await manager.getRepository(Evento).findOne({
            where: { id: eventoId },
            lock: { mode: 'pessimistic_write' },
          });
          if (!evento) throw new Error('El evento no existe');
          const estudiante = await manager
            .getRepository(Estudiante)
            .findOneBy({ id: estudianteId });
          if (!estudiante) throw new Error('El estudiante no existe');
          const inscripciones = manager.getRepository(Inscripcion);
          const duplicada = await inscripciones.findOneBy({
            estudiante: { id: estudianteId },
            evento: { id: eventoId },
          });
          if (duplicada)
            throw new Error('El estudiante ya está inscrito en el evento');
          const cantidad = await inscripciones.countBy({
            evento: { id: eventoId },
          });
          if (cantidad >= evento.cupoMaximo)
            throw new Error('El evento alcanzó el cupo máximo');
          return inscripciones.save(
            inscripciones.create({ estudiante, evento }),
          );
        },
      );
    } catch (error) {
      if (error.driverError?.code === 'ER_DUP_ENTRY') {
        throw new Error('El estudiante ya está inscrito en el evento');
      }
      throw error;
    }
  }

  async consultarInscritos(eventoId) {
    const evento =
      Number.isInteger(eventoId) && eventoId > 0
        ? await this.eventos.findOneBy({ id: eventoId })
        : null;
    if (!evento) throw new Error('El evento no existe');
    const inscripciones = await this.inscripciones.find({
      where: { evento: { id: eventoId } },
      relations: { estudiante: true },
      order: { id: 'ASC' },
    });
    return inscripciones.map((inscripcion) => inscripcion.estudiante);
  }

  async consultarInscripciones(eventoId) {
    const evento =
      Number.isInteger(eventoId) && eventoId > 0
        ? await this.eventos.findOneBy({ id: eventoId })
        : null;
    if (!evento) throw new Error('El evento no existe');
    return this.inscripciones.find({
      where: { evento: { id: eventoId } },
      relations: { estudiante: true },
      order: { id: 'ASC' },
    });
  }

  async marcarAsistencia(inscripcionId, asistio) {
    if (typeof asistio !== 'boolean')
      throw new Error('La asistencia debe ser true o false');
    const inscripcion =
      Number.isInteger(inscripcionId) && inscripcionId > 0
        ? await this.inscripciones.findOneBy({ id: inscripcionId })
        : null;
    if (!inscripcion) throw new Error('La inscripción no existe');
    inscripcion.asistio = asistio;
    return this.inscripciones.save(inscripcion);
  }
}
