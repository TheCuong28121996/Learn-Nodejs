const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const {MONGODB_URI} = require('./configs/configs');
const authRoute = require("./routes/auth_routes");

const app = express();
const port = 3000

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(morgan('combined'));

startServer = async () => {
  await mongoose.connect(MONGODB_URI);

  app.use("/v1/auth", authRoute);
}

app.listen(port);

startServer().then();