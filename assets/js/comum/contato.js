import { CONFIG } from './config.js'
import { el } from './util.js'

/** Link do WhatsApp com a mensagem já escrita (vazio se o número não foi configurado) */
export function linkWhatsapp(mensagem = CONFIG.mensagemWhatsapp) {
  return CONFIG.whatsapp ? `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensagem)}` : ''
}

function mostrarStatus(status, tipo, texto) {
  if (!tipo) {
    status.removeAttribute('data-tipo')
    status.textContent = ''
    return
  }
  status.dataset.tipo = tipo
  status.replaceChildren(texto)
  if (tipo !== 'erro') return
  if (CONFIG.whatsapp) {
    status.append(' ', el('a', { href: linkWhatsapp(), target: '_blank', rel: 'noopener' }, 'Chamar no WhatsApp'))
  } else if (CONFIG.email) {
    status.append(' Ou escreva para ', el('a', { href: `mailto:${CONFIG.email}` }, CONFIG.email), '.')
  }
}

/**
 * Liga o formulário de contato ao api/contato.php.
 * O formulário precisa ter: .formulario__status, os campos nome/email/mensagem e os ocultos "inicio" e "pagina".
 */
export function iniciarContato(formulario) {
  if (!formulario) return
  const status = formulario.querySelector('.formulario__status')
  const botao = formulario.querySelector('[type="submit"]')
  const textoBotao = botao.innerHTML
  formulario.elements.inicio.value = Date.now()

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault()
    if (!formulario.reportValidity()) return

    mostrarStatus(status, null)
    formulario.setAttribute('aria-busy', 'true')
    botao.disabled = true
    botao.textContent = 'Enviando...'

    try {
      const resposta = await fetch(CONFIG.contato, {
        method: 'POST',
        body: new FormData(formulario),
        headers: { Accept: 'application/json' },
      })
      const dados = await resposta.json().catch(() => null)
      if (resposta.ok && dados?.ok) {
        formulario.reset()
        formulario.elements.inicio.value = Date.now()
        mostrarStatus(status, 'sucesso', 'Mensagem enviada! A nossa equipe vai falar com você em breve.')
      } else {
        mostrarStatus(status, 'erro', dados?.erro ?? 'Não conseguimos enviar agora. Tente de novo em instantes.')
      }
    } catch {
      mostrarStatus(status, 'erro', 'Não conseguimos enviar agora. Confira sua conexão e tente de novo.')
    } finally {
      formulario.removeAttribute('aria-busy')
      botao.disabled = false
      botao.innerHTML = textoBotao
    }
  })
}

/**
 * Preenche o formulário a partir de outro ponto da página (ex.: "Quero um projeto assim") e rola até ele.
 */
export function preencherContato({ tipo, mensagem } = {}) {
  const formulario = document.querySelector('#formulario-contato')
  if (!formulario) return
  if (tipo && formulario.elements.tipo) {
    const opcao = [...formulario.elements.tipo.options].find((o) => o.value === tipo)
    if (opcao) formulario.elements.tipo.value = tipo
  }
  if (mensagem && formulario.elements.mensagem && !formulario.elements.mensagem.value.trim()) {
    formulario.elements.mensagem.value = mensagem
  }
  document.querySelector('#contato')?.scrollIntoView({ behavior: 'smooth' })
  formulario.elements.nome?.focus({ preventScroll: true })
}
