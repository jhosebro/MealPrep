// Pasos de los .feature: imitan lo que hace cada pantalla sobre los stores reales (ver support/world.ts).
import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { budget, fridge, recipes, STATUS, U, World } from '../support/world';
import { db } from '../support/fake-supabase';
import { FridgeItem } from '@/types';
import { loginFormError, translateAuthError } from '@/utils/auth-errors';
import { computeShoppingTotal } from '@/utils/compute-shopping-total';
import { formatLocalDate } from '@/utils/date';
import { buildFridgeExport, depletionLabel, fridgeSections, isNearDepletion } from '@/utils/fridge';
import { buildManualRecipe, parseRecipeJson } from '@/utils/recipe-validation';
import { parseBudgetAmount, shoppingList, storeKey } from '@/utils/shopping';
import { validatePriceInput } from '@/utils/validate-price-input';

const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return formatLocalDate(d); };
const num = (s: string) => Number(s.replace(/\./g, ''));
const item = (name: string) => { const i = fridge().items.find((x) => x.name === name); assert.ok(i, `no existe ${name}`); return i; };

/** Lo que muestra la pantalla actual como lista de alimentos. */
function visible(w: World): FridgeItem[] {
  if (w.screen === 'compras') {
    return shoppingList(fridge().items)
      .filter((i) => !w.filterCat || i.category === w.filterCat)
      .filter((i) => !w.filterStore || storeKey(i.store_name) === w.filterStore);
  }
  if (w.screen === 'archivados') return fridge().items.filter((i) => i.archived);
  if (w.screen === 'inicio') return fridge().items.filter(isNearDepletion);
  return fridgeSections(fridge().items, w.filterCat, w.query).flatMap((s) => s.data);
}
const names = (w: World) => visible(w).map((i) => i.name);

// ---------- Comunes ----------
Given('que inicié sesión', () => {});

Given(/^(?:que )?el servidor no está disponible$/, () => { db.fail = true; });

Given(/^que tengo "([^"]*)" en la nevera$/, async function (this: World, n: string) { await this.seedItem({ name: n }); });

Given(/^que tengo "([^"]*)" y "([^"]*)" en la nevera$/, async function (this: World, a: string, b: string) {
  await this.seedItem({ name: a }); await this.seedItem({ name: b });
});

Given(/^que tengo alimentos en la nevera$/, async function (this: World) {
  await this.seedItem({ name: 'Leche', purchase_date: '2026-11-20' }); await this.seedItem({ name: 'Arroz' });
});

Given('que mi nevera está vacía', () => {});

When(/^abro la pestaña "([^"]*)"$/, async function (this: World, tab: string) {
  this.screen = tab.toLowerCase();
  await fridge().fetchItems(U);
  if (tab === 'Compras') await budget().fetchActive(U);
});

When('veo la nevera', async function (this: World) { this.screen = 'nevera'; await fridge().fetchItems(U); });

Then(/^veo "([^"]*)"$/, function (this: World, text: string) {
  const home = `${fridge().items.length} ingredientes en tu nevera`;
  const ok = this.lastMessage === text || (this.screen === 'inicio' && home === text) || names(this).includes(text);
  assert.ok(ok, `no veo "${text}" (mensaje: "${this.lastMessage}")`);
});

Then(/^veo "([^"]*)" y "([^"]*)"$/, function (this: World, a: string, b: string) {
  assert.ok(names(this).includes(a) && names(this).includes(b), `visible: ${names(this)}`);
});

Then(/^no veo "([^"]*)"$/, function (this: World, n: string) { assert.ok(!names(this).includes(n)); });

Then(/^solo veo "([^"]*)"$/, function (this: World, n: string) { assert.deepEqual(names(this), [n]); });

