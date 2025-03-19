import express from 'express';
import * as dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use('/', routes); // Use the Router object from routes.ts

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
