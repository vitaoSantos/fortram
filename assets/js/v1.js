/**
 * Versão 1: corporativa.
 * Monta os cartões de projetos, a faixa com os nomes e a seção "Um projeto, vários módulos".
 */
import { iniciarContato } from './comum/contato.js'
import { carregarProjetos } from './comum/dados.js'
import { abrirProjeto, capaProjeto, chipsModulos } from './comum/modal-projeto.js'
import { iniciarPagina, iniciarRevelar } from './comum/pagina.js'
import { el, icone } from './comum/util.js'

iniciarPagina()
iniciarContato(document.querySelector('#formulario-contato'))

/** Cartão de projeto: a página inteira do cartão abre a janela de detalhes */
function cartaoProjeto(projeto, indice, lista) {
  return el(
    'li',
    { class: 'cartao-projeto', 'data-revelar': '', style: `--atraso:${(indice % 3) * 0.08}s` },
    el('div', { class: 'cartao-projeto__capa' }, capaProjeto(projeto, { pequena: true })),
    el(
      'div',
      { class: 'cartao-projeto__corpo' },
      el('p', { class: 'cartao-projeto__segmento' }, projeto.segmento),
      el(
        'h3',
        {},
        el('button', { class: 'cartao-projeto__abrir', type: 'button', onclick: () => abrirProjeto(lista, indice) }, projeto.nome),
      ),
      el('p', { class: 'cartao-projeto__resumo' }, projeto.resumo),
      chipsModulos(projeto, 3),
      el('span', { class: 'cartao-projeto__ver', 'aria-hidden': 'true' }, 'Ver detalhes', icone('seta')),
    ),
  )
}

/** Faixa logo abaixo da abertura: nome de cada projeto abre os detalhes */
function montarFaixa(projetos) {
  const lista = document.querySelector('[data-nomes-projetos]')
  if (!lista) return
  lista.replaceChildren(
    ...projetos.map((p, i) => el('li', {}, el('button', { type: 'button', onclick: () => abrirProjeto(projetos, i) }, p.nome))),
  )
}

/** Abas com a composição de cada projeto: módulo próprio + módulos do Nown */
function montarComposicao(projetos) {
  const area = document.querySelector('[data-composicao]')
  const comModulos = projetos.filter((p) => p.modulos?.length)
  if (!area || comModulos.length === 0) return

  const abas = area.querySelector('[data-composicao-abas]')
  const painel = area.querySelector('[data-composicao-painel]')
  painel.id = 'composicao-painel'

  const botoes = comModulos.map((p, i) =>
    el(
      'button',
      { type: 'button', role: 'tab', id: `aba-${p.slug}`, 'aria-controls': painel.id, onclick: () => escolher(i) },
      p.nome,
    ),
  )
  abas.replaceChildren(...botoes)

  function escolher(indice) {
    botoes.forEach((b, i) => {
      b.setAttribute('aria-selected', String(i === indice))
      b.tabIndex = i === indice ? 0 : -1
    })
    const p = comModulos[indice]
    painel.setAttribute('aria-labelledby', botoes[indice].id)
    painel.replaceChildren(
      el('div', { class: 'composicao__projeto' }, capaProjeto(p, { pequena: true }), el('h4', {}, p.nome), el('p', {}, p.resumo)),
      el(
        'div',
        { class: 'composicao__soma' },
        p.modulo_principal && el('span', { class: 'chip chip--principal', style: '--i:0' }, p.modulo_principal),
        p.modulo_principal && el('span', { class: 'composicao__mais', 'aria-hidden': 'true' }, '+'),
        p.modulos.map((m, i) => el('span', { class: 'chip', style: `--i:${i + 1}` }, m)),
        el(
          'p',
          { class: 'composicao__total' },
          p.modulo_principal ? el('b', {}, '1 módulo criado para o cliente') : null,
          p.modulo_principal ? ' + ' : '',
          el('b', {}, `${p.modulos.length} módulos`),
          ' que já existiam no Nown.',
        ),
      ),
    )
  }

  // Setas do teclado trocam de aba, como em qualquer lista de abas
  abas.addEventListener('keydown', (evento) => {
    const atual = botoes.indexOf(document.activeElement)
    if (atual < 0) return
    const passo = { ArrowRight: 1, ArrowLeft: -1 }[evento.key]
    if (!passo) return
    const proximo = (atual + passo + botoes.length) % botoes.length
    escolher(proximo)
    botoes[proximo].focus()
  })

  escolher(0)
  area.hidden = false
  iniciarRevelar(area)
}

const { mostrar, projetos } = await carregarProjetos()

if (mostrar) {
  const grade = document.querySelector('[data-lista-projetos]')
  grade.replaceChildren(...projetos.map(cartaoProjeto))
  iniciarRevelar(grade)
  montarFaixa(projetos)
  montarComposicao(projetos)
} else {
  // Sem projetos para mostrar: some a seção, a faixa e os links do menu
  document.querySelector('[data-secao-projetos]')?.remove()
  document.querySelector('.faixa')?.remove()
  for (const link of document.querySelectorAll('a[href="#projetos"]')) (link.closest('li') ?? link).remove()
}
