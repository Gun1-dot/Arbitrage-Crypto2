const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", async (req, res) => {
  try {
    const response = await axios.get("https://pluang.com/explore/crypto/1");
    const html = response.data;
    const $ = cheerio.load(html);
    const result = [];

    $('[data-testid="asset-list-container"] [data-testid="asset-list-item"]').each((_, el) => {
      const name = $(el).find('[data-testid="asset-name"]').text().trim();
      const symbol = $(el).find('[data-testid="asset-symbol"]').text().trim();
      const price = $(el).find('[data-testid="asset-price"]').text().trim();

      if (name && symbol && price) {
        result.push({ name, symbol, price });
      }
    });

    res.send(`
      <h1>Real-Time Pluang Crypto Prices</h1>
      <table border="1" cellpadding="8" cellspacing="0">
        <tr><th>Name</th><th>Symbol</th><th>Price (IDR)</th></tr>
        ${result.map(coin => `<tr><td>${coin.name}</td><td>${coin.symbol}</td><td>${coin.price}</td></tr>`).join("")}
      </table>
    `);
  } catch (error) {
    res.status(500).send("Error fetching data");
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
