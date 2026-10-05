/**
 * Il nome colore come ultimo segmento del titolo prodotto, dopo l'ultimo " - ".
 * Pattern diffusissimo: "MODELLO - Categoria - nome colore".
 * Fornisce il nome, mai il colore.
 */
export function parse(doc) {
  const titolo = doc.querySelector('[data-product-title]')?.textContent?.trim();
  if (!titolo || !titolo.includes(' - ')) return [];
  const nome = titolo.split(' - ').pop().trim();
  return nome ? [{ nome, hex: null, imageUrl: null }] : [];
}
