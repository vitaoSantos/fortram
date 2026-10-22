/**
 * Desenhos em <canvas> usados como "telas" dentro das cenas 3D da versão 2
 * (documento do projeto, protótipo no Figma, código, ambiente de testes...).
 * Cada função recebe o contexto 2D e o tamanho do desenho. Para trocar um desenho,
 * basta editar a função correspondente: não há imagens externas envolvidas.
 */
import * as THREE from 'three'

const AZUL = '#042258'
const MAGENTA = '#fb03a9'
const MAGENTA_FORTE = '#d4008a'
const VERDE = '#12b76a'

// Navegadores antigos sem roundRect desenham os cantos retos
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, l, a) {
    this.rect(x, y, l, a)
  }
}

/** Retângulo com cantos arredondados (preenchido ou só o contorno) */
function retangulo(ctx, x, y, l, a, raio, cor, contorno = false) {
  ctx.beginPath()
  ctx.roundRect(x, y, l, a, raio)
  if (contorno) {
    ctx.strokeStyle = cor
    ctx.stroke()
  } else {
    ctx.fillStyle = cor
    ctx.fill()
  }
}

function texto(ctx, conteudo, x, y, { tamanho = 20, peso = 600, cor = AZUL, fonte = 'Inter', alinhar = 'left' } = {}) {
  ctx.font = `${peso} ${tamanho}px ${fonte}, sans-serif`
  ctx.fillStyle = cor
  ctx.textAlign = alinhar
  ctx.textBaseline = 'middle'
  ctx.fillText(conteudo, x, y)
}

function check(ctx, x, y, tamanho, cor = '#fff', espessura = 4) {
  ctx.beginPath()
  ctx.moveTo(x - tamanho * 0.45, y)
  ctx.lineTo(x - tamanho * 0.1, y + tamanho * 0.35)
  ctx.lineTo(x + tamanho * 0.5, y - tamanho * 0.35)
  ctx.strokeStyle = cor
  ctx.lineWidth = espessura
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()
}

/** Cria uma textura do Three.js a partir de uma função de desenho */
export function textura(desenhar, largura, altura) {
  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura
  desenhar(canvas.getContext('2d'), largura, altura)
  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

/** Etapa 2: documento do projeto montado com o gerente */
export function documento(ctx, l, a) {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, l, a)
  ctx.fillStyle = AZUL
  ctx.fillRect(0, 0, l, 86)
  texto(ctx, 'Documentação do projeto', 32, 44, { tamanho: 27, peso: 800, cor: '#fff', fonte: 'Montserrat' })
  const secoes = [
    ['Escopo', [0.86, 0.7, 0.78], 3],
    ['Etapas', [0.62, 0.8, 0.5], 2],
    ['Prazos', [0.74, 0.56], 1],
  ]
  let y = 136
  for (const [titulo, linhas, feitas] of secoes) {
    texto(ctx, titulo, 32, y, { tamanho: 24, peso: 800, fonte: 'Montserrat' })
    y += 40
    linhas.forEach((largura, i) => {
      const ok = i < feitas
      retangulo(ctx, 32, y - 13, 26, 26, 7, ok ? MAGENTA : '#e3e7f0')
      if (ok) check(ctx, 45, y, 14, '#fff', 3.5)
      retangulo(ctx, 72, y - 7, (l - 110) * largura, 14, 7, '#dfe4ef')
      y += 38
    })
    y += 26
  }
  retangulo(ctx, 32, a - 78, l - 64, 48, 24, '#ffe4f5')
  texto(ctx, 'Gerente de projetos dedicado', l / 2, a - 54, { tamanho: 20, peso: 700, cor: MAGENTA_FORTE, alinhar: 'center' })
}

