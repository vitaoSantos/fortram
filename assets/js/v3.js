/**
 * Versão 3: híbrida.
 * - Pilha de telas da abertura inclina com o mouse (o 3D é só CSS)
 * - Faixas com nomes de módulos, processo com prévia que acompanha a rolagem
 * - "Monte seu projeto": mostra os módulos do Nown que já entram prontos em cada tipo de projeto
 */
import { iniciarContato, preencherContato } from './comum/contato.js'
import { carregarModulos, carregarProjetos } from './comum/dados.js'
import { abrirProjeto, capaProjeto, chipsModulos } from './comum/modal-projeto.js'
import { iniciarPagina, iniciarRevelar } from './comum/pagina.js'
import { el, menosMovimento } from './comum/util.js'

iniciarPagina()
iniciarContato(document.querySelector('#formulario-contato'))

/* ---------- Pilha de telas: segue o mouse ---------- */

const pilha = document.querySelector('[data-pilha]')
if (pilha && !menosMovimento() && matchMedia('(pointer: fine)').matches) {
  const hero = pilha.closest('.hero')
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    pilha.style.setProperty('--rx', `${(56 - y * 10).toFixed(1)}deg`)
    pilha.style.setProperty('--rz', `${(-38 + x * 12).toFixed(1)}deg`)
  })
  hero.addEventListener('pointerleave', () => {
    pilha.style.removeProperty('--rx')
    pilha.style.removeProperty('--rz')
  })
}

/* ---------- Faixas com os nomes dos módulos ---------- */

function chipModulo(nome, grupo) {
  return el('span', { class: `chip-modulo tom-${grupo}` }, el('i', { 'aria-hidden': 'true' }, nome[0].toUpperCase()), nome)
}

async function montarFaixas() {
  const { grupos } = await carregarModulos()
  const linhas = [...document.querySelectorAll('[data-faixa-modulos]')]
  if (!grupos?.length || !linhas.length) return
  const metade = Math.ceil(grupos.length / 2)
  ;[grupos.slice(0, metade), grupos.slice(metade)].forEach((parte, i) => {
    const chips = parte.flatMap((g) => g.modulos.slice(0, 12).map((nome) => [nome, g.id]))
    // o conteúdo aparece duas vezes para a faixa girar sem emenda
    const trilho = el(
      'div',
      { class: 'modulos-faixa__trilho' },
      chips.map(([nome, grupo]) => chipModulo(nome, grupo)),
      chips.map(([nome, grupo]) => {
        const copia = chipModulo(nome, grupo)
        copia.setAttribute('aria-hidden', 'true')
        return copia
      }),
    )
    linhas[i]?.replaceChildren(trilho)
  })
}
montarFaixas()

/* ---------- Processo: a prévia acompanha o passo que está no meio da tela ---------- */

function iniciarProcesso() {
  const passos = [...document.querySelectorAll('[data-passo]')]
  const telas = [...document.querySelectorAll('[data-tela]')]
  const titulo = document.querySelector('[data-tela-titulo]')
  const lista = document.querySelector('.processo__lista')
  if (!passos.length || passos.length !== telas.length) return
  let atual = -1

  function ativar(indice) {
    if (indice === atual) return
    atual = indice
    passos.forEach((p, i) => p.classList.toggle('ativo', i === indice))
    telas.forEach((t, i) => (t.hidden = i !== indice))
    titulo.textContent = passos[indice].querySelector('h3').textContent
    lista.style.setProperty('--progresso', passos.length > 1 ? indice / (passos.length - 1) : 1)
  }

  // a faixa central da tela decide qual passo está ativo
  const observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) if (entrada.isIntersecting) ativar(passos.indexOf(entrada.target))
    },
    { rootMargin: '-45% 0px -50% 0px' },
  )
  passos.forEach((p) => observador.observe(p))
  ativar(0)
}
iniciarProcesso()

/* ---------- Monte seu projeto ---------- */

