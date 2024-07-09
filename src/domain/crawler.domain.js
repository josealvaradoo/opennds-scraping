import puppeteer from "puppeteer";

const urls = {
  login: process.env.OPENDNS_LOGIN_URL,
  dashboard: process.env.OPENDNS_DASHBOARD_URL,
  domains: process.env.OPENDNS_DOMAINS_URL,
};

export default class Crawler {
  bwoser = null;
  page = null;
  iterations = 0;

  constructor() {
    console.log("OpenDNS is starting...");
  }

  async run() {
    this.browser = await puppeteer.launch();
    this.page = await this.browser.newPage();

    await this.page.setViewport({ width: 1080, height: 1024 });

    console.log("OpenDNS is ready to be used!");

    return this.page;
  }

  async delay(time = 30000) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time);
    });
  }

  async authenticate() {
    await this.page.goto(process.env.OPENDNS_LOGIN_URL);
    await this.page.type("#username", process.env.OPENDNS_USERNAME);
    await this.page.type("#password", process.env.OPENDNS_PASSWORD);

    console.log("Trying to log in...");

    await Promise.all([
      this.page.locator("button[type=submit]").click(),
      this.page.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);
  }

  async isAuthenticated() {
    return await this.page.url().includes("dashboard");
  }

  async isTableFinished() {
    try {
      return !Boolean(
        await this.page.waitForSelector(".pagination .next", { timeout: 5000 }),
      );
    } catch (e) {
      return true;
    }
  }

  async goToDomainsPage() {
    await this.page.goto(urls.domains);
  }

  async goToNextPage() {
    await this.page.locator(".pagination .next").click();
  }

  async getDomainListFromCurrentPage() {
    return await this.page
      .waitForSelector(".stats.table-hl")
      .then(async (table) => {
        if (!table) {
          return [];
        }
        return await table.evaluate((el) => {
          const rows = el.querySelectorAll(".domain-row");
          console.log("Rows: ", rows);
          if (!rows?.length) {
            return [];
          }
          return Array.from(rows).map((row) => {
            const domain = row.querySelector(".domain").textContent.trim();
            const count = row.querySelector(".count").textContent.trim();
            return { domain, count };
          });
        });
      })
      .catch(() => []);
  }

  async getRecursiveDomainList(list = []) {
    console.log(await this.page.url());
    console.log("Page is finished?: ", await this.isTableFinished());
    list.push(...(await this.getDomainListFromCurrentPage()));
    if (await this.isTableFinished()) {
      return list;
    }

    await this.goToNextPage();
    await this.delay();
    return await this.getRecursiveDomainList(list);
  }

  async getNetworkList() {
    await this.page.locator("#dashboard-nav li:nth-child(2) a").click();
    const selector = await this.page.waitForSelector("#network_id");
    return await selector.evaluate((el) => {
      const options = el.querySelectorAll("option");
      const [_, ...networks] = Array.from(options);
      return networks.map((network) => network.label.trim());
    });
  }

  async close() {
    await this.browser.close();
  }
}
