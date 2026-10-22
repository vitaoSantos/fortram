/**
 * As 7 estações da jornada em 3D (versão 2). Tudo é montado com formas simples do Three.js,
 * sem modelos externos. Cada função devolve { grupo, atualizar(tempo, foco) }:
 * - tempo: segundos desde que a cena começou
 * - foco: de 0 a 1, o quanto a câmera está parada nesta etapa (1 = etapa atual)
 *
 * Para mudar uma etapa, edite só a função dela. As posições são em metros dentro da ilha
 * (a ilha tem 3,8 de raio; a câmera olha de frente e um pouco pela direita).
 */
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/RoundedBoxGeometry.js'
import * as telas from './telas.js'

const limitar = (x, min = 0, max = 1) => Math.min(max, Math.max(min, x))
/** 0 antes de "inicio", 1 depois de "fim", com curva suave no meio */
const entre = (x, inicio, fim) => {
  const t = limitar((x - inicio) / (fim - inicio))
  return t * t * (3 - 2 * t)
}
/** Escala que passa um pouco do tamanho final e volta (efeito de "pop") */
const pop = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2))

/** Materiais e formas compartilhados por todas as estações */
export function criarKit() {
  const m = {
    ilha: new THREE.MeshStandardMaterial({ color: '#0a1838', roughness: 0.6, metalness: 0.25 }),
    piso: new THREE.MeshStandardMaterial({ color: '#142a63', roughness: 0.42, metalness: 0.2 }),
    branco: new THREE.MeshStandardMaterial({ color: '#eef2fb', roughness: 0.42 }),
    cinza: new THREE.MeshStandardMaterial({ color: '#9fb0d6', roughness: 0.5 }),
    escuro: new THREE.MeshStandardMaterial({ color: '#1a2a58', roughness: 0.4, metalness: 0.35 }),
    moldura: new THREE.MeshStandardMaterial({ color: '#0b1226', roughness: 0.25, metalness: 0.6 }),
    rosa: new THREE.MeshStandardMaterial({ color: '#fb03a9', emissive: '#b0007a', emissiveIntensity: 0.45, roughness: 0.35 }),
    azul: new THREE.MeshStandardMaterial({ color: '#5b8cff', emissive: '#16348f', emissiveIntensity: 0.35, roughness: 0.4 }),
    verde: new THREE.MeshStandardMaterial({ color: '#12b76a', emissive: '#08804a', emissiveIntensity: 0.7, roughness: 0.4 }),
    amarelo: new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ffb020', emissiveIntensity: 1.4, roughness: 0.3 }),
    luzRosa: new THREE.MeshBasicMaterial({ color: '#ff4fc4' }),
    luzAzul: new THREE.MeshBasicMaterial({ color: '#7aa2ff' }),
    luzVerde: new THREE.MeshBasicMaterial({ color: '#4ff0a0' }),
  }
  const barra = new THREE.BoxGeometry(1, 1, 1)
  barra.translate(0.5, 0, 0) // cresce para a direita a partir da origem
  const g = {
    corpo: new THREE.CapsuleGeometry(0.3, 0.56, 6, 18),
    cabeca: new THREE.SphereGeometry(0.25, 28, 18),
    caixa: new RoundedBoxGeometry(1, 1, 1, 3, 0.08),
    caixaLisa: new THREE.BoxGeometry(1, 1, 1),
    barra,
    esfera: new THREE.SphereGeometry(1, 24, 16),
    cilindro: new THREE.CylinderGeometry(1, 1, 1, 40),
    cone: new THREE.ConeGeometry(1, 1, 24),
    plano: new THREE.PlaneGeometry(1, 1),
    anel: new THREE.TorusGeometry(1, 0.06, 8, 64),
    ilha: new THREE.CylinderGeometry(3.8, 3.1, 0.9, 64),
    piso: new THREE.CylinderGeometry(3.8, 3.8, 0.04, 64),
    aro: new THREE.TorusGeometry(3.8, 0.035, 8, 160),
  }
  const texturas = {
    brilho: telas.textura(telas.brilho, 128, 128),
    selo: telas.textura(telas.selo, 256, 256),
  }
  return { m, g, texturas }
}

function malha(geo, mat, posicao = [0, 0, 0], escala = [1, 1, 1]) {
  const o = new THREE.Mesh(geo, mat)
  o.position.set(...posicao)
  o.scale.set(...escala)
  return o
}