/** Etapa 3: protótipo no Figma, com três telas ligadas por setas */
export function figma(ctx, l, a) {
  ctx.fillStyle = '#2c2c2c'
  ctx.fillRect(0, 0, l, a)
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  for (let x = 20; x < l; x += 32) for (let y = 20; y < a; y += 32) ctx.fillRect(x, y, 2, 2)

  const telas = ['Início', 'Detalhes', 'Pagamento']
  const largura = 210
  const altura = 420
  const topo = 150
  telas.forEach((nome, i) => {
    const x = 92 + i * 312
    texto(ctx, nome, x, topo - 22, { tamanho: 18, peso: 600, cor: '#b3b3b3' })
    retangulo(ctx, x, topo, largura, altura, 22, '#ffffff')
    retangulo(ctx, x, topo, largura, 54, [22, 22, 0, 0], i === 2 ? MAGENTA_FORTE : AZUL)
    retangulo(ctx, x + 16, topo + 72, largura - 32, 96, 12, '#eef1f7')
    ctx.strokeStyle = '#d5dbe8'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x + 16, topo + 72)
    ctx.lineTo(x + largura - 16, topo + 168)
    ctx.moveTo(x + largura - 16, topo + 72)
    ctx.lineTo(x + 16, topo + 168)
    ctx.stroke()
    for (let k = 0; k < 4; k++) retangulo(ctx, x + 16, topo + 190 + k * 30, (largura - 32) * (k % 2 ? 0.6 : 0.85), 14, 7, '#e3e7f0')
    retangulo(ctx, x + 16, topo + altura - 66, largura - 32, 44, 22, i === 2 ? VERDE : MAGENTA)
  })

  // setas do fluxo
  ctx.strokeStyle = '#0d99ff'
  ctx.lineWidth = 4
  for (let i = 0; i < 2; i++) {
    const x1 = 92 + i * 312 + largura + 8
    const x2 = 92 + (i + 1) * 312 - 12
    const y = topo + 120 + i * 80
    ctx.beginPath()
    ctx.moveTo(x1, y)
    ctx.bezierCurveTo(x1 + 40, y, x2 - 40, y + 40, x2, y + 40)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x2, y + 40)
    ctx.lineTo(x2 - 14, y + 30)
    ctx.lineTo(x2 - 12, y + 50)
    ctx.closePath()
    ctx.fillStyle = '#0d99ff'
    ctx.fill()
  }

  // cursores de quem está mexendo no protótipo
  const cursor = (x, y, cor, nome) => {
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x, y + 30)
    ctx.lineTo(x + 9, y + 22)
    ctx.lineTo(x + 22, y + 22)
    ctx.closePath()
    ctx.fillStyle = cor
    ctx.fill()
    ctx.font = '600 16px Inter, sans-serif'
    const largura = ctx.measureText(nome).width + 20
    retangulo(ctx, x + 18, y + 26, largura, 28, 8, cor)
    texto(ctx, nome, x + 28, y + 40, { tamanho: 16, cor: '#fff' })
  }
  cursor(250, 330, MAGENTA, 'Você')
  cursor(690, 470, '#0d99ff', 'Prototipagem')
  texto(ctx, 'Projeto do cliente · Figma', 28, 40, { tamanho: 18, peso: 600, cor: '#e6e6e6' })
}

