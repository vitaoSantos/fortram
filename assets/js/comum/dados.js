import { CONFIG } from './config.js'

/**
 * Busca o primeiro endereço que responder com JSON válido.
 * Assim a página funciona com a API em PHP (HostGator) e também sem PHP, lendo o .json direto.
 */
async function buscarPrimeiro(enderecos) {
  for (const endereco of enderecos) {
    try {
      const resposta = await fetch(endereco, { headers: { Accept: 'application/json' } })
      if (resposta.ok) return await resposta.json()
    } catch {
      // Sem PHP o servidor devolve o código-fonte em vez de JSON: tenta o próximo endereço
    }
  }
  return null
}

let projetos
let modulos

/**
 * Projetos visíveis, na ordem definida no campo "ordem".
 * Devolve { mostrar: boolean, projetos: [...] }. A busca acontece uma vez só por página.
 * Com "mostrar_modulos": false nos dados, os módulos de cada projeto não aparecem em lugar nenhum.
 */
export function carregarProjetos() {
  projetos ??= buscarPrimeiro(CONFIG.projetos).then((dados) => {
    const lista = (dados?.projetos ?? [])
      .filter((p) => p.visivel !== false)
      .sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999))
      .map((p) => (dados.mostrar_modulos === false ? { ...p, modulo_principal: null, modulos: [] } : p))
    return { mostrar: dados?.mostrar_secao !== false && lista.length > 0, projetos: lista }
  })
  return projetos
}

/**
 * Catálogo de módulos do Nown: { total, base, grupos: [...], modelos: [...] }.
 */
export function carregarModulos() {
  modulos ??= buscarPrimeiro(CONFIG.modulos).then((dados) => dados ?? { total: 0, base: [], grupos: [], modelos: [] })
  return modulos
}