function sprite(textura, largura, altura = largura, aditivo = false) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: textura,
      transparent: true,
      depthWrite: false,
      blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending,
    }),
  )
  s.scale.set(largura, altura, 1)
  return s
}

/** Etiqueta flutuante ("Você", "Seu gerente"...) */
function rotulo(texto, x, y, z, fundo) {
  const { textura, proporcao } = telas.rotulo(texto, fundo)
  const s = sprite(textura, 0.36 * proporcao, 0.36)
  s.position.set(x, y, z)
  s.userData.base = s.scale.clone()
  return s
}

/** Pessoa estilizada: corpo em cápsula e cabeça redonda */
function pessoa(kit, material, x, z, escala = 1) {
  const g = new THREE.Group()
  g.add(malha(kit.g.corpo, material, [0, 0.58, 0]))
  g.add(malha(kit.g.cabeca, kit.m.branco, [0, 1.38, 0]))
  g.position.set(x, 0, z)
  g.scale.setScalar(escala)
  g.userData.fase = Math.random() * 6
  return g
}

/** Pequeno balanço para as pessoas não ficarem paradas */
function respirar(p, tempo) {
  p.position.y = Math.abs(Math.sin(tempo * 1.7 + p.userData.fase)) * 0.05
}

/** Monitor, quadro ou celular: moldura com uma tela desenhada em canvas */
function painel(kit, textura, largura, altura, espessura = 0.08) {
  const g = new THREE.Group()
  g.add(malha(kit.g.caixa, kit.m.moldura, [0, 0, 0], [largura + 0.14, altura + 0.14, espessura]))
  const tela = new THREE.Mesh(kit.g.plano, new THREE.MeshBasicMaterial({ map: textura, toneMapped: false }))
  tela.scale.set(largura, altura, 1)
  tela.position.z = espessura / 2 + 0.003
  g.add(tela)
  return g
}

function balao(kit) {
  const g = new THREE.Group()
  g.add(malha(kit.g.caixa, kit.m.branco, [0, 0, 0], [0.95, 0.58, 0.14]))
  const cauda = malha(kit.g.cone, kit.m.branco, [-0.2, -0.36, 0], [0.11, 0.24, 0.07])
  cauda.rotation.z = Math.PI
  g.add(cauda)
  for (let i = 0; i < 3; i++) g.add(malha(kit.g.esfera, kit.m.escuro, [(i - 1) * 0.22, 0, 0.075], [0.06, 0.06, 0.02]))
  return g
}

function mesa(kit, largura, profundidade, altura = 0.86) {
  const g = new THREE.Group()
  g.add(malha(kit.g.caixa, kit.m.branco, [0, altura, 0], [largura, 0.07, profundidade]))
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    g.add(malha(kit.g.caixaLisa, kit.m.cinza, [x * (largura / 2 - 0.12), altura / 2, z * (profundidade / 2 - 0.12)], [0.06, altura, 0.06]))
  }
  return g
}

/**
 * Ilha flutuante onde cada etapa acontece, com o aro que acende quando a etapa está em foco.
 */
export function criarIlha(kit, numero) {
  const g = new THREE.Group()
  g.add(malha(kit.g.ilha, kit.m.ilha, [0, -0.47, 0]))
  g.add(malha(kit.g.piso, kit.m.piso, [0, -0.0, 0]))
  const materialAro = new THREE.MeshBasicMaterial({ color: '#fb03a9', transparent: true, opacity: 0.35 })
  const aro = malha(kit.g.aro, materialAro, [0, 0.03, 0])
  aro.rotation.x = Math.PI / 2
  g.add(aro)
  const brilhoBase = sprite(kit.texturas.brilho, 9, 9, true)
  brilhoBase.material.color.set('#5a1a8f')
  brilhoBase.material.opacity = 0.35
  brilhoBase.position.set(0, -1.1, 0)
  g.add(brilhoBase)
  const num = sprite(telas.textura(telas.numeroEtapa(numero), 256, 180), 1.5, 1.05)
  num.position.set(-2.7, 3.9, -1.2)
  g.add(num)
  return {
    grupo: g,
    atualizar(tempo, foco) {
      materialAro.opacity = 0.25 + foco * 0.75
      num.material.opacity = foco * foco // só o número da etapa atual aparece
      num.visible = foco > 0.02
      brilhoBase.material.opacity = 0.2 + foco * 0.4
    },
  }
}

