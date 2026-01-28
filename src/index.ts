import express from "express";
import 'reflect-metadata';
import { useExpressServer } from 'routing-controllers';
import { TokenController } from './controllers/token.controller.js';

const app = express();
app.use(express.json());

useExpressServer(app, {
  controllers: [TokenController],
  routePrefix: '/api'
});

app.get("/", (_, res) => {
  res.send("API running 🚀");
});

app.listen(8080, () => {
  console.log("Server started on port 8080");
});