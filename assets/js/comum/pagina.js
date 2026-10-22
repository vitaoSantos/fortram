import { linkWhatsapp } from './contato.js'
import { carregarModulos } from './dados.js'
import { menosMovimento, numero } from './util.js'

/** Topo fixo: ganha fundo quando a página rola */
function iniciarTopo() {
  const topo = document.querySelector('.topo')
  if (!topo) return
  const atualizar = () => topo.classList.toggle('topo--rolado', scrollY > 12)
  atualizar()
  addEventListener('scroll', atualizar, { passive: true })
}

/** Menu do celular: abre/fecha pelo botão, fecha ao escolher um item ou apertar Esc */
function iniciarMenuCelular() {
  const botao = document.querySelector('.topo__abrir-menu')
  const menu = document.querySelector('#menu-celular')
  if (!botao || !menu) return
  const alternar = (abrir) => {
    menu.classList.toggle('aberto', abrir)
    botao.setAttribute('aria-expanded', String(abrir))
    botao.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu')
  }
  botao.addEventListener('click', () => alternar(!menu.classList.contains('aberto')))
  menu.addEventListener('click', (evento) => {
    if (evento.target.closest('a')) alternar(false)
  })
  addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && menu.classList.contains('aberto')) {
      alternar(false)
      botao.focus()
    }
  })
  matchMedia('(min-width: 1024px)').addEventListener('change', () => alternar(false))
}

/**
 * Entrada suave dos blocos ao aparecerem na tela.
 * - data-revelar: o próprio elemento entra
 * - data-revelar-cascata: os filhos entram um depois do outro
 */
export function iniciarRevelar(raiz = document) {
  for (const grupo of raiz.querySelectorAll('[data-revelar-cascata]')) {
    ;[...grupo.children].forEach((filho, i) => {
      filho.setAttribute('data-revelar', '')
      filho.style.setProperty('--atraso', `${Math.min(i, 8) * 0.08}s`)
    })
    grupo.removeAttribute('data-revelar-cascata')
  }
  const elementos = raiz.querySelectorAll('[data-revelar]:not(.revelado)')
  if (menosMovimento() || !('IntersectionObserver' in window)) {
    elementos.forEach((e) => e.classList.add('revelado'))
    return
  }
  const observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue
        entrada.target.classList.add('revelado')
        observador.unobserve(entrada.target)
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  )
  elementos.forEach((e) => observador.observe(e))
}

/** Números que sobem de zero até o valor de data-contar quando aparecem */
function iniciarContadores() {
  const elementos = document.querySelectorAll('[data-contar]')
  const animar = (e) => {
    const alvo = Number(e.dataset.contar)
    if (menosMovimento()) {
      e.textContent = numero(alvo)
      return
    }
    const inicio = performance.now()
    const duracao = 1400
    const passo = (agora) => {
      const t = Math.min(1, (agora - inicio) / duracao)
      e.textContent = numero(Math.round(alvo * (1 - Math.pow(1 - t, 3))))
      if (t < 1) requestAnimationFrame(passo)
    }
    requestAnimationFrame(passo)
  }
  const observador = new IntersectionObserver((entradas) => {
    for (const entrada of entradas) {
      if (!entrada.isIntersecting) continue
      animar(entrada.target)
      observador.unobserve(entrada.target)
    }
  })
  elementos.forEach((e) => observador.observe(e))
}

/** Botões de WhatsApp: recebem o link configurado ou somem se não houver número */
function iniciarWhatsapp() {
  const link = linkWhatsapp()
  for (const e of document.querySelectorAll('[data-whatsapp]')) {
    if (link) {
      e.href = link
      e.target = '_blank'
      e.rel = 'noopener'
      e.hidden = false
    } else {
      e.hidden = true
    }
  }
}

/** Atualiza o total de módulos em todos os [data-total-modulos] a partir dos dados */
async function preencherTotalModulos() {
  const { total } = await carregarModulos()
  if (!total) return
  for (const e of document.querySelectorAll('[data-total-modulos]')) e.textContent = numero(total)
  for (const e of document.querySelectorAll('[data-contar-modulos]')) e.dataset.contar = total
}

/** Comportamentos comuns às três versões. Chame no começo do script de cada página. */
export function iniciarPagina() {
  document.documentElement.classList.add('js')
  for (const e of document.querySelectorAll('[data-ano]')) e.textContent = new Date().getFullYear()
  iniciarTopo()
  iniciarMenuCelular()
  iniciarRevelar()
  iniciarWhatsapp()
  preencherTotalModulos().finally(iniciarContadores)
}