/* =========================== 1. Conversa inicial =========================== */
function conversa(kit) {
  const g = new THREE.Group()
  g.add(malha(kit.g.cilindro, kit.m.branco, [0, 0.86, 0], [1.05, 0.07, 1.05]))
  g.add(malha(kit.g.cilindro, kit.m.cinza, [0, 0.43, 0], [0.09, 0.86, 0.09]))
  g.add(malha(kit.g.cilindro, kit.m.cinza, [0, 0.03, 0], [0.45, 0.05, 0.45]))
  const folha = malha(kit.g.caixaLisa, kit.m.branco, [0.25, 0.91, 0.2], [0.42, 0.01, 0.3])
  folha.rotation.y = 0.4
  g.add(folha)

  const cliente = pessoa(kit, kit.m.rosa, -1.65, 0.2)
  const comercial = pessoa(kit, kit.m.azul, 1.65, 0.2)
  g.add(cliente, comercial)
  g.add(rotulo('Você', -1.65, 2.05, 0.2), rotulo('Comercial', 1.65, 2.05, 0.2, '#2f6fed'))

  const balaoA = balao(kit)
  balaoA.position.set(-1.05, 2.75, 0.25)
  const balaoB = balao(kit)
  balaoB.position.set(1.05, 2.95, 0.25)
  balaoB.scale.x = -1
  g.add(balaoA, balaoB)

  const ideia = new THREE.Group()
  ideia.add(malha(kit.g.esfera, kit.m.amarelo, [0, 0, 0], [0.24, 0.24, 0.24]))
  ideia.add(malha(kit.g.cilindro, kit.m.cinza, [0, -0.28, 0], [0.1, 0.12, 0.1]))
  const halo = sprite(kit.texturas.brilho, 1.9, 1.9, true)
  halo.material.color.set('#ffc94d')
  ideia.add(halo)
  ideia.position.set(0, 1.75, 0)
  g.add(ideia)

  const aprovado = sprite(kit.texturas.selo, 0.85)
  aprovado.position.set(0, 2.45, 0.2)
  g.add(aprovado)

  return {
    grupo: g,
    atualizar(t, foco) {
      respirar(cliente, t)
      respirar(comercial, t)
      // quem fala se alterna; a ideia acende e, por fim, vem a aprovação
      const ciclo = (t * 0.55) % 2
      const fala = (x) => (x < 1 ? pop(Math.min(1, x * 5)) * (x > 0.85 ? (1 - x) / 0.15 : 1) : 0)
      balaoA.scale.setScalar(Math.max(0.0001, fala(ciclo) * foco))
      const sB = Math.max(0.0001, fala(ciclo - 1) * foco)
      balaoB.scale.set(-sB, sB, sB)
      const luz = entre(foco, 0.3, 0.9)
      ideia.scale.setScalar(Math.max(0.0001, luz))
      ideia.position.y = 1.75 + Math.sin(t * 2) * 0.06
      halo.material.opacity = 0.5 + Math.sin(t * 3) * 0.2
      const s = pop(entre(foco, 0.82, 1)) * 0.85
      aprovado.scale.set(Math.max(0.0001, s), Math.max(0.0001, s), 1)
      aprovado.position.y = 3.15 + Math.sin(t * 1.5) * 0.05
    },
  }
}

