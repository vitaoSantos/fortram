/**
 * Jornada em 3D da versão 2: sete ilhas, uma por etapa, ligadas por um caminho de luz.
 * Conforme a página rola, a câmera voa de uma ilha para a próxima e um ponto de luz
 * (o seu projeto) percorre o caminho, acendendo o trecho já concluído.
 */
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js'
import { criarIlha, criarKit, ESTACOES } from './estacoes.js'

const COR_FUNDO = '#030a1c'
const limitar = (x, min = 0, max = 1) => Math.min(max, Math.max(min, x))
const suave = (x, inicio, fim) => {
  const t = limitar((x - inicio) / (fim - inicio))
  return t * t * (3 - 2 * t)
}

/** Centro de cada ilha: um "S" que vai entrando na tela */
function centroIlha(i) {
  return new THREE.Vector3(Math.sin(i * 1.2) * 8, Math.sin(i * 2.1) * 0.35, -i * 16)
}

// De onde a câmera olha cada ilha: de frente, um pouco pela direita e de cima
const OLHAR_DE = new THREE.Vector3(5.4, 4.4, 10.8)
const OLHAR_PARA = new THREE.Vector3(0.4, 1.35, 0)

/**
 * A câmera "segura" um pouco em cada etapa antes de voar para a próxima,
 * para dar tempo de ler o texto. t vai de 0 (primeira etapa) até 6 (última).
 */
function comPausa(t) {
  const etapa = Math.round(t)
  const resto = t - etapa
  return etapa + Math.sign(resto) * suave(Math.abs(resto), 0.16, 0.5) * 0.5
}

/** Caminho de luz: apagado à frente, rosa no trecho já percorrido, com traços que andam */
function materialCaminho() {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uProgresso: { value: 0 }, uTempo: { value: 0 } }]),
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      uniform float uProgresso;
      uniform float uTempo;
      varying vec2 vUv;
      void main() {
        float feito = step(vUv.x, uProgresso);
        float traco = smoothstep(0.25, 0.5, abs(fract(vUv.x * 140.0 - uTempo * 0.9) - 0.5));
        vec3 apagado = vec3(0.12, 0.2, 0.45) * (0.55 + 0.45 * traco);
        vec3 aceso = mix(vec3(0.95, 0.02, 0.55), vec3(1.0, 0.55, 0.9), traco);
        gl_FragColor = vec4(mix(apagado, aceso, feito), 1.0);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
    fog: true,
  })
}

/**
 * Monta a cena no canvas e liga à rolagem da seção.
 * @param {object} opcoes
 * @param {HTMLCanvasElement} opcoes.canvas
 * @param {HTMLElement} opcoes.secao seção que contém o palco fixo e as etapas
 * @param {HTMLElement[]} opcoes.etapas os <li> de cada etapa (usados para medir a altura)
 * @param {boolean} opcoes.menosMovimento sem voo suave e sem animações contínuas
 */
