const { createClient } = require('@supabase/supabase-js');
const TelegramBot = require('node-telegram-bot-api');

// Supabase va Bot sozlamalari
const supabase = createClient('https://xgqctjchppduhbickbmd.supabase.co', 'sb_publishable_E2zmVN0qXUHAovMaet8nog_8-IwSm-V');
const bot = new TelegramBot('7811209905:AAHTFGdyjM48VHmdvBo4tqIuY5MhuW911DM');

// MAJBURIY KANAL (O'zingiznikini yozing)
const CHANNELS = ['@uran_channel']; 

module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            const { message, callback_query } = req.body;

            // 1. Tugma bosilganda (Callback)
            if (callback_query) {
                const uid = callback_query.from.id;
                const member = await bot.getChatMember(CHANNELS[0], uid);
                const isSub = member.status !== 'left' && member.status !== 'kicked';

                if (isSub) {
                    await bot.answerCallbackQuery(callback_query.id, { text: "Rahmat! Endi /start bosing." });
                } else {
                    await bot.answerCallbackQuery(callback_query.id, { text: "Hali a'zo emassiz!", show_alert: true });
                }
                return res.status(200).send('OK');
            }

            // 2. Xabar kelganda
            if (message && message.text) {
                const chatId = message.chat.id;
                const uid = message.from.id;
                const text = message.text;

                // Kanalga a'zolikni tekshirish
                const member = await bot.getChatMember(CHANNELS[0], uid);
                const isSub = member.status !== 'left' && member.status !== 'kicked';

                if (!isSub) {
                    await bot.sendMessage(chatId, `☢️ *URANCOIN* Minerga kirish uchun kanalga a'zo bo'ling!`, {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "📢 Kanalga a'zo bo'lish", url: `https://t.me/${CHANNELS[0].replace('@','')}` }],
                                [{ text: "✅ Tekshirish", callback_data: 'check' }]
                            ]
                        }
                    });
                    return res.status(200).send('OK');
                }

                // Bazaga yozish (Referal bilan)
                const startParam = text.split(' ')[1];
                let { data: user } = await supabase.from('users').select('*').eq('id', uid).single();

                if (!user) {
                    await supabase.from('users').insert([{ 
                        id: uid, username: message.from.username || "Miner", 
                        balance: 5000, energy: 1000, referred_by: startParam ? parseInt(startParam) : null 
                    }]);
                    if (startParam) {
                        await supabase.rpc('increment_balance', { row_id: parseInt(startParam), amount: 5000 });
                    }
                }

                // O'yinga kirish tugmasi
                await bot.sendMessage(chatId, `⛏ *URAN qazishni boshlang!*`, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "🚀 O'YINNI OCHISH", web_app: { url: "https://urancoin.vercel.app" } }],
                            [{ text: "👥 DO'STLARNI CHAQIRISH", switch_inline_query: `💎 URAN qazishni boshla! \nhttps://t.me/URANCOIN_BOT?start=${uid}` }]
                        ]
                    }
                });
            }
        }
    } catch (e) {
        console.error('XATO:', e);
    }
    res.status(200).send('OK');
};
                                  