/* =========================== 2. Gerente de projetos =========================== */
function gerente(kit) {
  const g = new THREE.Group()
  const cliente = pessoa(kit, kit.m.rosa, -2.55, 0.75)
  const gestor = pessoa(kit, kit.m.branco, -0.95, 1.35, 1.08)
  g.add(cliente, gestor)
  g.add(rotulo('Você', -2.55, 2.0, 0.75), rotulo('Seu gerente', -0.95, 2.45, 1.35, '#2f6fed'))
  const destaque = malha(kit.g.anel, kit.m.luzRosa, [-0.95, 0.04, 1.35], [0.6, 0.6, 0.6])
  destaque.rotation.x = Math.PI / 2
  g.add(destaque)

  const doc = painel(kit, telas.textura(telas.documento, 512, 660), 1.75, 2.25)
  doc.position.set(0.95, 1.7, -0.6)
  doc.rotation.y = -0.28
  g.add(doc)

  // cronograma: barras que crescem como num gráfico de Gantt
  const cores = [kit.m.rosa, kit.m.azul, kit.m.branco, kit.m.verde]
  const barras = [0.9, 1.25, 0.75, 1.05].map((comprimento, i) => {
    const b = malha(kit.g.barra, cores[i], [2.05 + i * 0.16, 0.55 + i * 0.36, 0.55], [comprimento, 0.2, 0.2])
    b.userData.comprimento = comprimento
    g.add(b)
    return b
  })
  g.add(malha(kit.g.caixaLisa, kit.m.cinza, [2.0, 1.1, 0.55], [0.03, 1.55, 0.03]))
  g.add(rotulo('Prazos', 2.75, 2.15, 0.55, '#16357a'))

  return {
    grupo: g,
    atualizar(t, foco) {
      respirar(cliente, t)
      respirar(gestor, t)
      const pulso = 0.6 + Math.sin(t * 3) * 0.06
      destaque.scale.set(pulso, pulso, pulso)
      barras.forEach((b, i) => {
        b.scale.x = Math.max(0.0001, b.userData.comprimento * entre(foco, 0.35 + i * 0.12, 0.7 + i * 0.1))
      })
      doc.position.y = 1.7 + Math.sin(t * 1.2) * 0.04
    },
  }
}

/* =========================== 3. Protótipo no Figma =========================== */
function prototipo(kit) {
  const g = new THREE.Group()
  const quadro = painel(kit, telas.textura(telas.figma, 1024, 700), 3.2, 2.19)
  quadro.position.set(0.75, 1.85, -0.75)
  quadro.rotation.y = -0.22
  g.add(quadro)
  for (const x of [-1.1, 1.1]) {
    const perna = malha(kit.g.cilindro, kit.m.cinza, [0.75 + x * 0.96, 0.38, -0.75 + x * 0.24], [0.04, 0.76, 0.04])
    g.add(perna)
  }
  // quem está mais ao fundo ganha o rótulo mais alto, senão a perspectiva sobrepõe os dois
  const cliente = pessoa(kit, kit.m.rosa, -2.45, 0.85)
  const designer = pessoa(kit, kit.m.azul, -0.65, 1.6)
  g.add(cliente, designer)
  g.add(rotulo('Você', -2.45, 2.55, 0.85), rotulo('Prototipagem', -0.65, 1.95, 1.6, '#2f6fed'))

  const aprovado = sprite(kit.texturas.selo, 1.1)
  aprovado.position.set(2.45, 3.1, -0.2)
  g.add(aprovado)
  const anelSelo = sprite(kit.texturas.brilho, 2.4, 2.4, true)
  anelSelo.material.color.set('#2ee88e')
  anelSelo.position.copy(aprovado.position)
  g.add(anelSelo)

  return {
    grupo: g,
    atualizar(t, foco) {
      respirar(cliente, t)
      respirar(designer, t)
      const s = pop(entre(foco, 0.75, 1)) * 1.1
      aprovado.scale.set(Math.max(0.0001, s), Math.max(0.0001, s), 1)
      anelSelo.material.opacity = entre(foco, 0.85, 1) * (0.5 + Math.sin(t * 4) * 0.25)
    },
  }
}

