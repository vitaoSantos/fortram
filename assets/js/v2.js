/**
 * Versão 2: a jornada em 3D.
 * - As cenas 3D (Three.js) só carregam se o navegador tiver WebGL; sem ele, a jornada vira uma lista.
 * - Projetos: faixa horizontal que anda com a rolagem (como no portfólio) e janela com filtros.
 */
import { iniciarContato } from './comum/contato.js'
import { carregarModulos, carregarProjetos } from './comum/dados.js'
import { abrirProjeto, chipsModulos } from './comum/modal-projeto.js'
import { iniciarPagina } from './comum/pagina.js'
import { dominio, el, icone, menosMovimento } from './comum/util.js'
import { iniciarEsfera } from './v2/esfera-modulos.js'

iniciarPagina()
iniciarContato(document.querySelector('#formulario-contato'))

const limitar = (x, min = 0, max = 1) => Math.min(max, Math.max(min, x))
const movimentoReduzido = menosMovimento()
const secaoProcesso = document.querySelector('[data-processo]')
const etapas = [...secaoProcesso.querySelectorAll('[data-etapa]')]

function temWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/* ---------- Cenas 3D ---------- */

function semTresD() {
  secaoProcesso.classList.add('sem-3d')
  etapas.forEach((e) => e.style.removeProperty('--foco'))
}

if (temWebGL()) {
  const hero = document.querySelector('.hero')
  import('./v2/cena-hero.js')
    .then(({ iniciarCenaHero }) =>
      iniciarCenaHero(document.querySelector('[data-cena-hero]'), {
        menosMovimento: movimentoReduzido,
        aoFicarPronta: () => hero.classList.add('com-3d'),
      }),
    )
    .catch((erro) => console.warn('Cena 3D da abertura indisponível:', erro))

  import('./v2/cena-processo.js')
    .then(({ iniciarCenaProcesso }) =>
      iniciarCenaProcesso({
        canvas: document.querySelector('[data-cena-processo]'),
        secao: secaoProcesso,
        etapas,
        menosMovimento: movimentoReduzido,
      }),
    )
    .catch((erro) => {
      console.warn('Cena 3D da jornada indisponível:', erro)
      semTresD()
    })
} else {
  semTresD()
}

/* ---------- Cartões das etapas e índice lateral ---------- */

const linksIndice = [...document.querySelectorAll('[data-indice-etapas] a')]
let etapaPendente = false
function atualizarEtapas() {
  etapaPendente = false
  if (secaoProcesso.classList.contains('sem-3d')) return
  const t = -secaoProcesso.getBoundingClientRect().top / (etapas[0].offsetHeight || innerHeight)
  const atual = Math.round(limitar(t, 0, etapas.length - 1))
  etapas.forEach((etapa, i) => etapa.style.setProperty('--foco', limitar(1 - Math.abs(t - i) * 1.8).toFixed(3)))
  linksIndice.forEach((link, i) => {
    if (i === atual) link.setAttribute('aria-current', 'step')
    else link.removeAttribute('aria-current')
    link.classList.toggle('feita', i < atual)
  })
}
addEventListener(
  'scroll',
  () => {
    if (!etapaPendente) {
      etapaPendente = true
      requestAnimationFrame(atualizarEtapas)
    }
  },
  { passive: true },
)
atualizarEtapas()

/* ---------- Esfera de módulos ---------- */

const CORES_GRUPO = {
  base: '#dbe3ff',
  vendas: '#ff8fdc',
  comunicacao: '#9dbbff',
  gestao: '#7ff0b8',
  conteudo: '#ffd77a',
  ia: '#f5b3ff',
  segmentos: '#a3ecff',
}

