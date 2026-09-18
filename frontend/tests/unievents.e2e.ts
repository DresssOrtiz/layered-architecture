import { expect, test } from '@playwright/test';

test('carga datos reales y permite navegar por los formularios', async ({ page }) => {
	await page.goto('http://localhost:4173');
	await expect(page.getByRole('heading', { name: 'Explora los eventos' })).toBeVisible();
	await expect(page.getByRole('alert')).toHaveCount(0);
	await page.getByRole('button', { name: 'Crear evento', exact: true }).click();
	await expect(page.getByLabel('Organizador').locator('option')).toContainText([
		'Selecciona un organizador',
		'Equipo UniEvents Demo'
	]);
	await expect(page.getByLabel('Nombre del evento')).toBeVisible();
	await page.getByRole('button', { name: 'Categorías', exact: true }).click();
	await expect(page.getByLabel('Nombre de la categoría')).toBeVisible();
	await page.getByRole('button', { name: 'Catálogo', exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Explora los eventos' })).toBeVisible();
});

test('informa un fallo de conexión y permite reintentar', async ({ page }) => {
	await page.route('**/api/graphql', (route) => route.abort());
	await page.goto('http://localhost:4173');
	await expect(page.getByRole('alert')).toContainText('No fue posible conectar');
	await page.unroute('**/api/graphql');
	await page.getByRole('button', { name: 'Reintentar' }).click();
	await expect(page.getByRole('alert')).toHaveCount(0);
	await expect(page.getByRole('heading', { name: 'Explora los eventos' })).toBeVisible();
});