/* =========================== 4. Front-end =========================== */
function frontend(kit) {
  const g = new THREE.Group()
  g.add(mesa(kit, 2.8, 1.2))
  const monitor = painel(kit, telas.textura(telas.codigo, 1024, 620), 2.35, 1.42)
  monitor.position.set(0, 1.85, -0.35)
  g.add(monitor)
  g.add(malha(kit.g.cilindro, kit.m.moldura, [0, 1.05, -0.42], [0.06, 0.35, 0.06]))
  g.add(malha(kit.g.caixa, kit.m.moldura, [0, 0.91, -0.42], [0.6, 0.03, 0.3]))
  g.add(malha(kit.g.caixa, kit.m.escuro, [0, 0.91, 0.18], [0.95, 0.03, 0.3]))

  const dev = pessoa(kit, kit.m.azul, -2.05, 0.75)
  g.add(dev, rotulo('Front-end', -2.05, 2.05, 0.75, '#2f6fed'))

  // componentes de interface que se encaixam na frente da tela
  const pecas = [
    [kit.g.caixa, kit.m.rosa, [0.7, 0.22, 0.07], [3.0, 2.9, 0.9], [0.62, 1.32, -0.18]],
    [kit.g.caixa, kit.m.branco, [0.56, 0.4, 0.05], [3.3, 1.9, 0.4], [0.62, 2.12, -0.2]],
    [kit.g.caixa, kit.m.cinza, [0.62, 0.16, 0.05], [2.6, 3.4, 0.2], [0.62, 1.68, -0.19]],
    [kit.g.esfera, kit.m.azul, [0.12, 0.12, 0.05], [2.9, 1.2, 1.2], [0.3, 2.12, -0.15]],
    [kit.g.caixa, kit.m.verde, [0.3, 0.14, 0.06], [2.3, 2.4, 1.3], [0.95, 2.52, -0.19]],
  ].map(([geo, mat, escala, longe, perto]) => {
    const p = malha(geo, mat, longe, escala)
    p.userData = { longe: new THREE.Vector3(...longe), perto: new THREE.Vector3(...perto), fase: Math.random() * 6 }
    g.add(p)
    return p
  })

  return {
    grupo: g,
    atualizar(t, foco) {
      respirar(dev, t)
      const encaixe = entre(foco, 0.35, 0.95)
      for (const p of pecas) {
        p.position.lerpVectors(p.userData.longe, p.userData.perto, encaixe)
        p.position.y += Math.sin(t * 1.6 + p.userData.fase) * 0.08 * (1 - encaixe)
        p.rotation.y = (1 - encaixe) * Math.sin(t + p.userData.fase) * 0.6
      }
    },
  }
}

/* =========================== 5. Back-end =========================== */
function backend(kit) {
  const g = new THREE.Group()
  const leds = []
  const coresLed = [kit.m.luzVerde, kit.m.luzAzul, kit.m.luzRosa]
  for (const [x, z] of [[1.25, -0.85], [2.4, -0.45]]) {
    g.add(malha(kit.g.caixa, kit.m.escuro, [x, 1.15, z], [0.95, 2.3, 0.9]))
    for (let k = 0; k < 7; k++) {
      const led = malha(kit.g.caixaLisa, coresLed[(k + Math.round(x)) % 3], [x - 0.12, 0.4 + k * 0.28, z + 0.46], [0.5, 0.05, 0.02])
      led.userData = { fase: Math.random() * 10, ritmo: 2 + Math.random() * 5 }
      leds.push(led)
      g.add(led)
    }
  }
  // banco de dados: cilindros empilhados
  for (let k = 0; k < 3; k++) {
    g.add(malha(kit.g.cilindro, kit.m.azul, [-1.0, 0.22 + k * 0.42, -0.4], [0.62, 0.34, 0.62]))
    const anel = malha(kit.g.anel, kit.m.luzAzul, [-1.0, 0.41 + k * 0.42, -0.4], [0.63, 0.63, 0.5])
    anel.rotation.x = Math.PI / 2
    g.add(anel)
  }
  const dev = pessoa(kit, kit.m.azul, -2.35, 1.05)
  g.add(dev, rotulo('Back-end', -2.35, 2.05, 1.05, '#2f6fed'))

  // ligações por onde os dados passam
  const ligacoes = [
    new THREE.QuadraticBezierCurve3(new THREE.Vector3(-1.0, 1.3, -0.4), new THREE.Vector3(0.1, 3.1, -0.6), new THREE.Vector3(1.25, 2.35, -0.85)),
    new THREE.QuadraticBezierCurve3(new THREE.Vector3(-1.0, 1.3, -0.4), new THREE.Vector3(0.8, 3.6, -0.2), new THREE.Vector3(2.4, 2.35, -0.45)),
  ]
  const materialFio = new THREE.MeshBasicMaterial({ color: '#7aa2ff', transparent: true, opacity: 0.45 })
  const pacotes = []
  ligacoes.forEach((curva, c) => {
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 40, 0.018, 6, false), materialFio))
    for (let k = 0; k < 4; k++) {
      const p = malha(kit.g.esfera, c ? kit.m.luzRosa : kit.m.luzVerde, [0, 0, 0], [0.07, 0.07, 0.07])
      p.userData = { curva, deslocamento: k / 4 }
      pacotes.push(p)
      g.add(p)
    }
  })

  return {
    grupo: g,
    atualizar(t, foco) {
      respirar(dev, t)
      for (const led of leds) led.visible = Math.sin(t * led.userData.ritmo + led.userData.fase) > -0.3
      const velocidade = 0.15 + foco * 0.35
      for (const p of pacotes) {
        p.position.copy(p.userData.curva.getPoint((t * velocidade + p.userData.deslocamento) % 1))
        p.visible = foco > 0.15
      }
    },
  }
}