Then(/^veo "([^"]*)" con "([^"]*)"$/, function (this: World, n: string, label: string) {
  if (this.screen === 'recetas') {
    const s = recipes().suggestedRecipes.find((r) => r.recipe.title === n);
    assert.ok(s, `sin sugerencia ${n}`);
    const m = s.missingIngredients.length;
    assert.equal(m === 0 ? 'Tienes todo' : `${m} faltante${m > 1 ? 's' : ''}`, label);
  } else {
    const i = visible(this).find((x) => x.name === n);
    assert.ok(i, `no veo ${n}`);
    assert.equal(depletionLabel(i), label);
  }
});

Then(/^veo el error "(.*)"$/, function (this: World, msg: string) { assert.equal(this.lastMessage, msg); });

Then(/^veo un (?:error|mensaje de error)$/, function (this: World) { assert.ok(this.lastMessage, 'sin mensaje de error'); });

// ---------- Autenticación ----------
Given('que estoy en la pantalla de inicio de sesión', function (this: World) { this.screen = 'login'; });

When(/^toco "Iniciar sesión" sin completar correo o contraseña$/, function (this: World) {
  this.lastMessage = loginFormError('', '') ?? '';
});

When(/^el servidor responde con el error "([^"]*)"$/, function (this: World, e: string) { this.lastMessage = translateAuthError(e); });

// ---------- Compras ----------
Given(/^(?:que tengo )?"([^"]*)" en estado "([^"]*)"$/, async function (this: World, n: string, st: string) {
  await this.seedItem({ name: n, status: STATUS[st] });
});

Given(/^que la lista tiene "([^"]*)" \((\w+)\) y "([^"]*)" \((\w+)\)$/, async function (this: World, a: string, ca: string, b: string, cb: string) {
  await this.seedItem({ name: a, category: ca, status: 'low' }); await this.seedItem({ name: b, category: cb, status: 'low' });
  this.screen = 'compras';
});

Given(/^que la lista tiene "([^"]*)" del establecimiento "([^"]*)"$/, async function (this: World, n: string, s: string) {
  await this.seedItem({ name: n, store_name: s, status: 'low' }); this.screen = 'compras';
});

Given(/^que la lista tiene "([^"]*)"(?: sin precio)?$/, async function (this: World, n: string) {
  await this.seedItem({ name: n, status: 'low' }); this.screen = 'compras';
});

When(/^filtro por "([^"]*)"$/, function (this: World, c: string) { this.filterCat = c; });

When(/^veo el filtro "([^"]*)"$/, function (this: World, s: string) {
  assert.ok(shoppingList(fridge().items).some((i) => storeKey(i.store_name) === s), `sin filtro ${s}`);
});

Then(/^el contador de "([^"]*)" incluye a "([^"]*)"$/, function (this: World, s: string, n: string) {
  assert.ok(shoppingList(fridge().items).filter((i) => storeKey(i.store_name) === s).some((i) => i.name === n));
});

Then(/^al filtrar por "([^"]*)" veo "([^"]*)"$/, function (this: World, s: string, n: string) {
  this.filterStore = s; assert.ok(names(this).includes(n));
});

async function setPrice(w: World, text: string) {
  w.screen = 'compras';
  if (!fridge().items.length) await w.seedItem({ name: 'Leche', status: 'low' });
  w.prevTotal = computeShoppingTotal(visible(w));
  const { valid, value } = validatePriceInput(text);
  if (!valid) return void (w.lastMessage = 'Precio inválido');
  await fridge().updateItem(w.itemId, { price: value });
}
When(/^le pongo el precio "([^"]*)"$/, function (this: World, p: string) { return setPrice(this, p); });
When(/^intento poner el precio "([^"]*)"$/, function (this: World, p: string) { return setPrice(this, p); });

Then(/^el total de la lista aumenta en (\d+)$/, function (this: World, n: string) {
  assert.equal(computeShoppingTotal(visible(this)) - this.prevTotal, Number(n));
});

Then('el precio no se guarda', function (this: World) { assert.equal(item('Leche').price, null); });

Given('que no tengo un presupuesto activo', async function (this: World) {
  await this.seedItem({ name: 'Leche', status: 'low' }); this.screen = 'compras';
});

async function seedBudget(amount: number, spent: number) {
  (db.tables.budget_sessions ??= []).push({ id: `id${++db.seq}`, user_id: U, amount, spent, status: 'active' });
  await budget().fetchActive(U);
}
Given(/^que tengo un presupuesto activo de ([\d.]+) con ([\d.]+) gastado$/, async function (this: World, a: string, s: string) {
  await seedBudget(num(a), num(s)); this.screen = 'compras';
});

Given(/^"([^"]*)" cuesta ([\d.]+)$/, async function (this: World, n: string, p: string) {
  await this.seedItem({ name: n, status: 'low', price: num(p) });
});

