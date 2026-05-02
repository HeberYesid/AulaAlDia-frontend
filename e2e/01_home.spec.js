import { test, expect } from '@playwright/test';

test.describe('Flujo Principal (E2E)', () => {
  test('La página principal carga y muestra la interfaz', async ({ page }) => {
    // 1. Navegar a la raíz (la app redirecciona al login o carga el inicio)
    await page.goto('/');

    // 2. Verificar que el body esté visible
    await expect(page.locator('body')).toBeVisible();

    // Podemos tomar una captura para ver el estado de la app
    // await page.screenshot({ path: 'home.png' });
  });
});
