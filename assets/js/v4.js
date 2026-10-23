/**
 * Versão 4: institucional.
 * - Menu "Soluções" com submenu, janela de contato e janela com os módulos do Nown (com busca)
 * - Projetos em cartões (os 3 primeiros + "Ver todos"), faixa com os nomes e lista no rodapé
 * - Carrossel "Pontos de partida para o seu segmento", montado a partir de data/modulos.json
 */
import { CONFIG } from './comum/config.js'
import { iniciarContato, linkWhatsapp, preencherFormulario } from './comum/contato.js'
import { carregarModulos, carregarProjetos } from './comum/dados.js'
import { abrirProjeto } from './comum/modal-projeto.js'
import { iniciarPagina, iniciarRevelar } from './comum/pagina.js'
import { dominio, el, icone, menosMovimento } from './comum/util.js'

iniciarPagina()
const formulario = document.querySelector('#formulario-contato')
iniciarContato(formulario)

/** Texto sem acentos e em minúsculas, para a busca de módulos */
const normalizar = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** ["a", "b", "c"] -> "a, b e c" */
const juntar = (itens) => (itens.length < 2 ? itens.join('') : `${itens.slice(0, -1).join(', ')} e ${itens.at(-1)}`)

/* ---------- Submenu "Soluções" ---------- */

for (const botao of document.querySelectorAll('.topo__submenu-botao')) {
  const item = botao.closest('.topo__item-menu')
  const alternar = (abrir) => botao.setAttribute('aria-expanded', String(abrir))
  botao.addEventListener('click', () => alternar(botao.getAttribute('aria-expanded') !== 'true'))
  // fecha ao sair com o Tab, ao apertar Esc, ao clicar fora ou ao escolher um item
  item.addEventListener('focusout', (e) => {
    if (!item.contains(e.relatedTarget)) alternar(false)
  })
  item.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return
    alternar(false)
    botao.focus()
  })
  document.addEventListener('click', (e) => {
    if (!item.contains(e.target)) alternar(false)
  })
  item.querySelector('.topo__submenu').addEventListener('click', (e) => {
    if (!e.target.closest('a')) return
    alternar(false)
    // o mouse ainda está em cima do menu: segura o submenu fechado até ele sair
    item.classList.add('fechado')
    item.addEventListener('mouseleave', () => item.classList.remove('fechado'), { once: true })
  })
}

/* ---------- Janelas: contato e módulos ---------- */

function abrirJanela(janela) {
  if (!janela.open) janela.showModal()
  document.documentElement.style.overflow = 'hidden'
}

for (const janela of document.querySelectorAll('dialog.janela')) {
  // clique no fundo escuro fecha (Esc já fecha sozinho)
  janela.addEventListener('click', (e) => {
    if (e.target === janela) janela.close()
  })
  janela.querySelector('[data-fechar]').addEventListener('click', () => janela.close())
  // só libera a rolagem da página se não houver outra janela aberta
  janela.addEventListener('close', () => {
    if (!document.querySelector('dialog[open]')) document.documentElement.style.removeProperty('overflow')
  })
}

const janelaContato = document.querySelector('#contato')
const janelaModulos = document.querySelector('#modulos')

/** Abre a janela de contato, já com o tipo de projeto e a mensagem preenchidos (quando vierem) */
function abrirContato(dados = {}) {
  preencherFormulario(formulario, dados)
  if (janelaModulos.open) janelaModulos.close()
  abrirJanela(janelaContato)
  formulario.elements.nome.focus()
}

// "Falar com um especialista" vai direto para o WhatsApp quando houver número configurado
const whatsapp = linkWhatsapp()
if (whatsapp) {
  for (const link of document.querySelectorAll('[data-preferir-whatsapp]')) {
    link.href = whatsapp
    link.target = '_blank'
    link.rel = 'noopener'
    link.removeAttribute('data-abrir-contato')
  }
}

document.addEventListener('click', (e) => {
  const contato = e.target.closest('[data-abrir-contato]')
  if (contato) {
    e.preventDefault()
    abrirContato({ tipo: contato.dataset.tipo, mensagem: contato.dataset.mensagem })
    return
  }
  if (e.target.closest('[data-abrir-modulos]')) {
    abrirJanela(janelaModulos)
    janelaModulos.querySelector('[data-busca-modulos]').focus()
  }
})

// endereço com #contato (por exemplo, um link compartilhado) já abre a janela
if (location.hash === '#contato') abrirContato()

/* ---------- Módulos do Nown (janela com busca) ---------- */