/** Etapa 4: editor de código à esquerda e a tela pronta à direita */
export function codigo(ctx, l, a) {
  const divisao = Math.round(l * 0.54)
  ctx.fillStyle = '#0b1020'
  ctx.fillRect(0, 0, divisao, a)
  ctx.fillStyle = '#121a33'
  ctx.fillRect(0, 0, divisao, 46)
  retangulo(ctx, 16, 8, 150, 38, [10, 10, 0, 0], '#0b1020')
  texto(ctx, 'pedido.js', 34, 28, { tamanho: 17, peso: 500, cor: '#c7d0ea', fonte: 'JetBrains Mono' })
  const cores = ['#ff6fd0', '#7aa2ff', '#6ce9a6', '#ffd166', '#5b6b94']
  const linhas = [
    [[0, 70], [1, 120], [4, 60]],
    [[4, 40], [2, 160]],
    [[0, 50], [3, 90], [1, 110]],
    [[4, 40], [1, 70], [2, 140]],
    [[4, 40], [4, 40], [0, 80], [3, 70]],
    [[4, 40], [1, 180]],
    [[0, 60], [2, 120]],
    [[3, 90], [1, 60], [4, 100]],
    [[4, 40], [0, 110]],
    [[1, 150], [2, 80]],
  ]
  linhas.forEach((tokens, i) => {
    const y = 80 + i * 44
    texto(ctx, String(i + 1).padStart(2, ' '), 18, y, { tamanho: 16, peso: 400, cor: '#3d4a72', fonte: 'JetBrains Mono' })
    let x = 62
    for (const [cor, largura] of tokens) {
      retangulo(ctx, x, y - 8, largura * 0.9, 16, 8, cores[cor])
      x += largura * 0.9 + 12
    }
  })
  // tela pronta
  ctx.fillStyle = '#f5f6fa'
  ctx.fillRect(divisao, 0, l - divisao, a)
  ctx.fillStyle = AZUL
  ctx.fillRect(divisao, 0, l - divisao, 64)
  retangulo(ctx, divisao + 22, 20, 26, 26, 7, MAGENTA)
  retangulo(ctx, divisao + 58, 26, 110, 14, 7, 'rgba(255,255,255,0.7)')
  const lp = l - divisao - 44
  for (let i = 0; i < 3; i++) {
    const y = 90 + i * 112
    retangulo(ctx, divisao + 22, y, lp, 94, 16, '#ffffff')
    retangulo(ctx, divisao + 38, y + 16, 62, 62, 12, ['#ffe4f5', '#e3ecff', '#dcfae6'][i])
    retangulo(ctx, divisao + 114, y + 24, lp * 0.5, 14, 7, '#c9d1e3')
    retangulo(ctx, divisao + 114, y + 52, lp * 0.32, 12, 6, '#e3e7f0')
  }
  retangulo(ctx, divisao + 22, a - 76, lp, 52, 26, MAGENTA_FORTE)
  texto(ctx, 'Finalizar pedido', divisao + 22 + lp / 2, a - 50, { tamanho: 20, peso: 700, cor: '#fff', alinhar: 'center', fonte: 'Montserrat' })
}

/** Etapa 6: cadastro no ambiente de testes do cliente */
export function ambienteTestes(ctx, l, a) {
  ctx.fillStyle = '#f5f6fa'
  ctx.fillRect(0, 0, l, a)
  ctx.fillStyle = '#ffd166'
  ctx.fillRect(0, 0, l, 50)
  texto(ctx, 'AMBIENTE DE TESTES · só para você', l / 2, 26, { tamanho: 19, peso: 800, cor: AZUL, alinhar: 'center', fonte: 'Montserrat' })
  const x = 70
  retangulo(ctx, x, 82, 380, a - 120, 22, '#ffffff')
  texto(ctx, 'Criar conta', x + 30, 124, { tamanho: 28, peso: 800, fonte: 'Montserrat' })
  ;['Seu nome', 'E-mail', 'Senha'].forEach((rotulo, i) => {
    const y = 162 + i * 70
    ctx.lineWidth = 2
    retangulo(ctx, x + 30, y, 320, 50, 12, '#ccd3e2', true)
    texto(ctx, rotulo, x + 48, y + 26, { tamanho: 18, peso: 500, cor: '#7a849e' })
  })
  retangulo(ctx, x + 30, a - 104, 320, 52, 26, MAGENTA_FORTE)
  texto(ctx, 'Cadastrar', x + 190, a - 77, { tamanho: 20, peso: 700, cor: '#fff', alinhar: 'center', fonte: 'Montserrat' })
  ;['Cadastro', 'Pagamento', 'Notificações', 'Painel'].forEach((item, i) => {
    const y = 120 + i * 78
    retangulo(ctx, 500, y - 26, l - 540, 56, 16, '#ffffff')
    ctx.beginPath()
    ctx.arc(530, y + 2, 15, 0, Math.PI * 2)
    ctx.fillStyle = VERDE
    ctx.fill()
    check(ctx, 530, y + 2, 14, '#fff', 3.5)
    texto(ctx, item, 558, y + 2, { tamanho: 20, peso: 600 })
  })
}

