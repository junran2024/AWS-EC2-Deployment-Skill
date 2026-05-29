import TelegramBot from 'node-telegram-bot-api';

// 获取环境变量中的 token 和 chatId
const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.MY_TELEGRAM_CHAT_ID;

if (!token || !chatId) {
    console.error("❌ 找不到 TELEGRAM_TOKEN 或 MY_TELEGRAM_CHAT_ID，请先设置环境变量！");
    process.exit(1);
}

// 初始化 Bot
const bot = new TelegramBot(token, {
    polling: false, // 仅发送消息，不需要轮询
    request: {
        family: 4
    }
});

/**
 * 发送消息给用户
 * @param {string} message - 要发送的消息内容
 */
export async function sendTelegramMessage(message) {
    try {
        // 尝试以 Markdown 格式发送
        await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
        console.log("✅ 消息发送成功！");
    } catch (err) {
        console.error("❌ 发送 Markdown 回复失败，尝试降级发送纯文本:", err.message);
        try {
            // 如果 Markdown 语法错误导致发送失败，降级发纯文本
            await bot.sendMessage(chatId, message);
            console.log("✅ 纯文本消息发送成功！");
        } catch (fallbackErr) {
            console.error("❌ 消息发送失败:", fallbackErr.message);
        }
    }
}

// ==========================================
// 使用示例 (如果在独立脚本中运行)
// ==========================================
// const logAnalysisResult = "🤖 日志分析结果：\n\n系统运行正常，未发现错误。";
// sendTelegramMessage(logAnalysisResult);