/** handleBuy de Compras. */
async function buy(w: World, name: string) {
  const i = item(name), s = budget().session;
  w.prevSpent = s?.spent ?? 0;
  if (s) await budget().markBought(s.id, i.id, i.price || 0, i.status);
  else await fridge().updateItem(i.id, { status: 'available', purchase_date: formatLocalDate(new Date()) });
  await fridge().fetchItems(U);
}
When(/^marco "([^"]*)" como comprada$/, function (this: World, n: string) { return buy(this, n); });

Then(/^"([^"]*)" pasa a "([^"]*)" con fecha de compra de hoy \(hora local\)$/, function (n: string, st: string) {
  const i = item(n);
  assert.equal(i.status, STATUS[st]);
  assert.equal(i.purchase_date, formatLocalDate(new Date()));
});

Then('sale de la lista de compras', function (this: World) { assert.ok(!names(this).includes('Leche')); });

Then(/^el gasto del presupuesto es ([\d.]+)$/, function (s: string) { assert.equal(budget().session?.spent, num(s)); });

Then('queda registrada la compra', function () {
  assert.equal(budget().purchases.length, 1);
  assert.equal(db.tables.budget_purchases?.length, 1);
});

Given(/^que acabo de marcar "([^"]*)" como comprada con presupuesto activo$/, async function (this: World, n: string) {
  await seedBudget(200000, 0);
  await this.seedItem({ name: n, status: 'low', price: 4500 });
  this.screen = 'compras';
  await buy(this, n);
  this.prevSpent = budget().session!.spent;
});

Then(/^"([^"]*)" vuelve a la lista$/, function (this: World, n: string) { assert.ok(names(this).includes(n)); });

Then(/^el gasto del presupuesto se reduce en ([\d.]+) sin quedar negativo$/, function (this: World, s: string) {
  const spent = budget().session!.spent;
  assert.equal(spent, Math.max(0, this.prevSpent - num(s)));
  assert.ok(spent >= 0);
});

When(/^abro "Presupuesto" y escribo "([^"]*)"$/, function (this: World, t: string) { this.screen = 'compras'; this.form.budgetText = t; });

When('lo confirmo', async function (this: World) {
  const amount = parseBudgetAmount(this.form.budgetText);
  if (amount == null) return void (this.lastMessage = 'Ingresa un monto válido');
  await budget().startBudget(U, amount);
});

Then(/^el presupuesto activo es de (\d+) pesos$/, function (n: string) {
  assert.equal(budget().session?.amount, Number(n));
  assert.equal(budget().session?.status, 'active');
});

When(/^archivo "([^"]*)"$/, async function (this: World, n: string) { await fridge().updateItem(item(n).id, { archived: true }); });

Then('no aparece en la lista', function (this: World) { assert.ok(!names(this).includes('Gaseosa')); });

Then('aparece en la vista de archivados', function (this: World) {
  assert.ok(fridge().items.filter((i) => i.archived).some((i) => i.name === 'Gaseosa'));
});

Then('vuelve a la lista', function (this: World) { assert.ok(names(this).includes('Gaseosa')); });

Given('que tengo un presupuesto activo', async function (this: World) {
  await seedBudget(200000, 0);
  await this.seedItem({ name: 'Leche', status: 'low', price: 4500 });
  await buy(this, 'Leche');
  this.prevSpent = budget().session!.spent;
});

When(/^toco "Finalizar" y confirmo$/, async function (this: World) {
  this.savedId = budget().session!.id;
  await budget().finishShopping(this.savedId);
});

Then('el presupuesto se cierra con el total gastado', function (this: World) {
  const row = db.tables.budget_sessions.find((r) => r.id === this.savedId)!;
  assert.equal(row.status, 'completed');
  assert.equal(row.spent, this.prevSpent);
  assert.equal(budget().session, null);
});

// ---------- Inicio ----------
Given(/^que tengo (\d+) alimentos en la nevera$/, async function (this: World, n: string) {
  for (let i = 0; i < Number(n); i++) await this.seedItem({ name: `Alimento ${i}` });
});

Given(/^que "([^"]*)" está "([^"]*)"$/, async function (this: World, n: string, st: string) { await this.seedItem({ name: n, status: STATUS[st] }); });

Given(/^(?:que )?"([^"]*)" tiene promedio de (\d+) días? por unidad y cantidad (\d+)$/, async function (this: World, n: string, avg: string, q: string) {
  await this.seedItem({ name: n, avg_days_per_unit: Number(avg), quantity: Number(q) });
});

