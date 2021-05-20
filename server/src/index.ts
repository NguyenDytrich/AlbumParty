import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.get('/ping', (req, res) => {
  return res.send('pong');
});

app.listen(process.env.PORT, () => {
  console.log('[INFO] listening on ' + process.env.PORT);
});