// Tipo de projeto (modelo) -> opção do campo "O que você quer construir?" do formulário
const TIPO_NO_FORMULARIO = { loja: 'Loja virtual', ia: 'Integrações e IA' }

async function montarConfigurador() {
  const { modelos, base, total } = await carregarModulos()
  const tipos = document.querySelector('[data-tipos]')
  const lista = document.querySelector('[data-modulos-escolhidos]')
  if (!modelos?.length || !tipos || !lista) return
  const contagem = document.querySelector('[data-contagem]')
  const descricao = document.querySelector('[data-descricao]')
  let escolhido = modelos[0]

  function mostrar(modelo) {
    escolhido = modelo
    for (const botao of tipos.children) botao.setAttribute('aria-checked', String(botao.dataset.id === modelo.id))
    const doTipo = modelo.modulos
    const daBase = base.filter((m) => !doTipo.includes(m))
    lista.replaceChildren(
      ...doTipo.map((nome, i) => el('li', { class: 'do-tipo', style: `--i:${i}` }, el('i', { 'aria-hidden': 'true' }, nome[0].toUpperCase()), nome)),
      ...daBase.map((nome, i) => el('li', { style: `--i:${doTipo.length + i}` }, el('i', { 'aria-hidden': 'true' }, nome[0].toUpperCase()), nome)),
    )
    contagem.textContent = doTipo.length + daBase.length
    descricao.textContent = `${modelo.descricao} Esses módulos já existem no Nown; o seu projeto ganha só o que é exclusivo do seu negócio, entre os ${total} disponíveis.`
  }

  tipos.replaceChildren(
    ...modelos.map((modelo) =>
      el('button', { type: 'button', role: 'radio', 'data-id': modelo.id, onclick: () => mostrar(modelo) }, modelo.nome),
    ),
  )
  // setas do teclado trocam a opção, como num grupo de rádio
  tipos.addEventListener('keydown', (e) => {
    const passo = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!passo) return
    e.preventDefault()
    const indice = (modelos.indexOf(escolhido) + passo + modelos.length) % modelos.length
    mostrar(modelos[indice])
    tipos.children[indice].focus()
  })

  document.querySelector('[data-quero]').addEventListener('click', () =>
    preencherContato({
      tipo: TIPO_NO_FORMULARIO[escolhido.id] ?? 'Sistema web ou plataforma',
      mensagem: `Quero um projeto do tipo "${escolhido.nome}". Módulos que me interessam: ${escolhido.modulos.join(', ')}.`,
    }),
  )
  mostrar(escolhido)
}
montarConfigurador()

/* ---------- Projetos em grade bento ---------- */

function cartaoBento(projeto, indice, lista) {
  return el(
    'li',
    { 'data-revelar': '', style: `--atraso:${(indice % 3) * 0.08}s` },
    el(
      'article',
      { class: 'bento-cartao' },
      capaProjeto(projeto, { pequena: indice > 0 }),
      el(
        'div',
        { class: 'bento-cartao__corpo' },
        el('p', { class: 'bento-cartao__segmento' }, projeto.segmento),
        el('h3', {}, el('button', { class: 'bento-cartao__abrir', type: 'button', onclick: () => abrirProjeto(lista, indice) }, projeto.nome)),
        el('p', {}, projeto.resumo),
        indice === 0 &&
          projeto.destaques?.length > 0 &&
          el('ul', { class: 'bento-cartao__destaques' }, projeto.destaques.slice(0, 4).map((d) => el('li', {}, d))),
        chipsModulos(projeto, indice === 0 ? 6 : 3),
      ),
    ),
  )
}

const { mostrar, projetos } = await carregarProjetos()
if (mostrar) {
  const grade = document.querySelector('[data-lista-projetos]')
  grade.replaceChildren(...projetos.map(cartaoBento))
  iniciarRevelar(grade)
} else {
  document.querySelector('[data-secao-projetos]')?.remove()
  for (const link of document.querySelectorAll('a[href="#projetos"]')) (link.closest('li') ?? link).remove()
}
