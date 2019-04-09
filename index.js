const  express = require('express');
const { urlencoded } = express;
const app = express();

const port = process.env.PORT || 3000;

const path = require('path');

const sqlite = require('sqlite');
const dbConnection = sqlite.open(path.resolve(__dirname, 'banco.sqlite'), { Promise });

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(urlencoded({ extended: true }));

app.get('/', async (req, res) => {
  const db = await dbConnection;
  const categoriasDb = await db.all('SELECT * FROM CATEGORIAS;')
  const vagas = await db.all('SELECT * FROM vagas;')

  const categorias = categoriasDb.map(cat => {
    return {
      ...cat,
      vagas: vagas.filter(vaga => vaga.categoria === cat.id)
    }
  });

  res.render('home', { categorias });
});

app.get('/vaga/:id', async (req, res) => {
  const db = await dbConnection;
  const vaga = await db.get(`SELECT * FROM vagas WHERE id = ${req.params.id};`);
  res.render('vaga', { vaga });
});

app.get('/admin', (req, res) => {
  res.render('admin/home');
});

app.get('/admin/vagas', async (req, res) => {
  const db = await dbConnection;
  const vagas = await db.all('SELECT * FROM vagas;');
  res.render('admin/vagas', { vagas });
});

app.get('/admin/vagas/delete/:id', async (req, res) => {
  const db = await dbConnection;
  await db.run(`DELETE FROM vagas WHERE id = ${req.params.id};`);
  res.redirect('/admin/vagas');
});

app.get('/admin/vagas/nova', async (req,res) => {
  const db = await dbConnection;
  const categorias = await db.all('SELECT * FROM categorias;')

  res.render('admin/nova-vaga', { categorias });
});

app.post('/admin/vagas/nova', async (req, res) => {
  const { titulo, descricao, categoria } = req.body;
  const db = await dbConnection;
  // await db.run(`INSERT INTO categorias (categoria) VALUES('${categoria}')`);
  await db.run(`INSERT INTO vagas (categoria, titulo, descricao) VALUES(${categoria}, '${titulo}', '${descricao}');`);
  res.redirect('/admin/vagas');
});

app.get('/admin/vagas/editar/:id', async (req,res) => {
  const { id } = req.params;
  const db = await dbConnection;
  const categorias = await db.all('SELECT * FROM categorias;')
  const vaga = await db.get(`SELECT * FROM vagas WHERE id = ${id}`);
  res.render('admin/editar-vaga', { categorias, vaga });
});

app.post('/admin/vagas/editar/:id', async (req, res) => {
  const { titulo, descricao, categoria } = req.body;
  const { id } = req.params;
  const db = await dbConnection;

  await db.run(`UPDATE vagas SET categoria = ${categoria}, titulo = '${titulo}', descricao = '${descricao}' WHERE id = ${id};`);
  res.redirect('/admin/vagas');
});

const init = async () => {
  const db = await dbConnection;
  await db.run('CREATE TABLE IF NOT EXISTS categorias (id INTEGER PRIMARY KEY, categoria TEXT);');
  await db.run('CREATE TABLE IF NOT EXISTS vagas (id INTEGER PRIMARY KEY, categoria INTEGER, titulo TEXT, descricao TEXT);');
};

init();

app.listen(port, (err) => {
  if (err) {
    console.log('Nao foi possivel iniciar o servidor do Jobify');
  } else {
    console.log('Servidor do Jobify rodando...');
  }
});
