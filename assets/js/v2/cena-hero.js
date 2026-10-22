/**
 * Abertura da versão 2: a lebre do logo da Fortram em 3D, com cubos (os módulos do Nown)
 * girando ao redor. A lebre é extrudada do próprio arquivo assets/img/marca/fortram-lebre.svg:
 * se o logo mudar, o 3D muda junto.
 */
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/addons/RoundedBoxGeometry.js'
import { SVGLoader } from 'three/addons/SVGLoader.js'
import { brilho, textura } from './telas.js'

const limitar = (x, min = 0, max = 1) => Math.min(max, Math.max(min, x))
const desacelerar = (t) => 1 - Math.pow(1 - t, 3)

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} opcoes
 * @param {boolean} opcoes.menosMovimento mostra a cena parada
 * @param {() => void} opcoes.aoFicarPronta chamada quando a lebre aparece (para esconder a imagem reserva)
 */
export function iniciarCenaHero(canvas, { menosMovimento, aoFicarPronta }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1

  const cena = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  cena.environmentIntensity = 0.6

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
  // no modo sem animação, só redesenha quando algo muda
  let desenhar = true

  const chave = new THREE.DirectionalLight('#ffffff', 2.4)
  chave.position.set(4, 6, 9)
  const contraluzRosa = new THREE.PointLight('#fb03a9', 90, 30, 2)
  contraluzRosa.position.set(-4.5, 2, -3)
  const luzAzul = new THREE.PointLight('#2f6fed', 60, 30, 2)
  luzAzul.position.set(5, -3, 3)
  cena.add(chave, contraluzRosa, luzAzul, new THREE.AmbientLight('#8fa6ff', 0.3))

  // tudo que gira junto com o mouse fica neste grupo
  const conjunto = new THREE.Group()
  cena.add(conjunto)

  const texturaBrilho = textura(brilho, 128, 128)
  const aura = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texturaBrilho, color: '#c3007f', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.55 }),
  )
  aura.scale.set(11, 11, 1)
  aura.position.z = -3
  conjunto.add(aura)

  // A lebre: frente azul brilhante e laterais rosa
  let lebre = null
  new SVGLoader().load('assets/img/marca/fortram-lebre.svg', (dados) => {
    const formas = dados.paths.flatMap((caminho) => caminho.toShapes())
    const geometria = new THREE.ExtrudeGeometry(formas, {
      depth: 34,
      bevelEnabled: true,
      bevelThickness: 6,
      bevelSize: 3.5,
      bevelSegments: 6,
      curveSegments: 24,
    })
    geometria.center()
    geometria.computeBoundingBox()
    const largura = geometria.boundingBox.max.x - geometria.boundingBox.min.x
    const frente = new THREE.MeshPhysicalMaterial({ color: '#0d2f6e', metalness: 0.5, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.15 })
    const lateral = new THREE.MeshStandardMaterial({ color: '#fb03a9', emissive: '#8a005c', emissiveIntensity: 0.7, metalness: 0.3, roughness: 0.32 })
    lebre = new THREE.Mesh(geometria, [frente, lateral])
    lebre.scale.setScalar(4.8 / largura)
    lebre.rotation.x = Math.PI // no SVG o eixo Y aponta para baixo
    conjunto.add(lebre)
    aoFicarPronta?.()
    desenhar = true
  })

  // Os módulos: cubinhos arredondados num anel inclinado
  const anel = new THREE.Group()
  anel.rotation.set(0.38, 0, 0.16)
  conjunto.add(anel)
  const geoCubo = new RoundedBoxGeometry(1, 1, 1, 3, 0.16)
  const materiais = ['#fb03a9', '#2f6fed', '#ffffff', '#16357a', '#ff6fd0'].map(
    (cor, i) =>
      new THREE.MeshStandardMaterial({
        color: cor,
        metalness: 0.35,
        roughness: 0.3,
        emissive: i === 0 ? '#6d0049' : '#000000',
      }),
  )
  const cubos = []
  const qtd = 28
  for (let i = 0; i < qtd; i++) {
    const cubo = new THREE.Mesh(geoCubo, materiais[i % materiais.length])
    cubo.userData = {
      angulo: (i / qtd) * Math.PI * 2,
      raio: 3.1 + Math.random() * 0.9,
      altura: (Math.random() - 0.5) * 0.9,
      tamanho: 0.16 + Math.random() * 0.22,
      giro: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(1.5),
      velocidade: 0.08 + Math.random() * 0.1,
    }
    anel.add(cubo)
    cubos.push(cubo)
  }

  // Estrelas ao fundo
  const qtdEstrelas = 420
  const estrelas = new Float32Array(qtdEstrelas * 3)
  for (let i = 0; i < qtdEstrelas; i++) {
    estrelas.set([(Math.random() - 0.5) * 46, (Math.random() - 0.5) * 26, -4 - Math.random() * 26], i * 3)
  }
  const geoEstrelas = new THREE.BufferGeometry()
  geoEstrelas.setAttribute('position', new THREE.BufferAttribute(estrelas, 3))
  const ceu = new THREE.Points(
    geoEstrelas,
    new THREE.PointsMaterial({ color: '#a9bcff', size: 0.06, transparent: true, opacity: 0.8, depthWrite: false }),
  )
  cena.add(ceu)

  // Enquadramento: no computador a lebre fica à direita; no celular, em cima do texto
  function ajustar() {
    const { width: largura, height: altura } = canvas.getBoundingClientRect()
    if (!largura || !altura) return
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75))
    renderer.setSize(largura, altura, false)
    camera.aspect = largura / altura
    const retrato = camera.aspect < 0.9
    camera.position.set(0, 0, retrato ? (13 / Math.max(camera.aspect, 0.42)) * 0.8 : 14)
    if (retrato) camera.setViewOffset(largura, altura, 0, altura * 0.24, largura, altura)
    else if (largura >= 900) camera.setViewOffset(largura, altura, -largura * 0.25, 0, largura, altura)
    else camera.clearViewOffset()
    camera.updateProjectionMatrix()
    desenhar = true
  }
  new ResizeObserver(ajustar).observe(canvas)
  ajustar()

  // com "reduzir movimento" ligado, a cena não acompanha o mouse
  const mouse = new THREE.Vector2()
  if (!menosMovimento) {
    addEventListener('pointermove', (e) => {
      mouse.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5)
    })
  }
  addEventListener('scroll', () => (desenhar = true), { passive: true })

  const relogio = new THREE.Timer()
  relogio.connect(document)
  function quadro(agora) {
    relogio.update(agora)
    const dt = Math.min(0.05, relogio.getDelta())
    if (menosMovimento && !desenhar) return
    desenhar = false
    const tempo = menosMovimento ? 3 : relogio.getElapsed()
    const entrada = menosMovimento ? 1 : desacelerar(limitar(tempo / 1.8))
    const rolagem = limitar(scrollY / innerHeight)

    // segue o mouse devagar
    const suavidade = menosMovimento ? 1 : 1 - Math.exp(-dt * 3)
    conjunto.rotation.y += (-0.32 + mouse.x * 0.5 - conjunto.rotation.y) * suavidade
    conjunto.rotation.x += (mouse.y * 0.25 - conjunto.rotation.x) * suavidade

    if (lebre) {
      // flutua e, ao rolar a página, "salta" para cima
      lebre.position.y = Math.sin(tempo * 0.9) * 0.12 + rolagem * 2.4
      lebre.position.x = rolagem * 1.2
      lebre.rotation.z = rolagem * 0.35 + Math.sin(tempo * 0.6) * 0.03
      const escala = lebre.userData.escala ?? (lebre.userData.escala = lebre.scale.x)
      lebre.scale.setScalar(escala * (0.7 + 0.3 * entrada))
    }
    for (const cubo of cubos) {
      const d = cubo.userData
      const angulo = d.angulo + tempo * d.velocidade
      const raio = d.raio * (0.4 + 0.6 * entrada) * (1 + rolagem * 0.5)
      // anel mais estreito na horizontal para os cubos não passarem por cima do texto
      cubo.position.set(Math.cos(angulo) * raio * 0.72, d.altura + Math.sin(tempo + d.angulo * 3) * 0.12, Math.sin(angulo) * raio)
      cubo.rotation.set(d.giro.x * tempo, d.giro.y * tempo, d.giro.z * tempo)
      cubo.scale.setScalar(d.tamanho * entrada)
    }
    ceu.rotation.y = tempo * 0.01
    renderer.render(cena, camera)
  }

  let visivel = false
  const atualizarLaco = () => renderer.setAnimationLoop(visivel && !document.hidden ? quadro : null)
  new IntersectionObserver(([entrada]) => {
    visivel = entrada.isIntersecting
    atualizarLaco()
  }).observe(canvas)
  document.addEventListener('visibilitychange', atualizarLaco)
}
