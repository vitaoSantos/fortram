<?php
/**
 * Configurações do back-end das landing pages.
 *
 * Este é o único arquivo que precisa ser editado ao publicar o site:
 * preencha o e-mail que recebe os contatos e o remetente do seu domínio.
 */

// E-mail que recebe as mensagens do formulário de contato.
// Enquanto estiver vazio, o formulário responde que ainda não foi configurado.
define('CONTATO_EMAIL_DESTINO', '');

// Remetente das mensagens. Na HostGator ele precisa ser um e-mail do próprio
// domínio do site (ex.: nao-responda@fortram.site), senão o envio é bloqueado.
// Se ficar vazio, usa nao-responda@ + o domínio em que o site está aberto.
define('CONTATO_EMAIL_REMETENTE', '');
define('CONTATO_NOME_REMETENTE', 'Site Fortram');

// Quantos envios cada visitante pode fazer por hora.
define('CONTATO_LIMITE_POR_HORA', 5);

// Arquivos de dados lidos pelas APIs.
define('ARQUIVO_PROJETOS', __DIR__ . '/../data/projetos.json');
define('ARQUIVO_MODULOS', __DIR__ . '/../data/modulos.json');

/**
 * Remetente das mensagens: o configurado acima ou nao-responda@ + domínio do site
 * (só letras, números, ponto e hífen; sem a porta).
 */
function emailRemetente(): string
{
    if (CONTATO_EMAIL_REMETENTE !== '') {
        return CONTATO_EMAIL_REMETENTE;
    }
    $dominio = strtolower(explode(':', (string) ($_SERVER['HTTP_HOST'] ?? ''))[0]);
    $dominio = preg_replace('/[^a-z0-9.-]/', '', preg_replace('/^www\./', '', $dominio));
    return 'nao-responda@' . ($dominio !== '' ? $dominio : 'localhost');
}

/**
 * Responde em JSON e encerra.
 * Sem cache: uma alteração em data/*.json aparece na hora para quem abrir a página.
 */
function responderJson(int $status, array $dados): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-cache');
    echo json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Lê um arquivo JSON e devolve como array. Devolve null se não existir ou estiver quebrado.
 */
function lerJson(string $arquivo): ?array
{
    if (!is_readable($arquivo)) {
        return null;
    }
    $dados = json_decode((string) file_get_contents($arquivo), true);
    return is_array($dados) ? $dados : null;
}