async function montarModulos() {
  const { grupos } = await carregarModulos()
  const lista = janelaModulos.querySelector('[data-lista-modulos]')
  const busca = janelaModulos.querySelector('[data-busca-modulos]')
  const contagem = janelaModulos.querySelector('[data-contagem-modulos]')
  const vazio = janelaModulos.querySelector('[data-sem-modulos]')

  const secoes = grupos.map((grupo) => {
    const chips = grupo.modulos.map((nome) => el('li', { 'data-busca': normalizar(nome) }, nome))
    return { chips, secao: el('section', { class: 'modulos__grupo' }, el('h3', {}, grupo.nome), el('ul', { class: 'modulos__chips' }, chips)) }
  })
  lista.replaceChildren(...secoes.map((s) => s.secao))

  function filtrar() {
    const termo = normalizar(busca.value.trim())
    let encontrados = 0
    for (const { secao, chips } of secoes) {
      let visiveis = 0
      for (const chip of chips) {
        chip.hidden = termo !== '' && !chip.dataset.busca.includes(termo)
        if (!chip.hidden) visiveis++
      }
      secao.hidden = visiveis === 0
      encontrados += visiveis
    }
    contagem.textContent = termo
      ? `${encontrados} ${encontrados === 1 ? 'módulo encontrado' : 'módulos encontrados'}`
      : `${encontrados} módulos nesta lista`
    vazio.hidden = encontrados > 0
  }
  busca.addEventListener('input', filtrar)
  filtrar()
}
montarModulos()

/* ---------- Projetos ---------- */

const PROJETOS_VISIVEIS = 3

/** "Uma cidade inteira em *um só app*": o trecho entre asteriscos ganha destaque em magenta */
function comRealce(texto) {
  return texto.split('*').map((parte, i) => (i % 2 ? el('span', { class: 'realce' }, parte) : parte))
}

function cartaoProjeto(projeto, indice, lista) {
  return el(
    'li',
    { class: 'cartao-projeto', 'data-revelar': '', hidden: indice >= PROJETOS_VISIVEIS, style: `--atraso:${(indice % 3) * 0.08}s` },
    el('h3', {}, comRealce(projeto.chamada || projeto.nome)),
    el('p', { class: 'cartao-projeto__texto' }, projeto.sobre || projeto.resumo),
    el(
      'div',
      { class: 'cartao-projeto__rodape' },
      el(
        'div',
        {},
        el('button', { class: 'cartao-projeto__abrir', type: 'button', onclick: () => abrirProjeto(lista, indice) }, projeto.nome),
        el('p', {}, [projeto.segmento, projeto.link && dominio(projeto.link)].filter(Boolean).join(' · ')),
      ),
      el('span', { class: 'cartao-projeto__ver', 'aria-hidden': 'true' }, 'Ver detalhes', icone('seta')),
    ),
  )
}

function montarProjetos({ mostrar, projetos }) {
  const secao = document.querySelector('[data-secao-projetos]')
  if (!mostrar) {
    // sem projetos para mostrar: some a seção, os links do menu e a faixa do rodapé
    secao.remove()
    document.querySelector('.rodape__projetos')?.remove()
    for (const link of document.querySelectorAll('a[href="#projetos"]')) (link.closest('li') ?? link).remove()
    return
  }

  const grade = secao.querySelector('[data-lista-projetos]')
  grade.replaceChildren(...projetos.map(cartaoProjeto))
  iniciarRevelar(grade)

  // "✓✓✓✓✓✓ 6 plataformas no ar" e os segmentos, no lugar da nota de avaliações da referência
  const segmentos = [...new Set(projetos.map((p) => p.segmento.toLowerCase()))]
  const resumo = secao.querySelector('[data-resumo-projetos]')
  resumo.replaceChildren(
    el(
      'b',
      {},
      el('span', { class: 'projetos__marcas', 'aria-hidden': 'true' }, projetos.map(() => el('i'))),
      `${projetos.length} ${projetos.length === 1 ? 'plataforma' : 'plataformas'} no ar`,
    ),
    el('span', {}, `De ${juntar(segmentos)}, todas sobre o Nown`),
  )
  resumo.hidden = false

  // "Ver todos os projetos": só aparece se houver mais projetos que os visíveis
  const botao = secao.querySelector('[data-ver-todos]')
  if (projetos.length > PROJETOS_VISIVEIS) {
    botao.hidden = false
    botao.addEventListener('click', () => {
      const abrir = botao.getAttribute('aria-expanded') !== 'true'
      ;[...grade.children].forEach((cartao, i) => {
        if (i >= PROJETOS_VISIVEIS) cartao.hidden = !abrir
      })
      botao.setAttribute('aria-expanded', String(abrir))
      botao.textContent = abrir ? 'Mostrar menos' : 'Ver todos os projetos'
    })
  }

  // faixa com os nomes (repetida para girar sem emenda) e lista do rodapé
  const nomes = projetos.map((p) => p.nome)
  secao.querySelector('[data-faixa-nomes]').replaceChildren(...[...nomes, ...nomes].map((nome) => el('span', {}, nome)))
  document.querySelector('[data-rodape-projetos]')?.replaceChildren(...nomes.map((nome) => el('li', {}, nome)))
}
carregarProjetos().then(montarProjetos)

