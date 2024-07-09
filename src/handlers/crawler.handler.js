import Handler from "./handler";
import Crawler from "../domain/crawler.domain";

export default class CrawlerHandler extends Handler {
  constructor(app) {
    super(app);
  }

  async invoke() {
    this.app.get("/crawler/networks", async function (_, res) {
      (async function () {
        const crawler = new Crawler();
        await crawler.run();

        // Type into Authentication form
        await crawler.authenticate();

        const isAuthenticated = await crawler.isAuthenticated();

        if (!isAuthenticated) {
          console.log("You cannot be authenticated");
          await crawler.close();
          return;
        }

        // Get the network list
        res.status(200).json({ networks: await crawler.getNetworkList() });

        await crawler.close();
      })();
    });

    this.app.get("/crawler/domains", async function (_, res) {
      (async function () {
        const crawler = new Crawler();
        await crawler.run();

        // Type into Authentication form
        await crawler.authenticate();

        const isAuthenticated = await crawler.isAuthenticated();

        if (!isAuthenticated) {
          console.log("You cannot be authenticated");
          await crawler.close();
          return;
        }

        // Go to domain list
        await crawler.goToDomainsPage();

        res
          .status(200)
          .json({ domains: await crawler.getRecursiveDomainList() });

        await crawler.close();
      })();
    });
  }
}
