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
