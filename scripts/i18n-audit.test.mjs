import assert from 'node:assert/strict';
import test from 'node:test';
import { auditSourceTextMap, auditTranslationCatalog } from './i18n-audit-core.mjs';

test('nested resources report missing and empty translations', () => {
  const catalog = {
    es: { checkout: { title: 'Confirmar pedido', button: 'Pagar' } },
    en: { checkout: { title: 'Confirm order', button: '' } },
    pt: { checkout: { title: 'Confirmar pedido' } },
    fr: { checkout: { title: 'Confirmer la commande', button: 'Payer' } },
  };

  const result = auditTranslationCatalog(catalog);

  assert.deepEqual(result.missing, [{ locale: 'pt', key: 'checkout.button' }]);
  assert.deepEqual(result.empty, [{ locale: 'en', key: 'checkout.button' }]);
});

test('source-text maps detect unchanged human copy in non-Spanish locales', () => {
  const result = auditSourceTextMap({
    es: { 'Pedido cancelado correctamente.': 'Pedido cancelado correctamente.' },
    en: { 'Pedido cancelado correctamente.': 'Pedido cancelado correctamente.' },
    pt: { 'Pedido cancelado correctamente.': 'Pedido cancelado corretamente.' },
    fr: { 'Pedido cancelado correctamente.': 'Commande annulée.' },
  });

  assert.deepEqual(result.untranslated.map(({ locale }) => locale), ['en']);
});