Given('que tengo alimentos disponibles y recetas guardadas', async function (this: World) {
  await this.seedItem({ name: 'Arroz' });
  await this.seedRecipe('Arroz con huevo', ['arroz', 'huevo', 'sal']);
});

Then(/^voy a la pestaña "Recetas" con sugerencias calculadas$/, function (this: World) {
  assert.equal(this.screen, 'recetas');
  assert.ok(recipes().suggestedRecipes.length > 0);
});

// ---------- Nevera ----------
Given(/^que tengo "([^"]*)" en "([^"]*)" y "([^"]*)" en "([^"]*)"$/, async function (this: World, a: string, ca: string, b: string, cb: string) {
  await this.seedItem({ name: a, category: ca }); await this.seedItem({ name: b, category: cb });
});

Then('veo una sección por cada categoría con sus alimentos', function (this: World) {
  const s = Object.fromEntries(fridgeSections(fridge().items, null, '').map((x) => [x.title, x.data.map((i) => i.name)]));
  assert.deepEqual(s, { lacteos: ['Leche'], verduras: ['Tomate'] });
});

When(/^escribo "([^"]*)" en el buscador$/, function (this: World, q: string) { this.screen = 'nevera'; this.query = q; });

Given(/^que estoy en "Agregar alimento"$/, function (this: World) { this.screen = 'agregar'; this.resetForm(); });

Given(/^que estoy en "Agregar alimento" a las 21:00 hora de Colombia$/, function (this: World) {
  this.screen = 'agregar'; this.resetForm();
  const d = new Date(); d.setHours(21, 0, 0, 0);
  this.form.purchaseDate = d;
});

When(/^escribo el nombre "([^"]*)"$/, function (this: World, n: string) { this.form.name = n; });

When(/^la cantidad "(.*)" con unidad "([^"]*)"$/, function (this: World, q: string, u: string) { this.form.quantity = q; this.form.unit = u; });

When(/^elijo la categoría "([^"]*)" y el establecimiento "([^"]*)"$/, function (this: World, c: string, s: string) {
  this.form.category = c; this.form.storeName = s; this.form.showCustomStore = false;
});

When(/^dejo el nombre vacío y toco "Guardar"$/, async function (this: World) { this.form.name = ''; await this.saveAdd(); });

When(/^escribo el nombre "([^"]*)" y la cantidad "(.*)"$/, function (this: World, n: string, q: string) { this.form.name = n; this.form.quantity = q; });

When(/^escribo el nombre "([^"]*)", la cantidad "([^"]*)" y el estado "([^"]*)"$/, function (this: World, n: string, q: string, st: string) {
  this.form.name = n; this.form.quantity = q; this.form.status = STATUS[st];
});

When(/^escribo la cantidad "([^"]*)" y un precio por unidad de "([^"]*)"$/, function (this: World, q: string, p: string) {
  this.form.quantity = q; this.form.price = p; this.form.priceMode = 'unit';
});

When(/^elijo el establecimiento "Otro" y escribo "([^"]*)"$/, function (this: World, s: string) {
  this.form.showCustomStore = true; this.form.storeName = s;
});

When(/^(?:guardo el alimento|dejo la fecha de compra en hoy y guardo)$/, function (this: World) { return this.saveAdd(); });

Then(/^vuelvo a la nevera y veo "([^"]*)" con (\d+) (\w+)$/, function (this: World, n: string, q: string, u: string) {
  assert.equal(this.screen, 'nevera', this.lastMessage);
  const i = item(n);
  assert.equal(i.quantity, Number(q)); assert.equal(i.unit, u);
});

Then(/^"([^"]*)" se guarda con estado "([^"]*)"$/, function (n: string, st: string) { assert.equal(item(n).status, STATUS[st]); });

Then(/^el alimento se guarda con precio (\d+)$/, function (this: World, p: string) { assert.equal(item(this.form.name).price, Number(p)); });

Then(/^el alimento queda con establecimiento "([^"]*)"$/, function (this: World, s: string) { assert.equal(item(this.form.name).store_name, s); });

Then('la fecha de compra guardada es la de hoy, no la de mañana', function (this: World) {
  assert.equal(item('Leche').purchase_date, formatLocalDate(new Date()));
});

Given(/^que tengo "([^"]*)" con fecha de compra "([^"]*)" y vencimiento "([^"]*)"$/, async function (this: World, n: string, p: string, e: string) {
  await this.seedItem({ name: n, purchase_date: p, expiry_date: e });
});