/** Etapa 6: celular com o sistema funcionando */
export function celular(ctx, l, a) {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, l, a)
  texto(ctx, '9:41', 30, 34, { tamanho: 18, peso: 700 })
  texto(ctx, 'Meu pedido', 30, 96, { tamanho: 30, peso: 800, fonte: 'Montserrat' })
  ;['Pedido criado', 'Pagamento aprovado', 'Notificação enviada'].forEach((item, i) => {
    const y = 150 + i * 92
    retangulo(ctx, 22, y, l - 44, 74, 18, '#f2f4f9')
    ctx.beginPath()
    ctx.arc(62, y + 37, 18, 0, Math.PI * 2)
    ctx.fillStyle = VERDE
    ctx.fill()
    check(ctx, 62, y + 37, 16, '#fff', 4)
    texto(ctx, item, 94, y + 37, { tamanho: 19, peso: 600 })
  })
  retangulo(ctx, 22, a - 92, l - 44, 60, 30, MAGENTA_FORTE)
  texto(ctx, 'Acompanhar', l / 2, a - 62, { tamanho: 21, peso: 700, cor: '#fff', alinhar: 'center', fonte: 'Montserrat' })
}

/** Painel de verificação que aparece flutuando na etapa de testes */
export function checklist(ctx, l, a) {
  retangulo(ctx, 0, 0, l, a, 28, 'rgba(10, 22, 51, 0.92)')
  ctx.lineWidth = 3
  retangulo(ctx, 1.5, 1.5, l - 3, a - 3, 28, 'rgba(255,255,255,0.16)', true)
  texto(ctx, 'Validação', 34, 52, { tamanho: 28, peso: 800, cor: '#ffffff', fonte: 'Montserrat' })
  ;['Testes internos', 'Seu cadastro', 'Seu aceite'].forEach((item, i) => {
    const y = 122 + i * 74
    ctx.lineWidth = 3
    retangulo(ctx, 34, y - 20, 40, 40, 10, 'rgba(255,255,255,0.35)', true)
    texto(ctx, item, 96, y, { tamanho: 24, peso: 600, cor: '#dbe3ff' })
  })
}

/** Número grande da etapa, flutuando acima de cada ilha */
export function numeroEtapa(numero) {
  return (ctx, l, a) => {
    const grad = ctx.createLinearGradient(0, 0, l, a)
    grad.addColorStop(0, '#ffffff')
    grad.addColorStop(1, '#ff6fd0')
    ctx.font = '800 150px Montserrat, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = grad
    ctx.fillText(String(numero).padStart(2, '0'), l / 2, a / 2 + 8)
  }
}

/** Selo verde de aprovado (desenho quadrado: só usa a largura) */
export function selo(ctx, l) {
  const c = l / 2
  ctx.beginPath()
  ctx.arc(c, c, c - 6, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(18, 183, 106, 0.25)'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(c, c, c - 30, 0, Math.PI * 2)
  ctx.fillStyle = VERDE
  ctx.fill()
  check(ctx, c, c + 4, l * 0.36, '#fff', l * 0.07)
}

/**
 * Etiqueta com texto (ex.: "Você", "Seu gerente") para flutuar sobre as pessoas.
 * Devolve a textura e a proporção largura/altura para dimensionar o sprite.
 */
export function rotulo(conteudo, fundo = MAGENTA_FORTE, cor = '#ffffff') {
  const altura = 72
  const medidor = document.createElement('canvas').getContext('2d')
  medidor.font = '700 34px Montserrat, sans-serif'
  const largura = Math.ceil(medidor.measureText(conteudo).width) + 56
  const t = textura(
    (ctx, l, a) => {
      retangulo(ctx, 0, 0, l, a, a / 2, fundo)
      texto(ctx, conteudo, l / 2, a / 2 + 2, { tamanho: 34, peso: 700, cor, fonte: 'Montserrat', alinhar: 'center' })
    },
    largura,
    altura,
  )
  return { textura: t, proporcao: largura / altura }
}

/** Brilho redondo e suave (usado em luzes e halos) */
export function brilho(ctx, l, a) {
  const g = ctx.createRadialGradient(l / 2, a / 2, 0, l / 2, a / 2, l / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.45)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, l, a)
}