export async function iniciarCenaProcesso({ canvas, secao, etapas, menosMovimento }) {
  // As telas são desenhadas com as fontes do site: espera elas carregarem
  await Promise.all(['800 40px Montserrat', '700 40px Montserrat', '600 20px Inter', '500 20px "JetBrains Mono"'].map((f) => document.fonts.load(f)))

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  renderer.setClearColor(COR_FUNDO)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05

  const cena = new THREE.Scene()
  cena.fog = new THREE.Fog(COR_FUNDO, 15, 38)
  const pmrem = new THREE.PMREMGenerator(renderer)
  cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  cena.environmentIntensity = 0.45
  cena.add(new THREE.HemisphereLight('#c3d4ff', '#0a1430', 1.3))
  const sol = new THREE.DirectionalLight('#ffffff', 2.1)
  sol.position.set(6, 10, 8)
  cena.add(sol)

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 140)

  // Ilhas e estações
  const kit = criarKit()
  const total = ESTACOES.length
  const ilhas = []
  const estacoes = []
  for (let i = 0; i < total; i++) {
    const ilha = criarIlha(kit, i + 1)
    ilha.grupo.position.copy(centroIlha(i))
    const estacao = ESTACOES[i](kit)
    ilha.grupo.add(estacao.grupo)
    cena.add(ilha.grupo)
    ilhas.push(ilha)
    estacoes.push(estacao)
  }

  // Caminho: contorna cada ilha pela direita e atravessa o vão até a próxima
  const pontos = []
  const parada = [] // índice do ponto onde o projeto "para" em cada etapa
  for (let i = 0; i < total; i++) {
    const c = centroIlha(i)
    pontos.push(c.clone().add(new THREE.Vector3(1.6, 0.1, 3.45)))
    parada.push(pontos.length)
    pontos.push(c.clone().add(new THREE.Vector3(3.55, 0.1, 1.1)))
    if (i < total - 1) {
      pontos.push(c.clone().add(new THREE.Vector3(2.7, 0.1, -2.6)))
      const proxima = centroIlha(i + 1).add(new THREE.Vector3(1.6, 0.1, 3.45))
      pontos.push(c.clone().add(new THREE.Vector3(2.7, 0.1, -2.6)).lerp(proxima, 0.5).add(new THREE.Vector3(0, -0.7, 0)))
    }
  }
  const caminho = new THREE.CatmullRomCurve3(pontos, false, 'centripetal')
  const comprimentos = caminho.getLengths(2000)
  const fracaoNoCaminho = (indicePonto) => comprimentos[Math.round((indicePonto / (pontos.length - 1)) * 2000)] / comprimentos[2000]
  const paradas = parada.map(fracaoNoCaminho)
  const tuboMaterial = materialCaminho()
  cena.add(new THREE.Mesh(new THREE.TubeGeometry(caminho, 1400, 0.05, 8, false), tuboMaterial))

  // O projeto: um ponto de luz que percorre o caminho
  const projeto = new THREE.Group()
  projeto.add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 16), new THREE.MeshBasicMaterial({ color: '#ffffff' })))
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: kit.texturas.brilho, color: '#ff4fc4', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }),
  )
  halo.scale.set(1.7, 1.7, 1)
  projeto.add(halo, new THREE.PointLight('#ff4fc4', 8, 7, 2))
  cena.add(projeto)

  // Poeira de estrelas ao redor
  const qtdEstrelas = innerWidth < 900 ? 500 : 1100
  const estrelas = new Float32Array(qtdEstrelas * 3)
  for (let i = 0; i < qtdEstrelas; i++) {
    estrelas.set([(Math.random() - 0.5) * 70, -10 + Math.random() * 28, 14 - Math.random() * (total * 16 + 30)], i * 3)
  }
  const geoEstrelas = new THREE.BufferGeometry()
  geoEstrelas.setAttribute('position', new THREE.BufferAttribute(estrelas, 3))
  cena.add(
    new THREE.Points(
      geoEstrelas,
      new THREE.PointsMaterial({ color: '#9db4ff', size: 0.07, transparent: true, opacity: 0.75, depthWrite: false }),
    ),
  )

  // Trajetória da câmera: um ponto de vista por ilha, ligados por curvas suaves
  const curvaCamera = new THREE.CatmullRomCurve3(ilhas.map((_, i) => centroIlha(i).add(OLHAR_DE)))
  const curvaAlvo = new THREE.CatmullRomCurve3(ilhas.map((_, i) => centroIlha(i).add(OLHAR_PARA)))

  // Tamanho, enquadramento e distância (no celular a câmera se afasta para caber a ilha)
  let distancia = 1
  let desenhar = true // no modo sem animação, só redesenha quando algo muda
  function ajustar() {
    const { width: largura, height: altura } = canvas.getBoundingClientRect()
    if (!largura || !altura) return
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
    renderer.setSize(largura, altura, false)
    camera.aspect = largura / altura
    const retrato = camera.aspect < 0.9
    distancia = retrato ? Math.min(2.3, 1 / camera.aspect) : camera.aspect < 1.4 ? 1.2 : 1
    cena.fog.near = 15 * distancia
    cena.fog.far = 38 * distancia
    // empurra a cena para a direita (texto à esquerda) ou para cima (texto embaixo, no celular)
    if (retrato) camera.setViewOffset(largura, altura, 0, altura * 0.16, largura, altura)
    else if (largura >= 900) camera.setViewOffset(largura, altura, -largura * 0.16, 0, largura, altura)
    else camera.clearViewOffset()
    camera.updateProjectionMatrix()
    desenhar = true
  }
  new ResizeObserver(ajustar).observe(canvas)
  ajustar()

  // Rolagem -> posição na jornada
  let alvo = 0
  let atual = 0
  function lerRolagem() {
    const alturaEtapa = etapas[0]?.offsetHeight || innerHeight
    alvo = limitar(-secao.getBoundingClientRect().top / alturaEtapa, 0, total - 1)
    desenhar = true
  }
  addEventListener('scroll', lerRolagem, { passive: true })
  lerRolagem()
  atual = comPausa(alvo)

  // Leve paralaxe com o mouse
  const mouse = new THREE.Vector2()
  const mouseSuave = new THREE.Vector2()
  addEventListener('pointermove', (e) => {
    mouse.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5)
  })

  const relogio = new THREE.Timer()
  relogio.connect(document)
  const posicao = new THREE.Vector3()
  const olhar = new THREE.Vector3()

  function quadro(agora) {
    relogio.update(agora)
    const dt = Math.min(0.1, relogio.getDelta())
    const tempo = menosMovimento ? 0 : relogio.getElapsed()
    if (menosMovimento && !desenhar) return
    desenhar = false

    const destino = comPausa(alvo)
    atual = menosMovimento ? destino : atual + (destino - atual) * (1 - Math.exp(-dt * 5))
    if (!menosMovimento) mouseSuave.lerp(mouse, 1 - Math.exp(-dt * 3))

    const u = atual / (total - 1)
    olhar.copy(curvaAlvo.getPoint(u))
    posicao.copy(curvaCamera.getPoint(u)).sub(olhar).multiplyScalar(distancia).add(olhar)
    posicao.x += mouseSuave.x * 0.8
    posicao.y -= mouseSuave.y * 0.5
    camera.position.copy(posicao)
    camera.lookAt(olhar)

    // posição do projeto no caminho: entre a parada da etapa atual e a da próxima
    const etapa = Math.min(total - 2, Math.floor(atual))
    const fracao = paradas[etapa] + (paradas[etapa + 1] - paradas[etapa]) * (atual - etapa)
    projeto.position.copy(caminho.getPointAt(limitar(fracao)))
    projeto.position.y += 0.25 + Math.sin(tempo * 3) * 0.06
    tuboMaterial.uniforms.uProgresso.value = fracao
    tuboMaterial.uniforms.uTempo.value = tempo

    for (let i = 0; i < total; i++) {
      const proximidade = Math.abs(atual - i)
      ilhas[i].grupo.visible = proximidade < 2.3 // as outras somem na neblina: nem desenha
      if (proximidade > 1.6) continue // longe demais para aparecer: não precisa animar
      const foco = limitar(1 - proximidade * 1.6)
      ilhas[i].atualizar(tempo, foco)
      estacoes[i].atualizar(tempo, foco)
    }
    renderer.render(cena, camera)
  }

  // Só desenha enquanto a seção está na tela e a aba está aberta
  let visivel = false
  const atualizarLaco = () => renderer.setAnimationLoop(visivel && !document.hidden ? quadro : null)
  new IntersectionObserver(([entrada]) => {
    visivel = entrada.isIntersecting
    atualizarLaco()
  }).observe(secao)
  document.addEventListener('visibilitychange', atualizarLaco)
}
