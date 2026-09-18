<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import {
		api,
		mensajeError,
		fechaLegible,
		type Categoria,
		type Evento,
		type Persona
	} from '$lib/api';
	import CategoryForm from '$lib/components/CategoryForm.svelte';
	import EventForm from '$lib/components/EventForm.svelte';
	import EventDetail from '$lib/components/EventDetail.svelte';

	let vista = $state<'catalogo' | 'crear' | 'categorias' | 'detalle'>('catalogo');
	let eventos = $state<Evento[]>([]);
	let categorias = $state<Categoria[]>([]);
	let organizadores = $state<Persona[]>([]);
	let estudiantes = $state<Persona[]>([]);
	let seleccionado = $state<number | null>(null);
	let loading = $state(true);
	let error = $state('');
	let success = $state('');
	async function cargar() {
		loading = true;
		error = '';
		try {
			const data = await api.inicio();
			eventos = data.eventos;
			categorias = data.categorias;
			organizadores = data.organizadores;
			estudiantes = data.estudiantes;
		} catch (cause) {
			error = mensajeError(cause);
		} finally {
			loading = false;
		}
	}
	onMount(() => {
		void cargar();
	});
	function navegar(destino: 'catalogo' | 'crear' | 'categorias') {
		vista = destino;
		success = '';
	}
	function categoriaCreada(categoria: Categoria) {
		categorias = [...categorias, categoria];
	}
	function eventoCreado(evento: Evento) {
		eventos = [...eventos, evento];
		seleccionado = evento.id;
		vista = 'detalle';
		success = 'Evento publicado correctamente.';
	}
</script>

<svelte:head
	><title>UniEvents · Encuentra tu próximo encuentro</title><meta
		name="description"
		content="Eventos universitarios, inscripciones y asistencia en un solo lugar."
	/></svelte:head
>
<header class="site-header">
	<div class="header-inner">
		<a class="brand" href={resolve('/')} aria-label="UniEvents, inicio"
			><span class="brand-icon">U</span>UniEvents</a
		><span class="header-note">Vida universitaria, conectada</span>
	</div>
</header>
<main>
	<section class="hero">
		<p class="eyebrow">TU CAMPUS. TUS ENCUENTROS.</p>
		<h1>Hay un lugar para ti.</h1>
		<p>Descubre eventos, reserva tu lugar y lleva el registro de cada encuentro.</p>
	</section>
	<nav class="tabs" aria-label="Secciones de UniEvents">
		<button
			type="button"
			class:active={vista === 'catalogo' || vista === 'detalle'}
			onclick={() => navegar('catalogo')}>Catálogo</button
		>
		<button type="button" class:active={vista === 'crear'} onclick={() => navegar('crear')}
			>Crear evento</button
		>
		<button
			type="button"
			class:active={vista === 'categorias'}
			onclick={() => navegar('categorias')}>Categorías</button
		>
	</nav>
	{#if error}<div class="notice error" role="alert">
			{error} <button type="button" class="secondary" onclick={cargar}>Reintentar</button>
		</div>{/if}
	{#if success}<p class="notice success" role="status">{success}</p>{/if}
	{#if loading}<p class="empty" role="status">Cargando UniEvents…</p>
	{:else if vista === 'catalogo'}
		<div class="section-heading">
			<div>
				<h2>Explora los eventos</h2>
				<p class="muted">
					{eventos.length}
					{eventos.length === 1 ? 'evento disponible' : 'eventos disponibles'}
				</p>
			</div>
			<button class="secondary" type="button" onclick={cargar}>Actualizar catálogo</button>
		</div>
		{#if eventos.length === 0}<section class="panel empty">
				<span class="empty-icon">+</span>
				<h3>El próximo encuentro empieza contigo</h3>
				<p>Aún no hay eventos. Crea una categoría y publica el primero.</p>
				<button type="button" onclick={() => navegar('categorias')}>Crear primera categoría</button>
			</section>
		{:else}<div class="event-grid">
				{#each eventos as evento (evento.id)}
					<article class="panel event-card">
						<span class="badge">{evento.categoria.nombre}</span>
						<h3>{evento.nombre}</h3>
						<p class="muted">{fechaLegible(evento.fecha)}</p>
						<dl>
							<div>
								<dt>Organiza</dt>
								<dd>{evento.organizador.nombre}</dd>
							</div>
							<div>
								<dt>Cupo máximo</dt>
								<dd>{evento.cupoMaximo} personas</dd>
							</div>
						</dl>
						<button
							class="secondary"
							type="button"
							onclick={() => {
								seleccionado = evento.id;
								vista = 'detalle';
								success = '';
							}}
							aria-label={`Ver detalle de ${evento.nombre}`}
							>Ver detalle <span aria-hidden="true">→</span></button
						>
					</article>
				{/each}
			</div>{/if}
	{:else if vista === 'crear'}
		<div class="narrow"><EventForm {categorias} {organizadores} oncreated={eventoCreado} /></div>
	{:else if vista === 'categorias'}
		<div class="detail-grid">
			<CategoryForm oncreated={categoriaCreada} />
			<section class="panel">
				<h2>Categorías disponibles <span class="count">{categorias.length}</span></h2>
				{#if categorias.length}<ul class="category-list">
						{#each categorias as categoria (categoria.id)}<li>{categoria.nombre}</li>{/each}
					</ul>{:else}<p class="empty">Todavía no hay categorías.</p>{/if}
			</section>
		</div>
	{:else if seleccionado !== null}
		{#key seleccionado}<EventDetail
				id={seleccionado}
				{estudiantes}
				onback={() => navegar('catalogo')}
			/>{/key}
	{/if}
</main>
<footer>UniEvents <span>Un espacio para encontrarnos.</span></footer>
