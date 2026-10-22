/**
 * Esfera com os nomes dos módulos do Nown (versão 2).
 * Gira sozinha e pode ser arrastada com o mouse ou o dedo. É feita com elementos HTML comuns,
 * sem WebGL: o texto fica nítido e a página continua leve.
 */
const limitar = (x, min, max) => Math.min(max, Math.max(min, x))

/**
 * @param {HTMLElement} container elemento com .esfera__palco dentro
 * @param {{ nome: string, cor: string }[]} modulos
 * @param {{ destaques?: string[], menosMovimento?: boolean }} opcoes
 */
export function iniciarEsfera(container, modulos, { destaques = [], menosMovimento = false } = {}) {
  const palco = container.querySelector('.esfera__palco')
  const itens = modulos.map((modulo, i) => {
    const elemento = document.createElement('span')
    elemento.className = destaques.includes(modulo.nome) ? 'esfera__item esfera__item--destaque' : 'esfera__item'
    elemento.textContent = modulo.nome
    elemento.style.setProperty('--cor', modulo.cor)
    palco.append(elemento)
    // espiral de Fibonacci: espalha os pontos por igual na superfície da esfera
    const y = 1 - (2 * (i + 0.5)) / modulos.length
    const r = Math.sqrt(1 - y * y)
    const angulo = Math.PI * (3 - Math.sqrt(5)) * i
    return { elemento, x: Math.cos(angulo) * r, y, z: Math.sin(angulo) * r }
  })

  const giroAutomatico = menosMovimento ? 0 : 0.0032
  let rotX = -0.25
  let rotY = 0
  let velX = 0
  let velY = giroAutomatico
  let arrastando = false
  let ultimo = { x: 0, y: 0 }

  palco.addEventListener('pointerdown', (e) => {
    arrastando = true
    ultimo = { x: e.clientX, y: e.clientY }
    palco.setPointerCapture(e.pointerId)
  })
  palco.addEventListener('pointermove', (e) => {
    if (!arrastando) return
    velY = (e.clientX - ultimo.x) * 0.005
    velX = (e.clientY - ultimo.y) * 0.005
    ultimo = { x: e.clientX, y: e.clientY }
    if (menosMovimento) desenhar()
  })
  const soltar = () => (arrastando = false)
  palco.addEventListener('pointerup', soltar)
  palco.addEventListener('pointercancel', soltar)

  function desenhar() {
    if (!arrastando) {
      velY += (giroAutomatico - velY) * 0.03
      velX *= 0.94
    }
    rotY += velY
    rotX = limitar(rotX + velX, -1.1, 1.1)
    const raio = palco.clientWidth * 0.44
    const [senoY, cossenoY, senoX, cossenoX] = [Math.sin(rotY), Math.cos(rotY), Math.sin(rotX), Math.cos(rotX)]
    for (const item of itens) {
      const x = item.x * cossenoY + item.z * senoY
      const z1 = -item.x * senoY + item.z * cossenoY
      const y = item.y * cossenoX - z1 * senoX
      const z = item.y * senoX + z1 * cossenoX // -1 (atrás) até 1 (na frente)
      const perto = (z + 1) / 2
      item.elemento.style.transform = `translate(-50%, -50%) translate3d(${(x * raio).toFixed(1)}px, ${(y * raio).toFixed(1)}px, 0) scale(${(0.55 + perto * 0.6).toFixed(3)})`
      item.elemento.style.opacity = (0.06 + perto * perto * 0.94).toFixed(3)
      item.elemento.style.zIndex = Math.round(perto * 100)
    }
  }

  desenhar()
  if (menosMovimento) return

  // anima só quando a esfera está na tela
  let quadro = 0
  const laco = () => {
    desenhar()
    quadro = requestAnimationFrame(laco)
  }
  new IntersectionObserver(([entrada]) => {
    cancelAnimationFrame(quadro)
    if (entrada.isIntersecting) quadro = requestAnimationFrame(laco)
  }).observe(container)
}
