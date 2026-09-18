<script lang="ts">
	import { api, mensajeError, type Categoria } from '$lib/api';
	let { oncreated }: { oncreated: (categoria: Categoria) => void } = $props();
	let nombre = $state('');
	let pending = $state(false);
	let error = $state('');
	let success = $state('');
	async function submit(event: SubmitEvent) {
		event.preventDefault();
		pending = true;
		error = '';
		success = '';
		try {
			const data = await api.crearCategoria(nombre.trim());
			oncreated(data.crearCategoria);
			nombre = '';
			success = 'Categoría creada correctamente.';
		} catch (cause) {
			error = mensajeError(cause);
		} finally {
			pending = false;
		}
	}
</script>

<form onsubmit={submit} class="panel form" aria-label="Crear categoría">
	<p class="eyebrow">ORGANIZA EL CATÁLOGO</p>
	<h2>Crear categoría</h2>
	<p class="muted">Agrupa los eventos por su temática.</p>
	<label for="categoria-nombre">Nombre de la categoría</label>
	<input
		id="categoria-nombre"
		bind:value={nombre}
		required
		maxlength="255"
		placeholder="Ej. Tecnología"
	/>
	<button type="submit" disabled={pending || !nombre.trim()}
		>{pending ? 'Guardando…' : 'Guardar categoría'}</button
	>
	{#if error}<p class="notice error" role="alert">{error}</p>{/if}
	{#if success}<p class="notice success" role="status">{success}</p>{/if}
</form>
