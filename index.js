const express = require("express");
const fetch = require("node-fetch");
const twilio = require("twilio");

const app = express();
const PORT = process.env.PORT || 3000;

// Twilio Credentials
const accountSid = 'YOUR_TWILIO_ACCOUNT_SID';
const authToken = 'YOUR_TWILIO_AUTH_TOKEN';
const client = new twilio(accountSid, authToken);

// Your WhatsApp number format
const fromWhatsApp = 'whatsapp:+14155238886';
const toWhatsApp = 'whatsapp:+6282210547261'; // Your number

async function checkCryptoAndAlert() {
  try {
    const rekuRes = await fetch("https://api.reku.id/v2/bidask");
    const indodaxRes = await fetch("https://indodax.com/api/tickers");
    const rekuData = await rekuRes.json();
    const indodaxData = await indodaxRes.json();

    let alerts = [];

    rekuData.forEach((coin) => {
      const symbol = coin.code.toLowerCase() + "_idr";
      const indodaxPrice = parseFloat(indodaxData.tickers[symbol]?.last || 0);
      const rekuBid = parseFloat(coin.bid || 0);

      if (rekuBid > 0 && indodaxPrice > 0) {
        const gain = ((indodaxPrice - rekuBid) / rekuBid) * 100;
        if (gain > 3) {
          alerts.push(`
