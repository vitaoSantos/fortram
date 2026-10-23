/**
 * Funções pequenas usadas em todas as versões.
 */

/**
 * Cria um elemento HTML com atributos e filhos.
 * Ex.: el('a', { href: '#contato', class: 'botao' }, 'Fale com a gente')
 * Textos entram como texto puro (nunca como HTML), então dados vindos da API não quebram a página.
 */
export function el(tag, atributos = {}, ...filhos) {
  const elemento = document.createElement(tag)
  for (const [nome, valor] of Object.entries(atributos)) {
    if (valor === false || valor == null) continue
    if (nome === 'class') elemento.className = valor
    else if (nome === 'style') elemento.style.cssText = valor
    else if (nome.startsWith('on')) elemento.addEventListener(nome.slice(2), valor)
    else elemento.setAttribute(nome, valor === true ? '' : valor)
  }
  for (const filho of filhos.flat()) {
    if (filho == null || filho === false) continue
    elemento.append(filho instanceof Node ? filho : document.createTextNode(String(filho)))
  }
  return elemento
}

/** "Agentes de IA" -> "agentes-de-ia" */
export function slug(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** "https://www.facilaqui.com/" -> "facilaqui.com" */
export function dominio(url) {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** true quando a pessoa pediu ao sistema para reduzir animações */
export function menosMovimento() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Número no formato brasileiro: 2500 -> "2.500" */
export function numero(valor) {
  return new Intl.NumberFormat('pt-BR').format(valor)
}

// Ícones de traço (24x24) usados pelos scripts
const ICONES = {
  seta: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  'seta-diagonal': '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
  fechar: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  anterior: '<path d="m15 18-6-6 6-6"/>',
  proximo: '<path d="m9 18 6-6-6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  mais: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  globo: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18"/>',
  cadeado: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  camadas: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  usuarios: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M22 20a7 7 0 0 0-4.5-6.5"/>',
  entrega: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  sacola: '<path d="M6 7h12l-1 13H7z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  formatura: '<path d="m22 10-10-5L2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
  saude: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/><path d="M3.5 12H9l1-2 2 4 2-6 1.5 4h5"/>',
  maleta: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
  ingresso: '<path d="M3 9V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3a3 3 0 0 0 0 6v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a3 3 0 0 0 0-6Z"/><path d="M14 5v2M14 11v2M14 17v2"/>',
  brilho: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/>',
}

/** Devolve um <svg> pronto para inserir na página */
export function icone(nome, classe = '') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')
  if (classe) svg.setAttribute('class', classe)
  svg.innerHTML = ICONES[nome] ?? ''
  return svg
}
