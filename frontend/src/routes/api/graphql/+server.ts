import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// El navegador usa el mismo origen; únicamente este servidor conoce la URL interna de Docker.
export const POST: RequestHandler = async ({ request, fetch }) => {
	try {
		const body = await request.json();
		const response = await fetch(env.GRAPHQL_URL || 'http://localhost:3000/graphql', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(15000)
		});
		return json(await response.json(), { status: response.status });
	} catch {
		return json(
			{ errors: [{ message: 'No fue posible conectar con UniEvents. Intenta de nuevo.' }] },
			{ status: 502 }
		);
	}
};