When(/^abro "([^"]*)", cambio la cantidad a (\d+) y guardo$/, async function (this: World, n: string, q: string) {
  await this.loadEdit(item(n).id); this.form.quantity = String(q); await this.saveEdit();
});

Then(/^las fechas siguen siendo "([^"]*)" y "([^"]*)"$/, function (this: World, p: string, e: string) {
  const i = item('Leche');
  assert.equal(i.purchase_date, p); assert.equal(i.expiry_date, e);
});

Given(/^que tengo (\d+) und de "([^"]*)" compradas hace (\d+) días$/, async function (this: World, q: string, n: string, d: string) {
  await this.seedItem({ name: n, quantity: Number(q), purchase_date: daysAgo(Number(d)) });
  this.prevTotal = 0;
});

When(/^edito "([^"]*)", pongo la cantidad en 0 y guardo$/, async function (this: World, n: string) {
  await this.loadEdit(item(n).id); this.form.quantity = '0'; await this.saveEdit();
});

Then(/^"([^"]*)" queda "([^"]*)"$/, function (n: string, st: string) { assert.equal(item(n).status, STATUS[st]); });

Then(/^su consumo total aumenta en (\d+)$/, function (this: World, n: string) {
  assert.equal(item('Huevos').total_consumed - this.prevTotal, Number(n));
});

Then(/^su promedio es de (\d+) días por unidad$/, function (n: string) { assert.equal(item('Huevos').avg_days_per_unit, Number(n)); });

Given(/^que "([^"]*)" ya está "([^"]*)" con consumo total (\d+)$/, async function (this: World, n: string, st: string, t: string) {
  await this.seedItem({ name: n, status: STATUS[st], quantity: 0, total_consumed: Number(t), avg_days_per_unit: 2, purchase_date: daysAgo(8) });
});

When('lo edito y guardo sin cambios', async function (this: World) { await this.loadEdit(this.itemId); await this.saveEdit(); });

Then(/^su consumo total sigue siendo (\d+)$/, function (n: string) { assert.equal(item('Huevos').total_consumed, Number(n)); });

Then(/^"([^"]*)" muestra "([^"]*)"$/, function (this: World, n: string, label: string) {
  const i = visible(this).find((x) => x.name === n);
  assert.ok(i); assert.equal(depletionLabel(i), label);
});

When('lo elimino y confirmo', async function (this: World) { await fridge().deleteItem(this.itemId); });

Then(/^"([^"]*)" ya no aparece en la nevera$/, function (this: World, n: string) { assert.ok(!names(this).includes(n)); });

Given(/^que estoy editando "([^"]*)"$/, async function (this: World, n: string) { await this.loadEdit(await this.seedItem({ name: n })); });

When(/^toco eliminar y confirmo$/, async function (this: World) {
  try {
    await fridge().deleteItem(this.itemId);
    this.screen = 'nevera';
  } catch {
    this.lastMessage = 'No se pudo eliminar. Intenta de nuevo.';
  }
});

Then('sigo en la pantalla de edición', function (this: World) { assert.equal(this.screen, 'editar'); });

When('toco exportar', function (this: World) {
  if (fridge().items.length === 0) return void (this.lastMessage = 'No hay alimentos para exportar');
  this.exported = buildFridgeExport(fridge().items);
});

Then('se comparte o copia un JSON con mis alimentos', function (this: World) {
  assert.deepEqual(JSON.parse(this.exported), [
    { nombre: 'Leche', fecha_compra: '2026-11-20' }, { nombre: 'Arroz', fecha_compra: null },
  ]);
});

// ---------- Recetas ----------
Given('que no tengo recetas guardadas', () => {});

