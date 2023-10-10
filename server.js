//Biblioteca de manipulação do sistema de arquivos
var fs = require('fs');
// Biblioteca que cria o webserver
var express = require('express');
// Biblioteca que ajuda a estruturar os dados via POST ou PUT
var bodyParser = require('body-parser');

// Criando o webserver
var app = express();
// Passando o codificador JSON pra estruturar os dados
app.use(bodyParser.json());

// Função de leitura do CSV - o nosso "banco de dados"
const lerArquivo = async () => {
  const banco = "banco_livros.csv";
  const livros = [];
  // Lê o arquivo de maneira sincrona, trazendo os dados
  const data = fs.readFileSync(banco, 'utf8');
  // Separando cada linha em um array
  const linhas = data.split('\n');
  // Separando o cabeçalho que contém as colunas/atributos dos livros
  const cabecalho = linhas[0].split(',');
  // Percorrendo cada linha e transformando em um objeto JSON
  for (let i = 1; i < linhas.length; i++) {
    const valores = linhas[i].split(',');
    const livro = {};
    for (let i = 0; i < cabecalho.length; i++) {
      livro[cabecalho[i]] = valores[i];
    }
	// Adicionando o livro estruturado a um array de livros
    livros.push(livro);
  }
  // Retornando o array de livros
  return livros;
};

// Consultando os livros que tem o status ativo como true
const livrosAtivos = (livros) => {
  // Pesquisem pelos métodos de arrays filter, map e reduce, são bem úteis.
  return livros.filter((livro) => {
    return livro.ativo === "true";
  });
}

// Buscando um livro por parte do título
const buscarLivro = (livros, livro) => {
  // O filter, como o nome já diz, filtra um array criando um novo baseado em uma condição
  // Nesse caso, se o termo procurado estivesse em alguma parte do título do livro
  const livrosFiltrados = livros.filter((item) => {
    return item.nome.toLowerCase().includes(livro.toLowerCase());
  });
  return livrosFiltrados;
}

// Aqui buscamos o livro pelo seu ID
const buscarLivroPorId = (livros, id) => {
  const livrosFiltrados = livros.filter((item) => {
    return item.id === id;
  });
  return livrosFiltrados;
}

// Aqui adicionamos um novo livro
// Aqui sempre apagamos tudo e resscrevemos com os novos dados, é assim mesmo.
const salvarLivro = async (livro, livros) => {
  const banco = "banco_livros.csv";
  const newId = livros.length + 1;
  // Criando nova linha pra ser salva
  const linha = `${newId},${livro.nome},true`;
  // Lendo o conteúdo atual
  const data = fs.readFileSync(banco, 'utf8');
  // Reescrevendo o conteúdo atual + nova linha
  // Podemos usar ${} quando uma string está entre `` para usar a variavel diretamente na string, evitando a concatenação com +
  await fs.writeFile(banco, `${data}\n${linha}`, () => {});
}

// Aqui alteramos a informação de algum livro, mas a escrita é igual a do salvar
const updateLivro = async (body, id, livros) => {
  let txtParaSalvar = 'id,nome,ativo\n';
  livros.map((item) => {
    if (item.id === id) {
      item.nome = body.nome;
    }
    txtParaSalvar += `${item.id},${item.nome},${item.ativo}\n`;
  });
  txtParaSalvar = txtParaSalvar.slice(0, -2);
  const banco = "banco_livros.csv";
  await fs.writeFile(banco, `${txtParaSalvar}`, () => {});
};

// Soft delete é quando não deletamos fisicamente o dado, mas apenas desativamos através de uma coluna booleana
// O dado está lá ainda, só não é mais mostrado, por isso a coluna 'ativo'.
const softDelete = async (id, livros) => {
  let txtParaSalvar = 'id,nome,ativo\n';
  livros.map((item) => {
    if (item.id === id) {
      item.ativo = false;
    }
    txtParaSalvar += `${item.id},${item.nome},${item.ativo}\n`;
  });
  txtParaSalvar = txtParaSalvar.slice(0, -1);
  const banco = "banco_livros.csv";
  await fs.writeFile(banco, `${txtParaSalvar}`, () => {});
};

// Hard delete é quando deletamos fisicamente o dado, sem chance de recuperação
const hardDelete = async (id, livros) => {
  let txtParaSalvar = 'id,nome,ativo\n';
  livros.map((item) => {
    if (item.id !== id) {
      txtParaSalvar += `${item.id},${item.nome},${item.ativo}\n`;
    }
  });
  txtParaSalvar = txtParaSalvar.slice(0, -1);
  const banco = "banco_livros.csv";
  await fs.writeFile(banco, `${txtParaSalvar}`, () => {});
};

// Após as funções estarem prontas, vamos criar os links de acesso do nosso servidos
// Ou seja, as endpoints, ou pontos de entrada, por exemplo:
// Este aqui será acessado por http://localhost:8005/livros
// E vai trazer todos os livros do CSV, ativos ou não
app.get('/livros', async (req, res) => {
  const livros = await lerArquivo();
  res.send(livros);
});

// Já esse endpoint trará apenas os livros ativos
app.get('/livros-ativos', async (req, res) => {
  const livros = await lerArquivo();
  const ativos = livrosAtivos(livros);
  res.send(ativos);
});

// Esse aqui buscará pelo título
app.get('/livros/:title', async (req, res) => {
  const title = req.params.title;
  const livros = await lerArquivo();
  const livro = buscarLivro(livros, title);
  res.send(livro);
});

// Enquanto este endpoint busca pelo id
app.get('/livros-by-id/:id', async (req, res) => {
  const id = req.params.id;
  const livros = await lerArquivo();
  const livro = buscarLivroPorId(livros, id);
  res.send(livro);
});

// Aqui você deve mandar/postar um objeto JSON neste formato:
// { "nome": "nome do livro" }
// Assim ele será inserido na listagem
app.post('/livros', async (req, res) => {
  const livro = req.body;
  const livros = await lerArquivo();
  salvarLivro(livro, livros);
  res.send('OK');
});

// Enquanto aqui podemos alterar um item, pra isso precisamos do mesmo objeto do post
// Mas o id deve estar na URL, quando tem este sinal : é porque isso é um parâmetro da url que pode ser lido pelo req.params
app.put('/livros/:id', async (req, res) => {
  const body = req.body;
  const id = req.params.id;
  const livros = await lerArquivo();
  const livro = await buscarLivroPorId(livros, id);
  if (livro) {
    updateLivro(body, id, livros);
  }
  res.send('OK');
});

// Aqui desativamos o livro
// E apesar de ser um soft delete, preferi fazer a chamada PUT pois estou alterando o dado e não removendo-o
app.put('/livros-soft-delete/:id', async (req, res) => {
  const id = req.params.id;
  const livros = await lerArquivo();
  const livro = await buscarLivroPorId(livros, id);
  if (livro) {
    softDelete(id, livros);
  }
  res.send('Removed');
});

// Enquanto neste último endpoint. removemos completamente o livro da lista
app.delete('/livros/:id', async (req, res) => {
  const id = req.params.id;
  const livros = await lerArquivo();
  const livro = await buscarLivroPorId(livros, id);
  if (livro) {
    hardDelete(id, livros);
  }
  res.send('Deleted');
});

// Aqui apenas definmos a porta e a(s) mensagem(s) que o servidor mostra quando é ligado.
// Depois disso é só executar e testar no navegador (para GETs)
// Ou em programas de teste de API como Postman ou Insomnia (para testar tudo, incluindo POSTs e PUTs)
const porta = 8005;
app.listen(porta, () => {
  console.log('Servidor ativo na porta ' + porta);
});