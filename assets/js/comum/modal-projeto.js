import { dominio, el, icone } from './util.js'

/**
 * Janela com os detalhes de um projeto, usada pelas três versões.
 * Usa o <dialog> nativo do navegador: Esc fecha, o foco fica preso dentro e volta ao botão de origem.
 */

let dialogo
let lista = []
let atual = 0

function montar() {
  dialogo = el('dialog', { class: 'modal-projeto', 'aria-labelledby': 'modal-projeto-titulo' })
  // Clique no fundo escuro fecha
  dialogo.addEventListener('click', (evento) => {
    if (evento.target === dialogo) dialogo.close()
  })
  dialogo.addEventListener('keydown', (evento) => {
    if (evento.key === 'ArrowRight') mostrar(atual + 1)
    if (evento.key === 'ArrowLeft') mostrar(atual - 1)
  })
  // só libera a rolagem da página se não houver outra janela aberta por baixo
  dialogo.addEventListener('close', () => {
    if (!document.querySelector('dialog[open]')) document.documentElement.style.removeProperty('overflow')
  })
  document.body.append(dialogo)
}

/** Moldura de navegador com a tela do projeto (ou uma capa com o nome, se não houver imagem) */
export function capaProjeto(projeto, { pequena = false, carregar = 'lazy' } = {}) {
  if (!projeto.capa) return el('div', { class: 'capa-reserva' }, projeto.nome)
  const imagem = pequena ? projeto.capa_pequena ?? projeto.capa : projeto.capa
  return el(
    'div',
    { class: 'navegador' },
    el(
      'div',
      { class: 'navegador__barra', 'aria-hidden': 'true' },
      el('i'),
      el('i'),
      el('i'),
      el('span', { class: 'navegador__endereco' }, projeto.link ? dominio(projeto.link) : projeto.nome),
    ),
    el('img', {
      src: imagem,
      alt: `Tela inicial do projeto ${projeto.nome}`,
      width: pequena ? 800 : 1600,
      height: pequena ? 500 : 1000,
      loading: carregar,
      decoding: 'async',
    }),
  )
}

/** Lista de chips com o módulo principal em destaque e os módulos do Nown usados no projeto */
export function chipsModulos(projeto, limite = Infinity) {
  const modulos = projeto.modulos ?? []
  const visiveis = modulos.slice(0, limite)
  return el(
    'ul',
    { class: 'chips', 'aria-label': 'Módulos do Nown' },
    projeto.modulo_principal && el('li', { class: 'chip chip--principal', title: 'Módulo criado para este projeto' }, projeto.modulo_principal),
    visiveis.map((m) => el('li', { class: 'chip' }, m)),
    modulos.length > visiveis.length && el('li', { class: 'chip' }, `+${modulos.length - visiveis.length}`),
  )
}

function mostrar(indice) {
  // o conteúdo é recriado: guarda qual botão de navegação tinha o foco para devolvê-lo depois
  const botoesNavegacao = [...dialogo.querySelectorAll('.modal-projeto__navegacao button')]
  const focoNaNavegacao = botoesNavegacao.indexOf(document.activeElement)
  atual = (indice + lista.length) % lista.length
  const p = lista[atual]
  const multiplos = lista.length > 1

  const corpo = el(
    'div',
    { class: 'modal-projeto__corpo' },
    el(
      'header',
      {},
      el('p', { class: 'modal-projeto__segmento' }, p.segmento),
      el('h2', { id: 'modal-projeto-titulo' }, p.nome),
      el('p', { class: 'modal-projeto__resumo' }, p.resumo),
      p.link &&
        el(
          'div',
          { class: 'modal-projeto__acoes' },
          el('a', { class: 'botao botao--primario', href: p.link, target: '_blank', rel: 'noopener' }, 'Visitar o projeto', icone('seta-diagonal')),
        ),
    ),
    el(
      'div',
      { class: 'modal-projeto__grade' },
      el('section', {}, el('h3', {}, 'Sobre o projeto'), el('p', { class: 'modal-projeto__sobre' }, p.sobre)),
      el(
        'section',
        {},
        el('h3', {}, 'Destaques'),
        el('ul', { class: 'modal-projeto__destaques' }, (p.destaques ?? []).map((d) => el('li', {}, d))),
      ),
    ),
    (p.modulos ?? []).length > 0 &&
      el('section', { class: 'modal-projeto__modulos' }, el('h3', {}, 'Construído sobre o Nown com estes módulos'), chipsModulos(p)),
    multiplos &&
      el(
        'nav',
        { class: 'modal-projeto__navegacao', 'aria-label': 'Outros projetos' },
        el('button', { type: 'button', onclick: () => mostrar(atual - 1) }, icone('anterior'), lista[(atual - 1 + lista.length) % lista.length].nome),
        el('button', { type: 'button', onclick: () => mostrar(atual + 1) }, lista[(atual + 1) % lista.length].nome, icone('proximo')),
      ),
  )

  dialogo.replaceChildren(
    el('button', { class: 'modal-projeto__fechar', type: 'button', 'aria-label': 'Fechar', onclick: () => dialogo.close() }, icone('fechar')),
    el('div', { class: 'modal-projeto__rolagem' }, el('div', { class: 'modal-projeto__capa' }, capaProjeto(p, { carregar: 'eager' })), corpo),
  )
  dialogo.querySelector('.modal-projeto__rolagem').scrollTop = 0
  if (dialogo.open && !dialogo.contains(document.activeElement)) {
    const botao = dialogo.querySelectorAll('.modal-projeto__navegacao button')[focoNaNavegacao]
    ;(botao ?? dialogo.querySelector('.modal-projeto__fechar')).focus()
  }
}

/**
 * Abre a janela no projeto escolhido.
 * @param {Array} projetos lista completa (permite navegar entre eles)
 * @param {number} indice posição do projeto clicado
 */
export function abrirProjeto(projetos, indice) {
  if (!dialogo) montar()
  lista = projetos
  mostrar(indice)
  document.documentElement.style.overflow = 'hidden'
  dialogo.showModal()
  dialogo.querySelector('.modal-projeto__fechar').focus()
}
