<?php
/**
 * POST api/contato.php
 * Recebe o formulário de contato das landing pages e envia por e-mail.
 * Responde { "ok": true } ou { "ok": false, "erro": "mensagem para o visitante" }.
 */

declare(strict_types=1);
require __DIR__ . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responderJson(405, ['ok' => false, 'erro' => 'Use o formulário da página para enviar.']);
}

if (CONTATO_EMAIL_DESTINO === '') {
    responderJson(503, ['ok' => false, 'erro' => 'O envio de mensagens ainda não foi configurado neste site.']);
}

/**
 * Tira espaços, quebras de linha (quando não são permitidas) e corta no tamanho máximo.
 */
function campo(string $nome, int $maximo, bool $multilinha = false): string
{
    $valor = trim((string) ($_POST[$nome] ?? ''));
    if (!$multilinha) {
        $valor = preg_replace('/[\r\n\t]+/', ' ', $valor);
    }
    return mb_substr($valor, 0, $maximo);
}

// Armadilhas para robôs: o campo "site" fica escondido para pessoas e o
// formulário não pode ser enviado em menos de 3 segundos. Robô recebe "ok" e nada é enviado.
$abertoEm = (int) ($_POST['inicio'] ?? 0);
if (campo('site', 200) !== '' || ($abertoEm > 0 && (microtime(true) * 1000 - $abertoEm) < 3000)) {
    responderJson(200, ['ok' => true]);
}

$nome = campo('nome', 120);
$email = campo('email', 160);
$telefone = campo('telefone', 40);
$empresa = campo('empresa', 120);
$tipo = campo('tipo', 80);
$mensagem = campo('mensagem', 4000, true);
$pagina = campo('pagina', 80);

if (mb_strlen($nome) < 2) {
    responderJson(422, ['ok' => false, 'erro' => 'Conte pra gente o seu nome.']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responderJson(422, ['ok' => false, 'erro' => 'Confira o seu e-mail.']);
}
if (mb_strlen($mensagem) < 10) {
    responderJson(422, ['ok' => false, 'erro' => 'Escreva um pouco mais sobre o que você quer construir.']);
}

// Limite de envios por visitante (por IP), guardado na pasta temporária do servidor
$pastaLimite = sys_get_temp_dir() . '/fortram-contato';
if (!is_dir($pastaLimite)) {
    @mkdir($pastaLimite, 0700, true);
}
$arquivoLimite = $pastaLimite . '/' . hash('sha256', $_SERVER['REMOTE_ADDR'] ?? 'desconhecido') . '.json';
$agora = time();
$envios = array_filter((array) json_decode((string) @file_get_contents($arquivoLimite), true), function ($momento) use ($agora) {
    return is_int($momento) && $momento > $agora - 3600;
});
if (count($envios) >= CONTATO_LIMITE_POR_HORA) {
    responderJson(429, ['ok' => false, 'erro' => 'Recebemos várias mensagens suas agora há pouco. Tente de novo mais tarde.']);
}

$assunto = 'Novo contato pelo site: ' . $nome . ($empresa !== '' ? " ($empresa)" : '');
$corpo = implode("\n", [
    "Nome: $nome",
    "E-mail: $email",
    'WhatsApp: ' . ($telefone !== '' ? $telefone : '-'),
    'Empresa: ' . ($empresa !== '' ? $empresa : '-'),
    'Tipo de projeto: ' . ($tipo !== '' ? $tipo : '-'),
    'Página: ' . ($pagina !== '' ? $pagina : '-'),
    '',
    'Mensagem:',
    $mensagem,
    '',
    '--',
    'Enviado em ' . date('d/m/Y H:i') . ' pelo formulário do site.',
]);

$cabecalhos = implode("\r\n", [
    'From: ' . mb_encode_mimeheader(CONTATO_NOME_REMETENTE, 'UTF-8') . ' <' . emailRemetente() . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);

if (!mail(CONTATO_EMAIL_DESTINO, mb_encode_mimeheader($assunto, 'UTF-8'), $corpo, $cabecalhos)) {
    responderJson(500, ['ok' => false, 'erro' => 'Não conseguimos enviar agora. Tente de novo ou fale com a gente pelo WhatsApp.']);
}

$envios[] = $agora;
@file_put_contents($arquivoLimite, json_encode(array_values($envios)), LOCK_EX);

responderJson(200, ['ok' => true]);
