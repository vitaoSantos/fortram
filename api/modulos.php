<?php
/**
 * GET api/modulos.php
 * Devolve o catálogo de módulos do Nown usado nas landing pages.
 */

declare(strict_types=1);
require __DIR__ . '/config.php';

/**
 * De onde vêm os módulos.
 *
 * Hoje o catálogo está em data/modulos.json. Para mostrar o número real de
 * módulos instalados, troque o conteúdo desta função por uma leitura do
 * servidor do Nown e preencha "total" com a contagem.
 */
function carregarModulos(): array
{
    $dados = lerJson(ARQUIVO_MODULOS);
    if ($dados === null) {
        responderJson(500, ['erro' => 'Não foi possível ler data/modulos.json.']);
    }
    return $dados;
}

responderJson(200, carregarModulos());
