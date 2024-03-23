const axios = require("axios");
const express = require("express");
const { json } = require("body-parser");
const app = express();
const bodyParser = require("body-parser");
app.use(json());
app.use(bodyParser.json());

app.set("view engine", "ejs");
app.set("views", "src/views");

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const https = require("https");

const cert = fs.readFileSync(
  path.resolve(__dirname, `../certs/producao-463790-Loja treino.p12`)
);

const agent = new https.Agent({
  pfx: cert,
  passphrase: "",
});

const credentials = Buffer.from(
  `${process.env.GN_H_CLIENT_ID}:${process.env.GN_H_CLIENT_SECRET}`
).toString("base64");

// respond with "hello world" when a GET request is made to the homepage
app.get("/", async function (req, res) {
  const authResponde = await axios({
    method: "POST",
    url: `${process.env.GN_H_ENDPOINT}/oauth/token`,
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    httpsAgent: agent,
    data: {
      grant_type: "client_credentials",
    },
  });
  const acessToken = await authResponde.data.access_token;

  // const reqGN = axios.create({
  //   baseURL: process.env.GN_H_ENDPOINT,
  //   httpsAgent: agent,
  //   headers: {
  //     Authorization: `Bearer ${acessToken}`,
  //     "Content-Type": "application/json",
  //   },
  // });

  const dataCob = {
    calendario: {
      expiracao: 3600,
    },
    devedor: {
      cpf: "16789395440",
      nome: "GABY AMOR <3",
    },
    valor: {
      original: "0.10",
    },
    chave: "28e6754a-9be0-4c76-8943-78d62aa68d79",
    solicitacaoPagador: "Cobrança dos serviços prestados.",
  };
  const responseCob = await axios.post(
    `${process.env.GN_H_ENDPOINT}/v2/cob`,
    dataCob,
    {
      httpsAgent: agent,
      headers: {
        Authorization: `Bearer ${acessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  const locationID = await responseCob.data.loc.id;
  const imageResponse = await axios.get(
    `${process.env.GN_H_ENDPOINT}/v2/loc/${locationID}/qrcode`,
    {
      httpsAgent: agent,
      headers: {
        Authorization: `Bearer ${acessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  res.render("teste", { meuZovo: imageResponse.data.imagemQrcode });
});

app.get("/cobrancas", async (req, res) => {
  const authResponde = await axios({
    method: "POST",
    url: `${process.env.GN_H_ENDPOINT}/oauth/token`,
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    httpsAgent: agent,
    data: {
      grant_type: "client_credentials",
    },
  });
  const acessToken = await authResponde.data.access_token;

  const cobResponde = await axios.get(
    `${process.env.GN_H_ENDPOINT}/v2/cobv?inicio=2024-02-01T01:01:35Z&fim=2024-02-17T23:59:00Z`,
    {
      httpsAgent: agent,
      headers: {
        Authorization: `Bearer ${acessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const cobData = await cobResponde.data;
  console.log(cobData);
  res.send(cobData);
});

app.post("/webhook(/pix)?", (req, resp) => {
  console.log(req.body);

  resp.send("200");
});

app.listen(3000);
