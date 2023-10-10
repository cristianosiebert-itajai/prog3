/*
  Lib capaz de criar um webserver para APIs
*/
const express = require('express');
/*
  Lib que tem métodos de interação com o
  sistema de arquivos.
  Ler arquivos, escrever, remover, etc.
*/ 
const fs = require('fs');

/*
  Função que lê o arquivo CSV
  e cria os objetos JSON para a API.
  É como se eu estivesse conectando ao meu
  "banco de dados".
*/
const lerArquivo = async () => {
  // Criando lista de livros
  const livros = [];
  // Lendo o arquivo bruto
  const dados = fs.readFileSync('banco_livros.csv', 'utf8');
  // Criando um array separado por quebra de linha
  const linhas = dados.split('\n');
  // Criando cabeçalho da primeira linha separado por vírgula
  const cabecalho = linhas[0].split(',');
  // Lendo as linhas
  for (let i = 1; i < linhas.length; i++) {
    const valores = linhas[i].split(',');
    const livro = {};
    for (let j = 0; j < cabecalho.length; j++) {
      livro[cabecalho[j]] = valores[j];
    }
    livros.push(livro);
  }
  return livros;
};

//Busca livro por ID
const buscaLivroPorId = (livros, id) => {
  const livrosFiltrados = livros.filter((livro) => {
    return livro.id === id;
  });
  return livrosFiltrados;
};

const app = express();

app.get('/', (req, res) => {
  res.send('iiiiiiiiiii aumaumaue');
});

app.get('/livros', async (req, res) => {
  const livros = await lerArquivo();
  res.send(livros);
});

app.get('/livros/:id', async (req, res) => {
  const livros = await lerArquivo();
  const livro = buscaLivroPorId(livros, req.params.id);
  res.send(livro);
});

const porta = 8005;
app.listen(porta, () => {
  console.log('Servidor iniciado.');
  console.log('http://localhost:' + porta);
});