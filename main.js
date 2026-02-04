import ZaloBot from "node-zalo-bot";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, 'data.json');

// Hàm đọc dữ liệu từ JSON
const readData = () => {
  try {
    const data = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(data || '{}');
  } catch (error) {
    return {};
  }
};

// Hàm lưu dữ liệu vào JSON
const saveData = (data) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Lỗi lưu dữ liệu:', error);
    return false;
  }
};

const BOT_TOKEN = '1376192803008873502:JyQyFUfTFXOPzhUeEVtvYUGedzFZDAOBEuBPEEhxkINoinFmAusflcgORgygNxqh';
const CMC_API_KEY = 'cb2a0a6a3c064083a2516dbcb7696d8b';

const bot = new ZaloBot(BOT_TOKEN, {
  polling: true
});

bot.onText(/\/start/, (msg, match) => {
  bot.sendMessage(
    msg.chat.id,
    `Chào ${msg.from.display_name}! Tôi là chatbot!`
  );
});

bot.onText(/\/price (.+)/, async (msg, match) => {
  const symbol = match[1].toUpperCase();
  
  try {
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
      params: {
        symbol: symbol
      },
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY
      }
    });
    
    const data = response.data.data[symbol];
    if (data) {
      const price = data.quote.USD.price.toFixed(2);
      const change24h = data.quote.USD.percent_change_24h.toFixed(2);
      const marketCap = (data.quote.USD.market_cap / 1000000000).toFixed(2);
      
      // Thêm mũi tên dựa trên thay đổi giá
      const arrow = change24h > 0 ? '📈' : change24h < 0 ? '📉' : '➡️';
      
      const message = `
                        💰 ${data.name} (${symbol})
                        Giá: $${price}
                        Thay đổi 24h: ${change24h}%  ${arrow} 
                        Market Cap: $${marketCap}B
                            `.trim();
      
      bot.sendMessage(msg.chat.id, message);
    } else {
      bot.sendMessage(msg.chat.id, `Không tìm thấy coin ${symbol}`);
    }
  } catch (error) {
    console.error('Lỗi khi lấy giá:', error.message);
    bot.sendMessage(msg.chat.id, `Lỗi khi lấy giá ${symbol}. Vui lòng thử lại!`);
  }
});

bot.onText(/\/echo (.+)/, (msg, match) => {
  let message = match[1];
  if (message) {
    bot.sendMessage(msg.chat.id, `Bạn vừa nói: ${message}`);
  } else {
    bot.sendMessage(msg.chat.id, "Hãy nhập gì đó sau lệnh /echo");
  }
});

// Lệnh save - /save [key] [value]
bot.onText(/\/save (.+) (.+)/, (msg, match) => {
  const key = match[1];
  const value = match[2];
  
  const data = readData();
  data[key] = value;
  
  if (saveData(data)) {
    bot.sendMessage(msg.chat.id, `✅ Đã lưu: ${key} = ${value}`);
  } else {
    bot.sendMessage(msg.chat.id, `❌ Lỗi khi lưu dữ liệu`);
  }
});

// Lệnh get - /get [key]
bot.onText(/\/get (.+)/, (msg, match) => {
  const key = match[1];
  const data = readData();
  
  if (data.hasOwnProperty(key)) {
    bot.sendMessage(msg.chat.id, `🔍 ${key} = ${data[key]}`);
  } else {
    bot.sendMessage(msg.chat.id, `❌ Không tìm thấy key: ${key}`);
  }
});

// Lệnh list - /list (xem tất cả)
bot.onText(/\/list/, (msg) => {
  const data = readData();
  const keys = Object.keys(data);
  
  if (keys.length === 0) {
    bot.sendMessage(msg.chat.id, `📋 Chưa có dữ liệu nào`);
  } else {
    const list = keys.map(k => `${k}: ${data[k]}`).join('\n');
    bot.sendMessage(msg.chat.id, `📋 Dữ liệu:\n${list}`);
  }
});

bot.on("message", (msg) => {
  console.log("Bạn vừa nhận được tin nhắn mới", msg);
});