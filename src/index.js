import express from "express";
import CrawlerHandler from "./handlers/crawler.handler";

const app = express();
const crawler = new CrawlerHandler(app);

app.get("/", function (_, res) {
  res.send("Hello World!");
});

crawler.invoke();

app.listen(3000);