async function montarEsfera() {
  const container = document.querySelector('[data-esfera-modulos]')
  const { grupos } = await carregarModulos()
  if (!container || !grupos?.length) return container?.remove()
  // até 8 módulos de cada grupo, intercalados para as cores se misturarem
  const porGrupo = grupos.map((g) => g.modulos.slice(0, 8).map((nome) => ({ nome, cor: CORES_GRUPO[g.id] ?? '#dbe3ff' })))
  const modulos = []
  for (let i = 0; i < 8; i++) for (const lista of porGrupo) if (lista[i]) modulos.push(lista[i])
  iniciarEsfera(container, modulos, {
    destaques: ['Pagamento', 'Chat', 'Agentes de IA', 'Notificações', 'Rede Social', 'CRM'],
    menosMovimento: movimentoReduzido,
  })
  container.querySelector('[data-esfera-lista]').textContent = `Alguns módulos do Nown: ${modulos.map((m) => m.nome).join(', ')}.`
}
montarEsfera()

/* ---------- Projetos ---------- */

/** Cartão grande da faixa horizontal (mesmo desenho dos destaques do portfólio) */
function cartaoDestaque(projeto, indice, lista) {
  return el(
    'li',
    { class: 'destaque' },
    el(
      'article',
      { class: 'destaque__cartao' },
      projeto.capa
        ? el('img', { src: projeto.capa, alt: `Tela do projeto ${projeto.nome}`, width: 1600, height: 1000, loading: 'lazy', decoding: 'async' })
        : el('div', { class: 'capa-reserva' }, projeto.nome),
      el(
        'div',
        { class: 'destaque__info' },
        el(
          'div',
          {},
          el('span', { class: 'mono' }, `${String(indice + 1).padStart(2, '0')} · ${projeto.segmento}`),
          el('h3', {}, el('button', { class: 'destaque__abrir', type: 'button', onclick: () => abrirProjeto(lista, indice) }, projeto.nome)),
          el('p', {}, projeto.resumo),
        ),
        el('span', { class: 'destaque__seta', 'aria-hidden': 'true' }, icone('seta-diagonal')),
      ),
    ),
  )
}

function cartaoVerTodos() {
  return el(
    'li',
    { class: 'destaque destaque--todos' },
    el('button', { type: 'button', 'data-abrir-todos': '' }, el('span', {}, el('i', {}, icone('seta-diagonal')), el('b', {}, 'Ver todos os projetos'))),
  )
}

/** No computador, a faixa anda para o lado enquanto a página rola para baixo */
function iniciarFaixaFixa(secao, trilho) {
  const barra = secao.querySelector('[data-barra]')
  const computador = matchMedia('(min-width: 1024px)')
  let distancia = 0
  function rolar() {
    if (!secao.classList.contains('destaques--fixo')) return
    const r = secao.getBoundingClientRect()
    const progresso = limitar(-r.top / Math.max(1, r.height - innerHeight))
    trilho.style.transform = `translate3d(${(-progresso * distancia).toFixed(1)}px, 0, 0)`
    barra.style.setProperty('--progresso', progresso.toFixed(4))
  }
  function medir() {
    const fixa = computador.matches && !movimentoReduzido
    secao.classList.toggle('destaques--fixo', fixa)
    if (!fixa) {
      secao.style.height = ''
      trilho.style.transform = ''
      return
    }
    distancia = Math.max(0, trilho.scrollWidth - innerWidth)
    secao.style.height = `${innerHeight + distancia}px`
    rolar()
  }
  addEventListener('scroll', rolar, { passive: true })
  addEventListener('resize', medir)
  computador.addEventListener('change', medir)
  medir()
}

