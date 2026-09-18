export interface Categoria {
	id: number;
	nombre: string;
}
export interface Persona {
	id: number;
	nombre: string;
	email: string;
}
export interface Evento {
	id: number;
	nombre: string;
	descripcion: string;
	fecha: string;
	cupoMaximo: number;
	categoria: Categoria;
	organizador: Persona;
}
export interface Inscripcion {
	id: number;
	fechaInscripcion: string;
	asistio: boolean;
	estudiante: Persona;
}
export interface CrearEventoInput {
	nombre: string;
	descripcion: string;
	fecha: string;
	cupoMaximo: number;
	categoriaId: number;
	organizadorId: number;
}

export async function graphql<T>(
	query: string,
	variables: Record<string, unknown> = {}
): Promise<T> {
	let response: Response;
	try {
		response = await fetch('/api/graphql', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query, variables })
		});
	} catch {
		throw new Error('No fue posible conectar con UniEvents. Intenta de nuevo.');
	}
	const result = await response.json();
	if (result.errors?.length) throw new Error(result.errors[0].message);
	if (!response.ok || !result.data) throw new Error('No fue posible completar la operación.');
	return result.data as T;
}

const camposEvento =
	'id nombre descripcion fecha cupoMaximo categoria { id nombre } organizador { id nombre email }';
export const api = {
	inicio: () =>
		graphql<{
			eventos: Evento[];
			categorias: Categoria[];
			organizadores: Persona[];
			estudiantes: Persona[];
		}>(`{
    eventos { ${camposEvento} } categorias { id nombre }
    organizadores { id nombre email } estudiantes { id nombre email }
  }`),
	detalle: (id: number) =>
		graphql<{ evento: Evento; inscripciones: Inscripcion[] }>(
			`query($id: Int!) {
    evento(id: $id) { ${camposEvento} }
    inscripciones(eventoId: $id) { id fechaInscripcion asistio estudiante { id nombre email } }
  }`,
			{ id }
		),
	crearCategoria: (nombre: string) =>
		graphql<{ crearCategoria: Categoria }>(
			`
				mutation ($input: CrearCategoriaInput!) {
					crearCategoria(input: $input) {
						id
						nombre
					}
				}
			`,
			{ input: { nombre } }
		),
	crearEvento: (input: CrearEventoInput) =>
		graphql<{ crearEvento: Evento }>(
			`mutation($input: CrearEventoInput!) {
    crearEvento(input: $input) { ${camposEvento} }
  }`,
			{ input }
		),
	inscribir: (estudianteId: number, eventoId: number) =>
		graphql(
			`
				mutation ($input: InscribirEstudianteInput!) {
					inscribirEstudiante(input: $input) {
						id
						asistio
					}
				}
			`,
			{ input: { estudianteId, eventoId } }
		),
	asistencia: (inscripcionId: number, asistio: boolean) =>
		graphql(
			`
				mutation ($input: MarcarAsistenciaInput!) {
					marcarAsistencia(input: $input) {
						id
						asistio
					}
				}
			`,
			{ input: { inscripcionId, asistio } }
		)
};

export function mensajeError(error: unknown): string {
	if (!(error instanceof Error)) return 'No fue posible completar la operación.';
	const message =
		error.message === 'El evento alcanzó el cupo máximo'
			? 'El evento alcanzó su cupo máximo'
			: error.message;
	return message.endsWith('.') ? message : `${message}.`;
}
export function fechaLegible(fecha: string): string {
	return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(
		new Date(fecha)
	);
}
