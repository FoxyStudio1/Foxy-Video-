/* ========================================================================
   NOTAS.js — aqui é onde tu registas cada vídeo/série do site Foxy'Video
   ========================================================================

   COMO FUNCIONA (vídeo normal, tipo filme):
   1. Põe o ficheiro do vídeo dentro da pasta "videos".
   2. Põe a imagem de capa (horizontal, tipo 16:9) dentro da pasta "fotos".
   3. Copia o bloco EXEMPLO 1 (filme) abaixo, cola no fim da lista
      CATALOGO, e muda só os campos: id, titulo, descricao, categoria, capa.

   COMO FUNCIONA (série, com episódios/temporadas):
   1. Põe TODOS os ficheiros de episódios dentro da pasta "videos".
      Ex: A.mp4, B.mp4, C.mp4
   2. Põe a imagem de capa dentro da pasta "fotos".
   3. Copia o bloco EXEMPLO 2 (série) abaixo.
   4. Põe "serie: true".
   5. No campo "id" para séries podes deixar o nome do 1º episódio,
      não é obrigatório para a reprodução, é só referência.
   6. No campo "temporadas", escreve assim (é texto, formato fixo):

        "1,[A.mp4] 2,[B.mp4,C.mp4]"

      Isto quer dizer:
        Temporada 1 -> tem o episódio A.mp4
        Temporada 2 -> tem os episódios B.mp4 e C.mp4

      Regras do formato "temporadas":
        - cada temporada é:  numero,[ficheiro1.mp4,ficheiro2.mp4,...]
        - separa temporadas diferentes só com um espaço
        - dentro dos [ ], separa episódios só por vírgula, sem espaços
        - os nomes têm de ser EXATAMENTE os nomes dos ficheiros na
          pasta "videos"

   REGRA MAIS IMPORTANTE:
   - "id" (para filmes) e os nomes dentro de "temporadas" (para séries)
     têm de ser EXATAMENTE iguais aos nomes dos ficheiros na pasta videos,
     COM extensão (ex: "matrix.mp4").
   - "capa" tem de ser EXATAMENTE igual ao nome do ficheiro na pasta fotos,
     COM extensão (ex: "matrix.jpg").
   - Não uses acentos, espaços ou "ç" nos nomes dos ficheiros das pastas
     (usa _ ou - em vez de espaço).

   CAMPOS:
   - id         -> nome do ficheiro de vídeo dentro de /videos (filmes),
                   ou nome de qualquer episódio (só referência em séries).
   - capa       -> nome do ficheiro de imagem dentro de /fotos
   - titulo     -> nome que aparece no site
   - descricao  -> sinopse curta
   - categoria  -> usada para agrupar em fileiras E no filtro do menu
                   (ex: "Ação", "Comédia", "Foxy"...) — inventa à vontade
   - ano        -> opcional, número
   - duracao    -> opcional, texto tipo "1h 42m"
   - destaque   -> opcional, true/false. Se true, pode aparecer no banner
   - serie      -> true ou false. true = mostra episódios/temporadas.
   - temporadas -> só usado se serie=true. Ver formato acima.

   ======================================================================== */

const CATALOGO = [

  // ---------- EXEMPLO 1: FILME (vídeo único, copia isto para um filme) ----------
  {
    id: "exemplo1.mp4",
    capa: "exemplo1.jpg",
    titulo: "Nome do Vídeo",
    descricao: "Escreve aqui uma descrição curta e apetitosa do vídeo, tipo sinopse de trás de caixa de DVD.",
    categoria: "Ação",
    ano: 2024,
    duracao: "1h 30m",
    destaque: false,
    serie: false,
    temporadas: ""
  },

  // ---------- EXEMPLO 2: SÉRIE (com temporadas e episódios) ----------
  {
    id: "exemplo2.mp4",
    capa: "exemplo2.jpg",
    titulo: "Nome da Série",
    descricao: "Descrição curta da série. Explica do que trata e o tom geral.",
    categoria: "Comédia",
    ano: 2023,
    duracao: "45m / episódio",
    destaque: false,
    serie: true,
    temporadas: "1,[exemplo2.mp4] 2,[exemplo3.mp4]"
  },

  // ---------- Cola os teus vídeos/séries AQUI EMBAIXO ----------
 {
    id: "filme1.mp4",
    capa: "filme1natal.jpg",
    titulo: "Natal na Norcopia",
    descricao: "Filme de natal da norcopia de teste",
    categoria: "Natal",
    ano: 2026,
    duracao: "20min",
    destaque: true,
    serie: false,
    temporadas: ""
  },

];

/* Não precisas de mexer daqui para baixo. */
if (typeof module !== "undefined") { module.exports = CATALOGO; }