/* =========================== 6. Ambiente de testes =========================== */
function testes(kit) {
  const g = new THREE.Group()
  g.add(mesa(kit, 2.2, 1.2, 0.8))
  g.add(malha(kit.g.caixa, kit.m.moldura, [0.1, 0.85, -0.05], [1.55, 0.05, 0.98]))
  const dobradica = new THREE.Group()
  dobradica.position.set(0.1, 0.87, -0.52)
  dobradica.rotation.x = -0.2
  const tela = painel(kit, telas.textura(telas.ambienteTestes, 1000, 560), 1.55, 0.87, 0.04)
  tela.position.y = 0.48
  dobradica.add(tela)
  g.add(dobradica)

  const fone = painel(kit, telas.textura(telas.celular, 300, 600), 0.5, 1.0, 0.06)
  fone.position.set(1.85, 1.55, 0.35)
  fone.rotation.y = -0.4
  g.add(fone)

  const lista = new THREE.Group()
  lista.position.set(-1.45, 2.95, -0.9)
  lista.rotation.y = 0.25
  const placa = new THREE.Mesh(
    kit.g.plano,
    new THREE.MeshBasicMaterial({ map: telas.textura(telas.checklist, 380, 360), transparent: true, toneMapped: false }),
  )
  placa.scale.set(1.5, 1.42, 1)
  lista.add(placa)
  g.add(lista)
  const marcas = [0, 1, 2].map((k) => {
    const s = sprite(kit.texturas.selo, 0.26)
    s.renderOrder = 2 // desenha depois da placa, senão fica escondido atrás dela
    // centro de cada caixinha do desenho (380 x 360), convertido para a placa de 1,5 x 1,42
    s.position.set(-0.75 + (54 / 380) * 1.5, 0.71 - ((122 + k * 74) / 360) * 1.42, 0.02)
    lista.add(s)
    return s
  })

  const cliente = pessoa(kit, kit.m.rosa, -1.75, 1.0)
  g.add(cliente, rotulo('Você', -1.75, 2.05, 1.0))

  const servidor = malha(kit.g.caixa, kit.m.escuro, [-2.6, 0.55, -0.95], [0.6, 1.1, 0.6])
  const sinal = malha(kit.g.esfera, kit.m.amarelo, [-2.6, 1.22, -0.95], [0.12, 0.12, 0.12])
  g.add(servidor, sinal)

  return {
    grupo: g,
    atualizar(t, foco) {
      respirar(cliente, t)
      fone.position.y = 1.55 + Math.sin(t * 1.3) * 0.06
      marcas.forEach((m, k) => {
        const s = pop(entre(foco, 0.5 + k * 0.14, 0.62 + k * 0.14)) * 0.26
        m.scale.set(Math.max(0.0001, s), Math.max(0.0001, s), 1)
      })
      sinal.visible = Math.sin(t * 4) > -0.2
    },
  }
}

