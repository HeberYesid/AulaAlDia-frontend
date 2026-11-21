import { readFileSync } from 'node:fs';
import process from 'node:process';
import { expect, test } from '@playwright/test';

const loginPath = '/api/v1/auth/login/';
const assignmentsPath = '/api/v1/courses/course-subjects/';

function waitForApi(page, origin, path, method = 'GET') {
  return page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.origin === origin && url.pathname === path && response.request().method() === method;
  }, { timeout: 15_000 });
}

async function login(page, origin, institution, password, returnPath = '/admin/dashboard') {
  await page.goto(returnPath === '/admin/dashboard' ? '/login' : returnPath);
  await page.getByLabel('Correo Electrónico').fill(institution.email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  const [response] = await Promise.all([
    waitForApi(page, origin, loginPath, 'POST'),
    page.getByRole('button', { name: 'Entrar', exact: true }).click(),
  ]);
  expect(response.status()).toBe(200);
  expect((await response.json()).active_tenant_id).toBe(institution.tenantId);
  await expect(page).toHaveURL(new URL(returnPath, page.url()).href);
}

async function expectOwnAssignment(page, origin, own, foreign, password) {
  const [response] = await Promise.all([
    waitForApi(page, origin, assignmentsPath),
    login(page, origin, own, password, '/subjects'),
  ]);
  expect(response.status()).toBe(200);
  const data = await response.json();
  const ids = (Array.isArray(data) ? data : data.results).map(({ id }) => id);
  expect(ids).toContain(own.assignmentId);
  expect(ids).not.toContain(foreign.assignmentId);
  await expect(page.getByText(own.subjectName, { exact: true })).toBeVisible();
  await expect(page.getByText(foreign.subjectName, { exact: true })).toHaveCount(0);
}

test('el navegador inicia sesión y respeta el límite entre instituciones', async ({ page, browser, baseURL, request }) => {
  test.setTimeout(90_000);
  const origin = process.env.VITE_API_BASE_URL;
  const password = process.env.AULA_E2E_PASSWORD;
  const manifest = process.env.AULA_E2E_MANIFEST;
  if (!/^http:\/\/127\.0\.0\.1:\d{4,5}$/.test(origin || '') || !manifest || !password || password.length < 20) {
    throw new Error('El E2E requiere API local, manifiesto sintético y contraseña efímera de P2a.');
  }
  const { a, b } = JSON.parse(readFileSync(manifest, 'utf8'));
  expect(a.tenantId).not.toBe(b.tenantId);
  expect(a.assignmentId).not.toBe(b.assignmentId);
  expect((await request.get(`${origin}/health/`, { maxRedirects: 0 })).status()).toBe(200);

  await login(page, origin, a, password);
  const listContext = await browser.newContext({ baseURL });
  try {
    await expectOwnAssignment(await listContext.newPage(), origin, a, b, password);
  } finally {
    await listContext.close();
  }

  const foreignId = `-${b.assignmentId}`;
  const detailPath = `/subjects/${foreignId}`;
  const detailApiPath = `/api/v1/courses${detailPath}/`;
  await test.step('A abre el enlace protegido de B y la API devuelve 404', async () => {
    const context = await browser.newContext({ baseURL });
    try {
      const directPage = await context.newPage();
      const [denied] = await Promise.all([
        waitForApi(directPage, origin, detailApiPath),
        login(directPage, origin, a, password, detailPath),
      ]);
      expect(denied.status()).toBe(404);
      await expect(directPage.getByText('Materia no encontrada', { exact: true })).toBeVisible();
      await expect(directPage.getByText(b.subjectName, { exact: true })).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  const context = await browser.newContext({ baseURL });
  try {
    const pageB = await context.newPage();
    await expectOwnAssignment(pageB, origin, b, a, password);
    const [allowed] = await Promise.all([
      waitForApi(pageB, origin, detailApiPath),
      pageB.getByRole('row').filter({ hasText: b.subjectName }).getByRole('link', { name: 'Ver' }).click(),
    ]);
    expect(allowed.status()).toBe(200);
    await expect(pageB.getByRole('heading', { name: b.subjectName, exact: true })).toBeVisible();
  } finally {
    await context.close();
  }
});
