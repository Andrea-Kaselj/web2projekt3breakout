import express from 'express'
import fs from 'fs';
import https from 'https';
import path from 'path'
import dotenv from 'dotenv' 

dotenv.config() 
const externalUrl = process.env.RENDER_EXTERNAL_URL; 
const port = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 3011;

const app = express();
app.set("views", path.join(__dirname, "views"));
app.use(express.static("./"));

app.get('/', function (req, res) {    
    res.sendFile('index.html', {root:'dist/views/'});
});

if (externalUrl) { const hostname = '0.0.0.0';
  app.listen(port, hostname, () => { 
    console.log(`Server locally running at http://${hostname}:${port}/ and from outside on ${externalUrl}`); 
  }); 
} else {
  https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
  }, app)
  .listen(port, function () {
    console.log(`App running at https://localhost:${port}/`);
  });
}
