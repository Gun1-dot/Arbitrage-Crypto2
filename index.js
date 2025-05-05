// index.js (Node.js backend for Render)
const express = require("express");
const fetch = require("node-fetch");
const twilio = require("twilio");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

const TO_WHATSAPP = process.env.TO_WHATSAPP;
const FROM_WHATSAPP = process.env.FROM_WHATSAPP;

async function fetchPricesAndSendAlerts() {
  try {
    const [rekuRes, indodaxRes] = await Promise.all([
      fetch("https://api.reku.id/v2/bidask"),
      fetch("https://indodax.com/api/tickers")
    ]);

    const rekuData = await rekuRes.json();
    const indodaxData = await indodaxRes.json();

    let gainers = [];

    rekuData.forEach((coin) => {
      const symbol = coin.code.toLowerCase() + "_idr";
      const indodaxPrice = parseFloat(indodaxData.tickers[symbol]?.last || 0);
      const rekuBid = parseFloat(coin.bid || 0);

      if (rekuBid > 0 && indodaxPrice > 0) {
        const gain = ((indodaxPrice - rekuBid) / rekuBid) * 100;
        if (gain > 3) {
          gainers.push({
            coin: coin.code,
            gain: gain.toFixed(2),
            arbitrage: `Buy at Reku, Sell at Indodax`
          });
        }
      }
    });

    if (gainers.length > 0) {
      const message = gainers.slice(0, 5).map(g => `🔥 ${g.coin}\nGain: ${g.gain}%\n${g.arbitrage}`).join("\n\n");
      await sendTelegram(`🚨 Arbitrage Gains Over 3%:\n\n${message}`);
      await sendWhatsApp(`🚨 Crypto Arbitrage Alert:\n\n${message}`);
    } else {
      console.log("No arbitrage gain > 3% found.");
    }
  } catch (err) {
    console.error("Error fetching prices:", err);
  }
}

async function sendTelegram(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text: message })
  });
}

async function sendWhatsApp(message) {
  await client.messages.create({
    from: FROM_WHATSAPP,
    to: TO_WHATSAPP,
    body: message
  });
}

setInterval(fetchPricesAndSendAlerts, 60 * 1000);

app.get("/", (req, res) => {
  res.send("✅ Crypto arbitrage alert backend is running.");
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
