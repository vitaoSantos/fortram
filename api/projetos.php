<?php
/**
 * GET api/projetos.php
 * Devolve os projetos exibidos nas landing pages:
 * { "mostrar_secao": bool, "mostrar_modulos": bool, "projetos": [...] }
 */

declare(strict_types=1);
require __DIR__ . '/config.php';

/**
 * De onde vêm os projetos.
 *
 * Hoje a lista está em data/projetos.json. Quando os projetos passarem a vir
 * direto do servidor do Nown (por exemplo, lendo os módulos principais de cada
 * cliente), basta trocar o conteúdo desta função: o resto da API e as três
 * landing pages continuam iguais, desde que cada projeto mantenha os mesmos campos.
 */
function carregarProjetos(): array
{
    $dados = lerJson(ARQUIVO_PROJETOS);
    if ($dados === null) {
        responderJson(500, ['erro' => 'Não foi possível ler data/projetos.json.']);
    }
    return $dados;
}

$dados = carregarProjetos();
$projetos = array_filter($dados['projetos'] ?? [], function (array $p): bool {
    return ($p['visivel'] ?? true) === true;
});
usort($projetos, function (array $a, array $b): int {
    return ($a['ordem'] ?? 999) <=> ($b['ordem'] ?? 999);
});

responderJson(200, [
    'mostrar_secao' => $dados['mostrar_secao'] ?? true,
    'mostrar_modulos' => $dados['mostrar_modulos'] ?? true,
    'projetos' => array_values($projetos),
]);