Given(/^que tengo guardada "([^"]*)" con ingredientes "([^"]*)", "([^"]*)" y "([^"]*)"$/, async function (this: World, t: string, a: string, b: string, c: string) {
  await this.seedRecipe(t, [a, b, c]);
});

Given(/^en mi nevera hay "([^"]*)" y "([^"]*)" disponibles$/, async function (this: World, a: string, b: string) {
  await this.seedItem({ name: a }); await this.seedItem({ name: b });
});

Given('que una receta guardada tiene 3 ingredientes que no tengo', async function (this: World) {
  await this.seedItem({ name: 'Arroz' });
  await this.seedRecipe('Paella', ['arroz', 'camarones', 'azafrán', 'mejillones']);
});

Then('esa receta no aparece en las sugerencias', function (this: World) {
  assert.ok(!recipes().suggestedRecipes.some((r) => r.recipe.title === this.recipeTitle));
});

Given('que tengo recetas guardadas e ingredientes en la nevera', async function (this: World) {
  await this.seedItem({ name: 'Arroz' });
  await this.seedRecipe('Arroz con huevo', ['arroz', 'huevo']);
});

When('deselecciono todos los ingredientes', function (this: World) { this.selectedIngredients = []; });

Given(/^que estoy en "Crear receta" en modo "([^"]*)"$/, function (this: World, _m: string) { this.screen = 'crear'; this.resetForm(); });

When('pego un JSON con title, meal_type, ingredients y steps válidos', function (this: World) {
  this.form.jsonText = JSON.stringify({ title: 'Arepa', meal_type: 'desayuno', ingredients: ['harina'], steps: ['amasar'] });
});

When(/^pego "(.*)" y toco "Validar y Guardar"$/, async function (this: World, json: string) {
  this.form.jsonText = json; await this.saveRecipe(parseRecipeJson(json));
});

Then(/^la receta aparece en "Guardadas"$/, function () {
  assert.ok(recipes().savedRecipes.some((r) => r.recipe_data.title === 'Arepa'));
});

When(/^escribo el nombre "([^"]*)", un ingrediente por línea y un paso por línea$/, function (this: World, t: string) {
  Object.assign(this.form, { title: t, ingredientsText: 'harina\nsal', stepsText: 'amasar\nasar' });
});

When('intento guardar una receta válida', async function (this: World) {
  this.screen = 'crear';
  Object.assign(this.form, { title: 'Arepa', ingredientsText: 'harina', stepsText: 'amasar' });
  await this.saveRecipe(buildManualRecipe(this.form));
});

Then(/^sigo en "Crear receta" sin perder lo escrito$/, function (this: World) {
  assert.equal(this.screen, 'crear'); assert.equal(this.form.title, 'Arepa');
});

Given('que estoy en el detalle de una receta guardada', async function (this: World) {
  await this.seedItem({ name: 'Arroz' });
  await this.seedRecipe('Arroz con huevo', ['arroz', 'huevo']);
  this.screen = 'detalle';
});

When(/^toco "Ya la preparé" y confirmo$/, async function (this: World) {
  await recipes().markAsCooked(this.savedId);
  this.lastMessage = recipes().error ?? '¡Buen provecho!';
});

Then('no se me sugiere durante los próximos 7 días', async function (this: World) {
  await this.suggest();
  assert.ok(!recipes().suggestedRecipes.some((r) => r.recipe.title === this.recipeTitle));
});

When(/^toco eliminar y confirmo "¿Estás seguro de eliminar esta receta\?"$/, async function (this: World) {
  await recipes().deleteSavedRecipe(this.savedId);
  if (!recipes().error) this.screen = 'recetas';
});

Then('vuelvo a la lista y la receta ya no aparece', function (this: World) {
  assert.equal(this.screen, 'recetas');
  assert.ok(!recipes().savedRecipes.some((r) => r.id === this.savedId));
});

// ---------- Botones genéricos ----------
When(/^toco "([^"]*)"$/, async function (this: World, b: string) {
  switch (b) {
    case 'Guardar': return this.saveAdd();
    case 'Sugerir recetas': case 'Buscar sugerencias': return this.suggest();
    case 'Personalizar sugerencias': this.screen = 'recetas'; return;
    case 'Sugerir recetas con mi nevera': { // handleGenerate del Inicio
      const ing = fridge().items.filter((i) => i.status !== 'empty').map((i) => i.name);
      await recipes().fetchSavedRecipes(U);
      recipes().suggestRecipes(ing);
      this.screen = 'recetas';
      return;
    }
    case 'Validar y Guardar': return this.saveRecipe(parseRecipeJson(this.form.jsonText));
    case 'Guardar Receta': return this.saveRecipe(buildManualRecipe(this.form));
    case 'Deshacer': await budget().undoPurchase(budget().purchases[0]); await fridge().fetchItems(U); return;
    case 'Restaurar': await fridge().updateItem(item('Gaseosa').id, { archived: false }); return;
    default: throw new Error(`Botón sin implementar: ${b}`);
  }
});