/* ---------- Pontos de partida por segmento (carrossel) ---------- */

// Ícone de cada tipo de projeto (o "id" dos modelos em data/modulos.json)
const ICONES_SEGMENTO = {
  'rede-social': 'usuarios',
  delivery: 'entrega',
  loja: 'sacola',
  educacao: 'formatura',
  saude: 'saude',
  gestao: 'maleta',
  eventos: 'ingresso',
  ia: 'brilho',
}

// Tipo de projeto -> opção do campo "O que você quer construir?" do formulário
const TIPO_NO_FORMULARIO = { loja: 'Loja virtual', ia: 'Integrações e IA' }

function cartaoSegmento(modelo, indice) {
  return el(
    'li',
    { class: `segmento segmento--tema-${indice % 3}` },
    el(
      'div',
      { class: 'segmento__capa', 'aria-hidden': 'true' },
      icone(ICONES_SEGMENTO[modelo.id] ?? 'camadas', 'segmento__icone'),
      el('ul', { class: 'segmento__chips' }, modelo.modulos.slice(0, 3).map((nome) => el('li', {}, nome))),
    ),
    el(
      'div',
      { class: 'segmento__corpo' },
      el('p', { class: 'segmento__contagem' }, `${modelo.modulos.length} módulos prontos`),
      el('h3', {}, modelo.nome),
      el('p', {}, modelo.descricao),
      el(
        'a',
        {
          class: 'segmento__acao',
          href: '#contato',
          'aria-label': `Quero um projeto assim: ${modelo.nome}`,
          'data-abrir-contato': '',
          'data-tipo': TIPO_NO_FORMULARIO[modelo.id] ?? 'Sistema web ou plataforma',
          'data-mensagem': `Quero um projeto do tipo "${modelo.nome}". Módulos que me interessam: ${modelo.modulos.join(', ')}.`,
        },
        'Quero um projeto assim',
        icone('seta'),
      ),
    ),
  )
}

async function montarSegmentos() {
  const secao = document.querySelector('[data-secao-segmentos]')
  const { modelos } = await carregarModulos()
  if (!modelos?.length) {
    secao.remove()
    return
  }
  const trilho = secao.querySelector('[data-segmentos]')
  trilho.replaceChildren(...modelos.map(cartaoSegmento))

  const anterior = secao.querySelector('[data-carrossel-anterior]')
  const proximo = secao.querySelector('[data-carrossel-proximo]')
  // anda um cartão por clique
  const passo = () => trilho.firstElementChild.getBoundingClientRect().width + parseFloat(getComputedStyle(trilho).columnGap)
  const rolar = (sentido) => trilho.scrollBy({ left: sentido * passo(), behavior: menosMovimento() ? 'auto' : 'smooth' })
  anterior.addEventListener('click', () => rolar(-1))
  proximo.addEventListener('click', () => rolar(1))

  const atualizar = () => {
    anterior.disabled = trilho.scrollLeft <= 2
    proximo.disabled = trilho.scrollLeft + trilho.clientWidth >= trilho.scrollWidth - 2
  }
  trilho.addEventListener('scroll', atualizar, { passive: true })
  addEventListener('resize', atualizar)
  atualizar()
}
montarSegmentos()

/* ---------- Redes sociais no rodapé (endereços em assets/js/comum/config.js) ---------- */

const REDES = {
  instagram: ['Instagram', '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>'],
  linkedin: ['LinkedIn', '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>'],
  facebook: ['Facebook', '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'],
  youtube: ['YouTube', '<path d="M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>'],
}

function montarRedes() {
  const lista = document.querySelector('[data-redes]')
  const itens = Object.entries(CONFIG.redes ?? {}).filter(([rede, endereco]) => endereco && REDES[rede])
  if (!lista || itens.length === 0) return
  lista.replaceChildren(
    ...itens.map(([rede, endereco]) => {
      const [nome, desenho] = REDES[rede]
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('viewBox', '0 0 24 24')
      svg.setAttribute('class', 'i')
      svg.setAttribute('aria-hidden', 'true')
      svg.innerHTML = desenho
      return el('li', {}, el('a', { href: endereco, target: '_blank', rel: 'noopener', 'aria-label': nome }, svg))
    }),
  )
  lista.hidden = false
}
montarRedes()

/* ---------- Voltar ao topo ---------- */

const voltar = document.querySelector('[data-voltar-topo]')
const mostrarVoltar = () => voltar.classList.toggle('visivel', scrollY > innerHeight)
addEventListener('scroll', mostrarVoltar, { passive: true })
mostrarVoltar()
voltar.addEventListener('click', () => {
  scrollTo({ top: 0 })
  document.querySelector('.topo__logo').focus({ preventScroll: true })
})
