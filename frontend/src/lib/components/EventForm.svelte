<script lang="ts">
	import { api, mensajeError, type Categoria, type Evento, type Persona } from '$lib/api';
	let {
		categorias,
		organizadores,
		oncreated
	}: {
		categorias: Categoria[];
		organizadores: Persona[];
		oncreated: (evento: Evento) => void;
	} = $props();
	let nombre = $state('');
	let descripcion = $state('');
	let fecha = $state('');
	let cupoMaximo = $state<number | undefined>(10);
	let categoriaId = $state<number | undefined>();
	let organizadorId = $state<number | undefined>();
	let pending = $state(false);
	let error = $state('');
	async function submit(event: SubmitEvent) {
		event.preventDefault();
		pending = true;
		error = '';
		try {
			if (!categoriaId || !organizadorId || !cupoMaximo)
				throw new Error('Completa los campos requeridos');
			const data = await api.crearEvento({
				nombre: nombre.trim(),
				descripcion: descripcion.trim(),
				fecha: new Date(fecha).toISOString(),
				cupoMaximo,
				categoriaId,
				organizadorId
			});
			oncreated(data.crearEvento);
		} catch (cause) {
			error = mensajeError(cause);
		} finally {
			pending = false;
		}
	}
</script>

<form class="panel form" onsubmit={submit} aria-label="Crear evento">
	<p class="eyebrow">UN NUEVO ENCUENTRO</p>
	<h2>Crear evento</h2>
	<p class="muted">Completa la información para publicarlo en el catálogo.</p>
	<label for="evento-nombre">Nombre del evento</label>
	<input
		id="evento-nombre"
		bind:value={nombre}
		required
		maxlength="255"
		placeholder="Ej. Taller de arquitectura de software"
	/>
	<label for="evento-descripcion">Descripción</label>
	<textarea
		id="evento-descripcion"
		bind:value={descripcion}
		required
		rows="4"
		placeholder="¿Qué van a encontrar los asistentes?"></textarea>
	<div class="two-columns">
		<div>
			<label for="evento-fecha">Fecha y hora</label><input
				id="evento-fecha"
				type="datetime-local"
				bind:value={fecha}
				required
			/><small>Hora local de tu dispositivo.</small>
		</div>
		<div>
			<label for="evento-cupo">Cupo máximo</label><input
				id="evento-cupo"
				type="number"
				min="1"
				step="1"
				bind:value={cupoMaximo}
				required
			/>
		</div>
		<div>
			<label for="evento-categoria">Categoría</label><select
				id="evento-categoria"
				bind:value={categoriaId}
				required
				><option value={undefined} disabled>Selecciona una categoría</option
				>{#each categorias as categoria (categoria.id)}<option value={categoria.id}
						>{categoria.nombre}</option
					>{/each}</select
			>
		</div>
		<div>
			<label for="evento-organizador">Organizador</label><select
				id="evento-organizador"
				bind:value={organizadorId}
				required
				><option value={undefined} disabled>Selecciona un organizador</option
				>{#each organizadores as organizador (organizador.id)}<option value={organizador.id}
						>{organizador.nombre}</option
					>{/each}</select
			>
		</div>
	</div>
	{#if categorias.length === 0}<p class="notice">
			Primero crea una categoría desde la sección Categorías.
		</p>{/if}
	{#if organizadores.length === 0}<p class="notice">
			No hay organizadores disponibles. Verifica la inicialización de datos demo.
		</p>{/if}
	<button type="submit" disabled={pending || !categorias.length || !organizadores.length}
		>{pending ? 'Publicando…' : 'Publicar evento'}</button
	>
	{#if error}<p class="notice error" role="alert">{error}</p>{/if}
</form>
