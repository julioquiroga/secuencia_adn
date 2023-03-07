const express = require("express");
const bodyParser = require("body-parser");
const dbmaria  = require('./db');

const app = express();
const port = 2023;

// Middleware para parsear el body de las peticiones como JSON
app.use(bodyParser.json());

// Función para detectar mutaciones en el DNA
function hasMutation(dna) {
  const secuencias = [];

  const rows = dna.length;
  const columns = dna[0].length;

  // Buscar mutaciones de forma horizontal
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column <= columns - 4; column++) {
      if ( dna[row][column] === dna[row][column + 1] && dna[row][column] === dna[row][column + 2] && dna[row][column] === dna[row][column + 3] ) {
        secuencias.push({ type: "horizontal", source: { row: row + 1, column: column + 1 } });
      }
    }
  }

  // Buscar mutaciones de forma vertical
  for (let row = 0; row <= rows - 4; row++) {
    for (let column = 0; column < columns; column++) {
      if ( dna[row][column] === dna[row + 1][column] && dna[row][column] === dna[row + 2][column] && dna[row][column] === dna[row + 3][column] ) {
        secuencias.push({ type: "vertical", source: { row: row + 1, column: column + 1} });
      }
    }
  }

  // Buscar mutaciones de forma oblicua
  for (let row = 0; row <= rows - 4; row++) {
    for (let column = 0; column <= columns - 4; column++) {
      if ( dna[row][column] === dna[row + 1][column + 1] && dna[row][column] === dna[row + 2][column + 2] && dna[row][column] === dna[row + 3][column + 3] ) {
        secuencias.push({ type: "oblicua", source: { row: row + 1, column: column + 1} });
      }
    }
  }

  return secuencias;
}

// Endpoint POST para detectar mutaciones
app.post("/mutation", (req, res) => {
  const dna = req.body;

  if (!Array.isArray(dna) || dna.length === 0 || !Array.isArray(dna[0]) || dna[0].length === 0) {
    return res.status(400).json({ error: "La matriz de DNA debe ser un array bidimensional no vacío." });
  }

  const result = hasMutation(dna);

  //En caso de verificar una mutación, debería devolver un 200, en caso contrario un 403.
  if (result.length > 0) {
    let qry = "INSERT INTO tbl_mutations (dna, hasMutation, results, fecha_registro) VALUES ('"+dna+"','true','"+result+"',now())";
    dbmaria.getConnection().then(conn => {
      console.log('Conexión a la BD establecida');
      conn.query(qry)
        .then(rows => { 
          res.status(200).json({
            hasMutation: true, 
            results: result,
            qry: qry,
            rows: rows
        });
        })
        .then(res => {
          conn.release();
        })
        .catch(err => {
          conn.release();
        })
    }).catch(err => {
        res.status(401).json({
            consulta: qry,
            status: '-1',
            mensaje: err
        });
        console.log(err);
      return;
    });

    //return res.status(200).json({ hasMutation: true, results: result });
  } else {
    return res.status(403).json({ hasMutation: false, results: "No se encontraron secuencias de mutaciones." });
  }
});

// Endpoint POST para listar mutaciones
app.get("/mutation", (req, res) => {
  var qry = "SELECT adnID, dna, hasMutation, results, fecha_registro FROM tbl_mutations";
  console.log(qry);

  dbmaria.getConnection().then(conn => {
    console.log('Conexión a la BD establecida');
    conn.query(qry)
      .then(rows => { 
        res.status(200).json({
          consulta: qry,
          status: '1',
          mensaje: 'list mutations',
          registros: rows
      });
      })
      .then(res => {
        conn.release();
      })
      .catch(err => {
        conn.release();
      })
  }).catch(err => {
      res.status(401).json({
          consulta: qry,
          status: '-1',
          mensaje: err
      });
      console.log(err);
    return;
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
