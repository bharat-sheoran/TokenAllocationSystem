import express from "express";
import 'reflect-metadata';
import { useContainer, useExpressServer } from 'routing-controllers';
import { TokenController } from './controllers/token.controller.js';
import { AdminController } from "./controllers/admin.controller.js";
import { SlotController } from "./controllers/slot.controller.js";

const app = express();

useExpressServer(app, {
  controllers: [TokenController, AdminController, SlotController],
  routePrefix: '/api',
  defaultErrorHandler: true,
  authorizationChecker: async () => {
    return true;
  }
});

app.get("/", (_, res) => {
  res.send("API running 🚀");
});

app.listen(8080, () => {
  console.log("Server started on port 8080");
});