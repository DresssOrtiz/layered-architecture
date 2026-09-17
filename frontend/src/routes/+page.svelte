<script lang="ts">
	import { onMount } from 'svelte';

	let mensaje = $state('Cargando...');

	onMount(async () => {
		try {
			const response = await fetch('http://localhost:3000/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					query: `
						query {
							hello
						}
					`
				})
			});

			const result = await response.json();
			mensaje = result.data.hello;
		} catch (error) {
			console.error(error);
			mensaje = 'Error al conectar con el backend';
		}
	});
</script>

<h1>Arquitectura en Capas</h1>
<p>{mensaje}</p>