# Landing pages da Fortram: documentação

Este projeto tem **três propostas de landing page** para a Fortram e o Nown, feitas para a votação interna, e uma página para escolher entre elas:

| Arquivo | O que é |
| --- | --- |
| `index.html` | Página interna de escolha: mostra as três versões lado a lado (fica fora do Google). |
| `v1-corporativa.html` | **Versão 1, corporativa.** Profissional e sem 3D, com o produto em primeiro plano. |
| `v2-processo-3d.html` | **Versão 2, a jornada em 3D.** O processo da Fortram contado em 3D, etapa por etapa. |
| `v3-hibrida.html` | **Versão 3, híbrida.** O meio-termo: um pouco de animação, um pouco de 3D (só com CSS) e telas mockadas. |

Tudo foi feito com **HTML, CSS, JavaScript puro e PHP**, sem framework, sem TypeScript e sem etapa de compilação: o que está nesta pasta é exatamente o que vai para o servidor.

---

## Sumário

1. [Por que JavaScript puro e não TypeScript](#1-por-que-javascript-puro-e-não-typescript)
2. [O JavaScript usado aqui, para quem vem do JS clássico](#2-o-javascript-usado-aqui-para-quem-vem-do-js-clássico)
3. [Estrutura de pastas](#3-estrutura-de-pastas)
4. [Como abrir no computador](#4-como-abrir-no-computador)
5. [Como editar o conteúdo](#5-como-editar-o-conteúdo)
6. [Como cada versão funciona](#6-como-cada-versão-funciona)
7. [API em PHP](#7-api-em-php)
8. [Como publicar na HostGator](#8-como-publicar-na-hostgator)
9. [Depois da votação](#9-depois-da-votação)
10. [Acessibilidade, desempenho e SEO](#10-acessibilidade-desempenho-e-seo)
11. [O que foi feito, o que não foi feito e o que conferir](#11-o-que-foi-feito-o-que-não-foi-feito-e-o-que-conferir)

---

## 1. Por que JavaScript puro e não TypeScript

**Decisão: JavaScript puro (moderno), sem TypeScript.**

TypeScript é JavaScript com tipos. O navegador não entende arquivos `.ts`: eles precisam ser **compilados** para `.js` antes de ir para o servidor. Para esta landing page, os custos disso são maiores que os ganhos:

| | JavaScript puro (escolhido) | TypeScript |
| --- | --- | --- |
| O que vai para o servidor | Os próprios arquivos que você edita | Arquivos `.js` gerados a partir dos `.ts` |
| Ferramentas no computador | Nenhuma (só um editor) | Node.js, npm e o compilador `tsc` |
| Corrigir um texto ou um bug no servidor | Edita o arquivo e pronto | Edita o `.ts`, compila e envia o `.js` de novo |
| Risco de manutenção | Baixo | Alguém editar o `.js` gerado direto no servidor e perder na próxima compilação |
| Curva de aprendizado | Nenhuma para quem já usa JS | Sintaxe de tipos, `tsconfig.json`, compilação |
| Ganho real aqui | | Pequeno: são ~2.500 linhas de JS (contando os comentários) divididas em arquivos curtos, com dados que vêm do nosso próprio JSON |

TypeScript vale a pena em **aplicações grandes**, com muitas telas e várias pessoas mexendo no mesmo código ao mesmo tempo (o front-end do próprio Nown, por exemplo). Uma landing page não é esse caso.

**O que foi feito no lugar, para o código continuar seguro de manter:**

- Funções curtas, com nomes em português e um comentário explicando o que cada uma faz.
- Comentários no formato **JSDoc** (`/** @param ... */`) nas funções principais, que o VS Code usa para mostrar dicas.
- Configurações em um lugar só (`assets/js/comum/config.js` e `api/config.php`).
- Conteúdo separado do código: projetos e módulos ficam em arquivos JSON.

**Se um dia quiserem checagem de tipos sem mudar nada no servidor:** coloque `// @ts-check` na primeira linha de um arquivo `.js` e abra no VS Code. O editor passa a apontar erros usando os comentários JSDoc, e o arquivo continua sendo JavaScript comum: nada muda na publicação.

---

## 2. O JavaScript usado aqui, para quem vem do JS clássico

O código usa recursos do JavaScript moderno, todos suportados pelos navegadores atuais, sem precisar de nenhuma ferramenta:

**Módulos (`import` / `export`).** Em vez de vários `<script>` na ordem certa, cada página carrega **um** arquivo, e cada arquivo diz o que usa dos outros:

```html
<script type="module" src="assets/js/v1.js"></script>
```

```js
// assets/js/v1.js
import { carregarProjetos } from './comum/dados.js' // usa uma função de outro arquivo

// assets/js/comum/dados.js
export function carregarProjetos() { ... }           // deixa a função disponível para quem importar
```

Por causa dos módulos, **as páginas precisam ser abertas por um servidor** (`http://`), e não com dois cliques no arquivo (`file://`). Veja a seção 4.

**`async` / `await` e `fetch`.** É como os dados são lidos:

```js
const resposta = await fetch('api/projetos.php') // espera a resposta do servidor
const dados = await resposta.json()              // transforma o texto em objeto
```

**Operadores curtos:**

- `a ?? b`: usa `b` só se `a` for `null` ou `undefined` (ex.: `projeto.ordem ?? 999`).
- `a?.b`: lê `b` só se `a` existir, sem dar erro (ex.: `dados?.projetos`).
- `` `Olá, ${nome}` ``: texto com variáveis dentro.

**Função `el()`** (em `assets/js/comum/util.js`): cria elementos HTML pelo JavaScript.

```js
el('a', { href: '#contato', class: 'botao' }, 'Fale com a gente')
// cria: <a href="#contato" class="botao">Fale com a gente</a>
```

O texto entra sempre como **texto puro**, nunca como HTML. Por isso um nome de projeto com `<` ou `&` não quebra a página.

**Import map (só na versão 2).** O Three.js (a biblioteca de 3D) é importado como `'three'`. Um bloco no `<head>` diz ao navegador onde esse arquivo está:

```html
<script type="importmap">
  { "imports": { "three": "./assets/vendor/three/three.module.min.js", ... } }
</script>
```

---

## 3. Estrutura de pastas

```
fortram/
├── index.html                 Página interna de escolha entre as versões
├── v1-corporativa.html        Versão 1
├── v2-processo-3d.html        Versão 2
├── v3-hibrida.html            Versão 3
├── .htaccess                  Configurações do Apache (tipos de arquivo, cache, segurança)
├── DOCUMENTACAO.md            Este arquivo (o .htaccess bloqueia o acesso pelo navegador)
│
├── data/
│   ├── projetos.json          Projetos exibidos nas três versões
│   └── modulos.json           Catálogo de módulos do Nown usado nas versões 2 e 3
│
├── api/                       PHP que roda na HostGator
│   ├── config.php             Configurações: e-mail do formulário, limites, caminhos
│   ├── projetos.php           GET: devolve os projetos
│   ├── modulos.php            GET: devolve os módulos
│   └── contato.php            POST: recebe o formulário e envia por e-mail
│
└── assets/
    ├── css/
    │   ├── base.css           Comum às três: fontes, cores, botões, formulário, janela de projeto
    │   ├── v1.css             Só da versão 1
    │   ├── v2.css             Só da versão 2
    │   └── v3.css             Só da versão 3
    ├── js/
    │   ├── comum/             Comum às três versões
    │   │   ├── config.js      WhatsApp, e-mail e endereços dos dados
    │   │   ├── util.js        Funções pequenas (el, ícones, formatação)
    │   │   ├── dados.js       Busca projetos e módulos (API em PHP, com o JSON como reserva)
    │   │   ├── pagina.js      Topo, menu do celular, animação de entrada, contadores, WhatsApp
    │   │   ├── modal-projeto.js  Janela com os detalhes de um projeto
    │   │   └── contato.js     Envio do formulário
    │   ├── v1.js              Script da versão 1
    │   ├── v2.js              Script da versão 2
    │   ├── v2/                Partes da versão 2
    │   │   ├── cena-hero.js      Lebre 3D da abertura
    │   │   ├── cena-processo.js  A jornada em 3D (câmera, caminho, ilhas)
    │   │   ├── estacoes.js       As 7 estações, uma função por etapa
    │   │   ├── telas.js          Desenhos em canvas usados nas telas 3D
    │   │   └── esfera-modulos.js Esfera de módulos (HTML, sem WebGL)
    │   └── v3.js              Script da versão 3
    ├── fonts/                 Montserrat, Inter e JetBrains Mono (arquivos locais) + licenças
    ├── img/
    │   ├── marca/             Logos da Fortram e do Nown, favicon
    │   ├── projetos/          Telas dos projetos (1600x1000 e 800x500, WebP)
    │   ├── og/                Imagem de compartilhamento (WhatsApp, LinkedIn...)
    │   └── versoes/           Miniaturas usadas só na página de escolha
    └── vendor/three/          Three.js 0.186.1 (biblioteca de 3D, só a versão 2 usa)
```

**Nada é carregado de fora** (nem Google Fonts, nem CDN): fontes, ícones e o Three.js estão na própria pasta. O site funciona igual mesmo se um serviço externo sair do ar.

---

## 4. Como abrir no computador

Como o código usa módulos, as páginas precisam de um servidor. Com o PHP instalado, dentro da pasta do projeto:

```bash
php -S localhost:8000
```

Abra `http://localhost:8000` no navegador. Isso roda as páginas e a API em PHP, igual à HostGator.

Sem PHP, qualquer servidor de arquivos estáticos serve (ex.: a extensão **Live Server** do VS Code). Nesse caso os projetos são lidos direto de `data/projetos.json` e só o formulário não envia.

---

## 5. Como editar o conteúdo

### Textos

Os textos fixos (títulos, parágrafos, etapas, perguntas frequentes) estão no HTML de cada versão. Cada seção começa com um comentário, por exemplo `<!-- ===================== Processo ===================== -->`.

O **número de módulos** aparece em vários lugares com `<span data-total-modulos>273</span>`: não precisa trocar um por um, ele é atualizado a partir de `total` em `data/modulos.json`.

### Cores e fontes

As cores da marca estão no começo de `assets/css/base.css`:

```css
:root {
  --magenta: #fb03a9;        /* rosa do logo */
  --magenta-forte: #d4008a;  /* botões e textos pequenos (contraste melhor) */
  --azul: #042258;           /* azul-marinho do logo */
  ...
}
```

Cada versão ajusta o tema no começo do próprio CSS (`.v2 { --fundo: ...; }`).

### Projetos (`data/projetos.json`)

As três versões leem a mesma lista. Chaves gerais:

| Chave | Para que serve |
| --- | --- |
| `mostrar_secao` | `false` esconde a seção de projetos (e os links do menu) nas três versões. |
| `mostrar_modulos` | `false` esconde os módulos usados em cada projeto (chips e "Um projeto, vários módulos"). |
| `projetos` | A lista de projetos. |

Campos de cada projeto:

| Campo | Obrigatório | Onde aparece |
| --- | --- | --- |
| `slug` | sim | Identificador sem espaços e sem acentos (ex.: `facil-aqui`). |
| `nome` | sim | Título do projeto. |
| `segmento` | sim | Etiqueta acima do título e filtro da janela "Todos os projetos" (versão 2). |
| `resumo` | sim | Uma ou duas frases, nos cartões. |
| `sobre` | sim | Texto completo, na janela de detalhes. |
| `destaques` | sim | Lista de pontos fortes, na janela de detalhes (e no cartão grande da versão 3). |
| `modulo_principal` | não | Módulo criado para o cliente (ex.: `Fácil Aqui`), destacado em rosa. |
| `modulos` | não | Módulos do Nown usados no projeto. |
| `link` | não | Endereço do projeto no ar (botão "Visitar o projeto"). |
| `capa` | não | Tela 1600x1000. Sem ela, aparece uma capa com o nome do projeto. |
| `capa_pequena` | não | Tela 800x500 (cartões menores carregam mais rápido). |
| `destaque` | não | `false` tira o projeto da faixa horizontal da versão 2 (ele continua em "Todos os projetos"). |
| `visivel` | não | `false` esconde o projeto em todas as versões. |
| `ordem` | não | Posição na lista (menor aparece primeiro). |

**Para adicionar um projeto:**

1. Tire um print da página inicial do projeto e salve em `assets/img/projetos/` em dois tamanhos, no formato 16:10: `nome-1600.webp` (1600x1000) e `nome-800.webp` (800x500). Qualquer editor de imagem ou o site squoosh.app exporta em WebP.
2. Copie um projeto existente no JSON, cole no fim da lista (com uma vírgula depois do `}` anterior) e troque os campos.

```json
{
  "slug": "novo-projeto",
  "nome": "Novo Projeto",
  "segmento": "Educação",
  "resumo": "Uma frase sobre o projeto.",
  "sobre": "O texto completo.",
  "destaques": ["Primeiro destaque", "Segundo destaque"],
  "modulo_principal": "Novo Projeto",
  "modulos": ["Usuários", "Pagamento"],
  "link": "https://novoprojeto.com.br/",
  "capa": "assets/img/projetos/novoprojeto-1600.webp",
  "capa_pequena": "assets/img/projetos/novoprojeto-800.webp",
  "visivel": true,
  "ordem": 7
}
```

**Cuidado com o JSON:** uma vírgula sobrando ou faltando quebra o arquivo inteiro, e os projetos somem da página. Para conferir, rode na pasta do projeto:

```bash
php -r "json_decode(file_get_contents('data/projetos.json')); echo json_last_error_msg();"
```

A resposta precisa ser `No error`. Também dá para colar o conteúdo em jsonlint.com.

### Módulos (`data/modulos.json`)

| Chave | Onde aparece |
| --- | --- |
| `total` | Número de módulos em todas as versões. |
| `base` | Módulos que todo sistema recebe. Versão 3, "Monte seu projeto" (em azul). |
| `grupos` | Módulos agrupados por assunto. Versão 2 (esfera, 8 por grupo) e versão 3 (faixas, 12 por grupo). O `id` do grupo define a cor. |
| `modelos` | Tipos de projeto da versão 3, "Monte seu projeto": nome, descrição e os módulos daquele tipo (em rosa). |

A lista foi montada a partir do Gerenciador de Módulos mostrado no vídeo do Nown: são nomes reais, mas **é uma seleção, não os 273**. Revise e complete à vontade.

### WhatsApp e e-mail (`assets/js/comum/config.js`)

```js
whatsapp: '5535999999999', // DDI + DDD + número, só dígitos
email: 'contato@fortram.site',
```

**Enquanto `whatsapp` estiver vazio, todos os botões de WhatsApp ficam escondidos** (o flutuante e o da área de contato).

### Formulário de contato (`api/config.php`)

```php
define('CONTATO_EMAIL_DESTINO', 'comercial@fortram.site');      // quem recebe
define('CONTATO_EMAIL_REMETENTE', 'nao-responda@fortram.site'); // precisa ser do domínio do site
define('CONTATO_LIMITE_POR_HORA', 5);                           // envios por visitante, por hora
```

**Enquanto `CONTATO_EMAIL_DESTINO` estiver vazio, o formulário avisa que o envio ainda não foi configurado.** O e-mail chega com o "Responder" apontando para quem preencheu.

---

## 6. Como cada versão funciona

### Comum às três

- **`pagina.js`**: topo que ganha fundo ao rolar, menu do celular, entrada suave dos blocos (`data-revelar`), contadores (`data-contar`), botões de WhatsApp e o número de módulos.
- **`modal-projeto.js`**: a janela de detalhes do projeto, com o `<dialog>` nativo do navegador. Fecha com Esc, com o X ou clicando fora; as setas do teclado passam de projeto.
- **`contato.js`**: envia o formulário para `api/contato.php` sem recarregar a página. Tem duas armadilhas para robôs: um campo escondido (`site`) e um tempo mínimo de 3 segundos entre abrir a página e enviar.
- **`dados.js`**: busca `api/projetos.php`; se a API não responder (por exemplo, sem PHP), lê `data/projetos.json` direto.

### Versão 1: corporativa (`v1.js`, `v1.css`)

Sem 3D. As "telas" do painel do Nown, do manifest de um módulo e do celular com notificações são **desenhadas em HTML e CSS** (não são imagens): os textos podem ser editados no próprio HTML.

O JavaScript monta os cartões de projetos, a faixa com os nomes logo abaixo da abertura e as abas de "Um projeto, vários módulos" (só aparece se houver projetos com `modulos`).

### Versão 2: a jornada em 3D (`v2.js`, `v2/`, `v2.css`)

- **Abertura (`cena-hero.js`)**: a lebre é extrudada do arquivo `assets/img/marca/fortram-lebre.svg`; se o logo mudar, o 3D muda junto. Os cubos ao redor representam os módulos.
- **Jornada (`cena-processo.js`)**: sete ilhas, uma por etapa, ligadas por um caminho de luz. A seção tem a altura de sete telas; enquanto ela rola, o desenho 3D fica parado no fundo e a câmera vai de uma ilha para a outra. O ponto de luz que anda no caminho é o "seu projeto".
- **Estações (`estacoes.js`)**: cada etapa é uma função (`conversa`, `gerente`, `prototipo`, `frontend`, `backend`, `testes`, `entrega`) montada com formas simples do Three.js, sem modelos externos. A lista `ESTACOES`, no fim do arquivo, precisa ter a **mesma quantidade e a mesma ordem** das etapas do HTML (`<li class="etapa" data-etapa>`).
- **Telas (`telas.js`)**: o documento do gerente, o protótipo no Figma, o editor de código e o ambiente de testes são desenhados em canvas. Para mudar um desenho, edite a função dele.
- **Esfera de módulos (`esfera-modulos.js`)**: feita com elementos HTML (texto nítido e leve), gira sozinha e pode ser arrastada.
- **Projetos**: faixa horizontal que anda para o lado enquanto a página rola (no computador) ou carrossel com o dedo (no celular), igual ao portfólio. "Ver todos os projetos" abre uma janela com filtro por segmento.

**Desempenho e reservas:**

- O 3D só é desenhado enquanto está na tela e a aba está aberta.
- No celular a resolução é limitada e a câmera se afasta para caber a cena.
- **Sem WebGL** (navegador antigo ou desativado): a abertura mostra a lebre como imagem e a jornada vira uma lista de etapas.
- Com **"reduzir movimento"** ativado no sistema, as cenas não se animam sozinhas nem seguem o mouse: só acompanham a rolagem.

### Versão 3: híbrida (`v3.js`, `v3.css`)

- **Pilha de telas da abertura**: o efeito 3D é feito só com CSS (`transform: rotateX/rotateZ/translateZ`). As camadas inclinam acompanhando o mouse.
- **Faixas de módulos**: duas linhas que deslizam devagar; param quando o mouse passa por cima.
- **Processo com prévia**: cada `<li data-passo>` da lista corresponde a uma `<div data-tela>` da janela, **na mesma ordem**. A tela muda quando o passo chega ao meio da tela.
- **Monte seu projeto**: os botões vêm de `modelos` em `data/modulos.json`. "Quero um projeto assim" preenche o formulário com o tipo e os módulos escolhidos.
- **Projetos**: grade em que o primeiro projeto da lista fica em destaque, com os destaques dele.

---

## 7. API em PHP

| Endereço | Método | Resposta |
| --- | --- | --- |
| `api/projetos.php` | GET | `{ "mostrar_secao": true, "mostrar_modulos": true, "projetos": [...] }`, já sem os ocultos (`visivel: false`) e na ordem de `ordem`. |
| `api/modulos.php` | GET | O conteúdo de `data/modulos.json`. |
| `api/contato.php` | POST | `{ "ok": true }` ou `{ "ok": false, "erro": "mensagem para o visitante" }`. |

Códigos do `contato.php`: `200` enviado, `405` não é POST, `422` campo inválido, `429` limite por hora atingido, `500` o servidor não conseguiu enviar o e-mail, `503` e-mail de destino não configurado.

O limite de envios é guardado na pasta temporária do servidor, por IP (o IP é salvo embaralhado, com hash).

### Deixar os projetos dinâmicos, lendo do servidor do Nown

Hoje os projetos vêm de `data/projetos.json`. A ideia é, no futuro, ler direto do servidor do Nown (por exemplo, a partir do módulo principal de cada projeto). **Para isso, só a função `carregarProjetos()` em `api/projetos.php` precisa mudar**: as três versões continuam iguais, desde que cada projeto mantenha os campos da tabela da seção 5.

Um exemplo de como poderia ficar, lendo um arquivo JSON por projeto de uma pasta do servidor (o caminho e o formato são ilustrativos e dependem de como o Nown guarda essas informações):

```php
function carregarProjetos(): array
{
    $projetos = [];
    foreach (glob('/caminho/do/nown/projetos/*.json') as $arquivo) {
        $projeto = lerJson($arquivo);
        if ($projeto !== null) {
            $projetos[] = $projeto;
        }
    }
    return ['mostrar_secao' => true, 'mostrar_modulos' => true, 'projetos' => $projetos];
}
```

O mesmo vale para `carregarModulos()` em `api/modulos.php`: dá para trocar o `total` fixo pela contagem real de módulos instalados.

---

## 8. Como publicar na HostGator

### Antes de enviar

1. Em `api/config.php`, preencha `CONTATO_EMAIL_DESTINO` e `CONTATO_EMAIL_REMETENTE`.
2. Em `assets/js/comum/config.js`, preencha `whatsapp` (e `email`, se quiser).
3. No `<head>` da versão que vai ao ar, troque `content="assets/img/og/fortram.jpg"` da tag `og:image` pelo endereço completo (ex.: `https://fortram.site/assets/img/og/fortram.jpg`). WhatsApp e LinkedIn só mostram a imagem de compartilhamento com o endereço completo.

### Enviando os arquivos

1. Escolha a pasta: `public_html/` coloca no domínio principal; para a votação, uma subpasta como `public_html/lp/` deixa as versões em `https://seudominio/lp/` sem mexer no site atual.
2. Compacte a pasta do projeto em `.zip` (sem `.git` e sem os `.md`).
3. No **cPanel → Gerenciador de Arquivos**, entre na pasta escolhida, clique em **Carregar** e envie o `.zip`. Depois, clique com o botão direito nele e escolha **Extrair**.
   - Por FTP (FileZilla), envie o conteúdo da pasta direto.
4. O `.htaccess` começa com ponto e fica **oculto**. No Gerenciador de Arquivos, em **Configurações**, marque **Mostrar arquivos ocultos** para confirmar que ele foi enviado.

### Configurando

- **Versão do PHP**: no cPanel, **Selecionar versão do PHP** (ou **MultiPHP Manager**). O código precisa do PHP 7.4 ou mais novo; o 8.x é o recomendado. A extensão **mbstring** precisa estar ativa (já vem ativa por padrão).
- **E-mail remetente**: o remetente precisa ser do domínio do site (ex.: `nao-responda@fortram.site`). Se possível, crie essa conta em **cPanel → Contas de e-mail**; isso ajuda a mensagem a não cair no spam.

### Testando no servidor

1. Abra `https://seudominio/api/projetos.php`: deve aparecer o JSON com os projetos.
2. Abra cada versão, no computador e no celular.
3. Envie o formulário com um e-mail seu e confira a chegada (veja o spam também).

### Se algo der errado

| Sintoma | O que fazer |
| --- | --- |
| Erro 500 em todas as páginas logo depois do envio | Algum comando do `.htaccess` não é aceito no servidor. Apague a linha `Options -Indexes` e teste; se continuar, renomeie o `.htaccess` para descobrir se é ele. |
| Página aparece sem animação e sem projetos | Abra o console do navegador (F12). Se aparecer erro de "MIME type" nos `.js`, confira se o `.htaccess` foi enviado. Confira também se todos os arquivos de `assets/js` subiram. |
| Projetos não aparecem | `data/projetos.json` com erro de digitação (veja a seção 5) ou `mostrar_secao: false`. |
| Formulário diz que não foi configurado | `CONTATO_EMAIL_DESTINO` vazio em `api/config.php`. |
| Formulário diz que não conseguiu enviar | O servidor recusou o e-mail: confira se o remetente é do domínio do site. |
| 3D não aparece na versão 2 | Navegador sem WebGL ou muito antigo: a página mostra a versão sem 3D, de propósito. |
| Alterei um arquivo e não mudou | HTML, CSS, JS e JSON são conferidos a cada visita; imagens ficam guardadas até 7 dias no navegador. Para trocar uma imagem na hora, salve com outro nome e atualize o caminho. |

---

## 9. Depois da votação

**Para a versão escolhida virar a página principal**, há dois caminhos:

- **Renomear**: apague o `index.html` (página de escolha) e renomeie a versão escolhida para `index.html`.
- **Ou apontar no `.htaccess`**: troque a linha `DirectoryIndex index.html index.php` por, por exemplo, `DirectoryIndex v2-processo-3d.html`.

**Arquivos que podem ser apagados** depois, conforme a versão escolhida:

| Versão escolhida | Pode apagar |
| --- | --- |
| 1 | `v2-processo-3d.html`, `v3-hibrida.html`, `assets/css/v2.css`, `assets/css/v3.css`, `assets/js/v2.js`, `assets/js/v2/`, `assets/js/v3.js`, `assets/vendor/` |
| 2 | `v1-corporativa.html`, `v3-hibrida.html`, `assets/css/v1.css`, `assets/css/v3.css`, `assets/js/v1.js`, `assets/js/v3.js` |
| 3 | `v1-corporativa.html`, `v2-processo-3d.html`, `assets/css/v1.css`, `assets/css/v2.css`, `assets/js/v1.js`, `assets/js/v2.js`, `assets/js/v2/`, `assets/vendor/` |

Em todos os casos, `assets/img/versoes/` só é usada pela página de escolha. Mantenha sempre `assets/css/base.css`, `assets/js/comum/`, `assets/fonts/`, `assets/img/marca/`, `assets/img/projetos/`, `assets/img/og/`, `api/` e `data/`.

---

## 10. Acessibilidade, desempenho e SEO

- **Teclado**: tudo funciona sem mouse. Cada versão tem um link "Pular para o conteúdo" no começo, e as janelas devolvem o foco para onde a pessoa estava.
- **Leitores de tela**: imagens decorativas são ignoradas, as telas desenhadas em HTML têm uma descrição, e os textos das cenas 3D estão no HTML.
- **Movimento reduzido**: com essa opção ligada no sistema, as animações param.
- **Contraste**: os textos pequenos e os botões usam o rosa mais escuro (`--magenta-forte`), que tem contraste suficiente com o branco.
- **Desempenho**: imagens em WebP com `loading="lazy"`, fontes locais carregadas primeiro, e o Three.js (o arquivo mais pesado, ~190 KB compactado) só é baixado na versão 2, e só se o navegador tiver WebGL.
- **SEO**: cada versão tem título, descrição e as tags de compartilhamento (Open Graph). A página de escolha (`index.html`) tem `noindex` para não aparecer no Google.

### Sobre o Three.js

`assets/vendor/three/three.module.min.js` é a biblioteca **three@0.186.1** (licença MIT, em `assets/vendor/three/LICENSE`), com os arquivos `three.module.js` e `three.core.js` do pacote unidos e minificados. Os três arquivos de `addons/` foram copiados do pacote sem alteração. Para atualizar no futuro, baixe a versão nova do pacote `three` no npm e repita esse processo.

---

## 11. O que foi feito, o que não foi feito e o que conferir

### Feito

- Três landing pages completas e responsivas (computador e celular), com a página de escolha.
- Projetos dinâmicos a partir de um JSON, com API em PHP pronta para ser ligada ao servidor do Nown.
- Formulário de contato que envia por e-mail, com validação, proteção contra robôs e limite de envios.
- Logos da Fortram vetorizados em SVG a partir das imagens enviadas (versões horizontal, vertical, negativa e o símbolo).
- Telas dos projetos reaproveitadas do portfólio, em WebP.

### Não foi feito (e por quê)

- **TypeScript, frameworks e compilação**: veja a seção 1.
- **Fotos da empresa**: não havia fotos disponíveis. No lugar, as versões usam telas reais dos projetos e telas desenhadas em HTML (mockups).
- **Google Analytics / Google Ads**: não foram adicionados. Se forem colocados, o site passa a precisar de um aviso de cookies (LGPD).
- **Logo oficial do Nown**: o logo em `assets/img/marca/nown-logo.svg` foi **redesenhado a partir do vídeo** e é uma aproximação. Substitua pelo arquivo oficial mantendo o mesmo nome.
- **Contagem real de módulos**: o número vem de `total` em `data/modulos.json` (veja a seção 7 para ligar ao servidor).

### Conferir antes de publicar

Estes dados vieram das conversas e do vídeo e precisam da confirmação de alguém da Fortram:

- **273 módulos**: é o número que aparece no Gerenciador de Módulos do vídeo (a conversa falava em "pelo menos 180").
- **"10+ anos de mercado"** (números da versão 1).
- **"Nota 100 de desempenho no Lighthouse"** e **"práticas alinhadas à ISO 27001 e ao SOC 2"**: o texto evita dizer que há certificação. Ajuste se houver certificado ou se a frase não se aplicar.
- **As etapas do processo**: a versão 1 mostra 8 etapas (a conversa inicial e a avaliação aparecem separadas); as versões 2 e 3 mostram 7.
- **Textos e módulos de cada projeto** em `data/projetos.json`: vieram do portfólio e do vídeo. Confirme também a permissão para exibir cada projeto.
- **WhatsApp e e-mail** (seção 5): enquanto estiverem vazios, os botões de WhatsApp ficam escondidos e o formulário não envia.