/** Cartão da janela "Todos os projetos": inclina acompanhando o mouse */
function cartaoTodos(projeto, indice, lista) {
  const cartao = el(
    'article',
    { class: 'cartao-todos' },
    projeto.capa
      ? el('img', { src: projeto.capa_pequena ?? projeto.capa, alt: `Tela do projeto ${projeto.nome}`, width: 800, height: 500, loading: 'lazy', decoding: 'async' })
      : el('div', { class: 'capa-reserva' }, projeto.nome),
    el(
      'div',
      { class: 'cartao-todos__corpo' },
      el(
        'div',
        { class: 'cartao-todos__linha' },
        el('span', { class: 'mono' }, projeto.segmento),
        projeto.link && el('small', {}, dominio(projeto.link)),
      ),
      el('h3', {}, el('button', { class: 'cartao-todos__abrir', type: 'button', onclick: () => abrirProjeto(lista, indice) }, projeto.nome)),
      el('p', {}, projeto.resumo),
      chipsModulos(projeto, 4),
    ),
  )
  if (!movimentoReduzido && matchMedia('(pointer: fine)').matches) {
    cartao.addEventListener('pointermove', (e) => {
      const r = cartao.getBoundingClientRect()
      cartao.style.setProperty('--ry', `${(((e.clientX - r.left) / r.width - 0.5) * 8).toFixed(2)}deg`)
      cartao.style.setProperty('--rx', `${(-((e.clientY - r.top) / r.height - 0.5) * 8).toFixed(2)}deg`)
    })
    cartao.addEventListener('pointerleave', () => {
      cartao.style.setProperty('--ry', '0deg')
      cartao.style.setProperty('--rx', '0deg')
    })
  }
  return el('li', { style: `--i:${indice}` }, cartao)
}

/** Janela com todos os projetos e filtro por segmento */
function montarTodos(projetos) {
  const dialogo = document.querySelector('[data-todos]')
  const filtros = dialogo.querySelector('[data-filtros]')
  const grade = dialogo.querySelector('[data-grade-todos]')
  const segmentos = ['Todos', ...new Set(projetos.map((p) => p.segmento))]

  const mostrar = (segmento) => {
    const lista = segmento === 'Todos' ? projetos : projetos.filter((p) => p.segmento === segmento)
    grade.replaceChildren(...lista.map(cartaoTodos))
    for (const botao of filtros.children) botao.setAttribute('aria-pressed', String(botao.textContent === segmento))
  }
  filtros.replaceChildren(...segmentos.map((s) => el('button', { type: 'button', onclick: () => mostrar(s) }, s)))
  mostrar('Todos')

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-abrir-todos]')) {
      dialogo.showModal()
      document.documentElement.style.overflow = 'hidden'
    }
  })
  dialogo.querySelector('[data-fechar-todos]').addEventListener('click', () => dialogo.close())
  dialogo.addEventListener('click', (e) => {
    if (e.target === dialogo) dialogo.close()
  })
  dialogo.addEventListener('close', () => document.documentElement.style.removeProperty('overflow'))
}

/** Frase com um exemplo real de projeto montado com módulos */
function exemploModulos(projetos) {
  const exemplo = document.querySelector('[data-exemplo-modulos]')
  const projeto = projetos.find((p) => p.modulo_principal && p.modulos?.length > 4)
  if (!exemplo || !projeto) return
  const primeiros = projeto.modulos.slice(0, 4)
  exemplo.replaceChildren(
    'O ',
    el('b', {}, projeto.nome),
    `, por exemplo, é um módulo próprio somado a ${primeiros.join(', ')} e mais ${projeto.modulos.length - primeiros.length} módulos do Nown.`,
  )
  exemplo.hidden = false
}

const { mostrar, projetos } = await carregarProjetos()
const secaoProjetos = document.querySelector('[data-secao-projetos]')
if (mostrar) {
  const trilho = secaoProjetos.querySelector('[data-trilho]')
  const destaques = projetos.filter((p) => p.destaque !== false)
  trilho.replaceChildren(...(destaques.length ? destaques : projetos).map(cartaoDestaque), cartaoVerTodos())
  iniciarFaixaFixa(secaoProjetos, trilho)
  montarTodos(projetos)
  exemploModulos(projetos)
} else {
  secaoProjetos.remove()
  for (const link of document.querySelectorAll('a[href="#projetos"]')) (link.closest('li') ?? link).remove()
}