/* =========================== 7. Migração e entrega =========================== */
function entrega(kit) {
  const g = new THREE.Group()
  const base = new THREE.Vector3(0.9, 0.2, -0.35)
  g.add(malha(kit.g.cilindro, kit.m.escuro, [base.x, 0.1, base.z], [1.15, 0.2, 1.15]))
  const aroBase = malha(kit.g.anel, kit.m.luzRosa, [base.x, 0.21, base.z], [1.15, 1.15, 0.6])
  aroBase.rotation.x = Math.PI / 2
  g.add(aroBase)

  const foguete = new THREE.Group()
  foguete.add(malha(kit.g.cilindro, kit.m.branco, [0, 0.95, 0], [0.36, 1.5, 0.36]))
  foguete.add(malha(kit.g.cone, kit.m.rosa, [0, 2.05, 0], [0.36, 0.7, 0.36]))
  const janela = malha(kit.g.cilindro, kit.m.azul, [0, 1.3, 0.34], [0.14, 0.06, 0.14])
  janela.rotation.x = Math.PI / 2
  foguete.add(janela)
  for (let k = 0; k < 3; k++) {
    const aleta = new THREE.Group()
    aleta.rotation.y = (k / 3) * Math.PI * 2 + 0.5
    aleta.add(malha(kit.g.caixa, kit.m.rosa, [0.42, 0.42, 0], [0.32, 0.55, 0.06]))
    foguete.add(aleta)
  }
  const chama = malha(kit.g.cone, kit.m.amarelo, [0, -0.12, 0], [0.22, 0.55, 0.22])
  chama.rotation.x = Math.PI
  foguete.add(chama)
  const rastro = sprite(kit.texturas.brilho, 1.6, 3.2, true)
  rastro.material.color.set('#ff9a3c')
  rastro.position.y = -0.7
  foguete.add(rastro)
  foguete.position.copy(base)
  g.add(foguete)

  // globo de "no ar"
  const globo = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.85, 2),
    new THREE.MeshBasicMaterial({ color: '#7aa2ff', wireframe: true, transparent: true, opacity: 0.55 }),
  )
  globo.position.set(2.75, 3.0, -1.5)
  const nucleo = malha(kit.g.esfera, kit.m.azul, [2.75, 3.0, -1.5], [0.55, 0.55, 0.55])
  g.add(globo, nucleo)

  const cliente = pessoa(kit, kit.m.rosa, -2.55, 0.95)
  const equipe = pessoa(kit, kit.m.azul, -0.75, 1.6)
  g.add(cliente, equipe, rotulo('Você', -2.55, 2.55, 0.95), rotulo('Equipe Fortram', -0.75, 1.95, 1.6, '#2f6fed'))

  // confete
  const qtd = 90
  const posicoes = new Float32Array(qtd * 3)
  const cores = new Float32Array(qtd * 3)
  const paleta = ['#fb03a9', '#7aa2ff', '#ffffff', '#ffd166', '#4ff0a0'].map((c) => new THREE.Color(c))
  const velocidades = []
  for (let i = 0; i < qtd; i++) {
    paleta[i % paleta.length].toArray(cores, i * 3)
    velocidades.push(new THREE.Vector3((Math.random() - 0.5) * 2.2, 2 + Math.random() * 2.5, (Math.random() - 0.5) * 2.2))
  }
  const geoConfete = new THREE.BufferGeometry()
  geoConfete.setAttribute('position', new THREE.BufferAttribute(posicoes, 3))
  geoConfete.setAttribute('color', new THREE.BufferAttribute(cores, 3))
  const confete = new THREE.Points(geoConfete, new THREE.PointsMaterial({ size: 0.11, vertexColors: true, transparent: true }))
  g.add(confete)

  let anterior = 0
  let voo = 0
  return {
    grupo: g,
    atualizar(t, foco) {
      const dt = Math.min(0.05, t - anterior)
      anterior = t
      respirar(cliente, t)
      respirar(equipe, t)
      globo.rotation.y = t * 0.3
      // decola quando a etapa está em foco; depois de sair da tela, volta para a base e decola de novo
      voo = foco > 0.8 ? voo + dt : 0
      const subida = Math.max(0, voo - 0.5)
      const tremendo = voo > 0 && voo < 0.5 ? Math.sin(voo * 90) * 0.02 : 0
      foguete.position.set(base.x + tremendo, base.y + subida * subida * 2.4, base.z)
      if (foguete.position.y > 16) voo = -0.8
      chama.scale.set(0.22, 0.45 + Math.random() * 0.25 + (subida > 0 ? 0.4 : 0), 0.22)
      rastro.material.opacity = voo > 0 ? 0.55 + Math.random() * 0.3 : 0.15
      // confete sobe e cai junto com a decolagem
      const p = confete.geometry.attributes.position
      const tc = Math.max(0, voo - 0.4)
      for (let i = 0; i < qtd; i++) {
        const v = velocidades[i]
        p.setXYZ(i, base.x + v.x * tc, base.y + 0.5 + v.y * tc - 2.4 * tc * tc, base.z + v.z * tc)
      }
      p.needsUpdate = true
      confete.visible = tc > 0 && tc < 2.4
      confete.material.opacity = 1 - tc / 2.4
    },
  }
}

/** As estações na ordem da jornada (a mesma ordem das etapas no HTML) */
export const ESTACOES = [conversa, gerente, prototipo, frontend, backend, testes, entrega]
