<script lang="ts">
	import { onMount } from 'svelte';
	import {
		api,
		mensajeError,
		fechaLegible,
		type Evento,
		type Inscripcion,
		type Persona
	} from '$lib/api';
	let { id, estudiantes, onback }: { id: number; estudiantes: Persona[]; onback: () => void } =
		$props();
	let evento = $state<Evento | null>(null);
	let inscripciones = $state<Inscripcion[]>([]);
	let estudianteId = $state<number | undefined>();
	let loading = $state(true);
	let pending = $state(false);
	let error = $state('');
	let success = $state('');
	async function cargar() {
		const data = await api.detalle(id);
		evento = data.evento;
		inscripciones = data.inscripciones;
	}
	async function refrescar() {
		loading = true;
		error = '';
		try {
			await cargar();
		} catch (cause) {
			error = mensajeError(cause);
		} finally {
			loading = false;
		}
	}
	onMount(() => {
		void refrescar();
	});
	async function inscribir(event: SubmitEvent) {
		event.preventDefault();
		pending = true;
		error = '';
		success = '';
		try {
			if (!estudianteId) throw new Error('Selecciona un estudiante');
			await api.inscribir(estudianteId, id);
			success = 'Inscripción exitosa.';
			await cargar();
		} catch (cause) {
			error = mensajeError(cause);
		} finally {
			pending = false;
		}
	}
	async function asistencia(inscripcion: Inscripcion) {
		pending = true;
		error = '';
		success = '';
		try {
			await api.asistencia(inscripcion.id, !inscripcion.asistio);
			success = 'Asistencia actualizada.';
			await cargar();
		} catch (cause) {
			error = mensajeError(cause);
		} finally {
			pending = false;
		}
	}
</script>

<div class="section-heading">
	<button class="secondary" type="button" onclick={onback}>← Volver al catálogo</button><button
		class="secondary"
		type="button"
		onclick={refrescar}
		disabled={loading || pending}>Actualizar detalle</button
	>
</div>
{#if error}<p class="notice error" role="alert">{error}</p>{/if}
{#if success}<p class="notice success" role="status">{success}</p>{/if}
{#if loading}<p role="status" class="empty">Cargando detalle…</p>
{:else if evento}
	<article class="panel detail">
		<span class="badge">{evento.categoria.nombre}</span>
		<h2>{evento.nombre}</h2>
		<p class="description">{evento.descripcion}</p>
		<dl class="event-meta">
			<div>
				<dt>Fecha y hora</dt>
				<dd>{fechaLegible(evento.fecha)}</dd>
			</div>
			<div>
				<dt>Organizador</dt>
				<dd>{evento.organizador.nombre}<small>{evento.organizador.email}</small></dd>
			</div>
			<div>
				<dt>Cupo máximo</dt>
				<dd>{evento.cupoMaximo} personas</dd>
			</div>
			<div>
				<dt>Inscripciones</dt>
				<dd>{inscripciones.length} / {evento.cupoMaximo}</dd>
			</div>
		</dl>
	</article>
	<div class="detail-grid">
		<form class="panel form" onsubmit={inscribir} aria-label="Inscribir estudiante">
			<h3>Inscribir estudiante</h3>
			<p class="muted">Selecciona un estudiante existente para reservar su lugar.</p>
			<label for="estudiante">Estudiante</label>
			<select id="estudiante" bind:value={estudianteId} required
				><option value={undefined} disabled>Selecciona un estudiante</option
				>{#each estudiantes as estudiante (estudiante.id)}<option value={estudiante.id}
						>{estudiante.nombre} · {estudiante.email}</option
					>{/each}</select
			>
			{#if inscripciones.length >= evento.cupoMaximo}<p class="notice">
					Cupo completo. No se aceptan nuevas inscripciones.
				</p>{/if}
			<button type="submit" disabled={pending || !estudiantes.length}
				>{pending ? 'Procesando…' : 'Inscribir estudiante'}</button
			>
		</form>
		<section class="panel" aria-label="Estudiantes inscritos">
			<h3>Estudiantes inscritos <span class="count">{inscripciones.length}</span></h3>
			{#if !inscripciones.length}<p class="empty">Todavía no hay estudiantes inscritos.</p>
			{:else}<ul class="attendees">
					{#each inscripciones as inscripcion (inscripcion.id)}
						<li>
							<div>
								<strong>{inscripcion.estudiante.nombre}</strong><small
									>{inscripcion.estudiante.email}</small
								><span class:attended={inscripcion.asistio} class="attendance"
									>{inscripcion.asistio ? 'Asistió' : 'No asistió'}</span
								>
							</div>
							<button
								class="secondary"
								type="button"
								disabled={pending}
								onclick={() => asistencia(inscripcion)}
								>{inscripcion.asistio ? 'Marcar no asistió' : 'Marcar asistió'}</button
							>
						</li>
					{/each}
				</ul>{/if}
		</section>
	</div>
{/if}
