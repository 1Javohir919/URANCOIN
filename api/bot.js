const { createClient } = require('@supabase/supabase-js');
const TelegramBot = require('node-telegram-bot-api');

// 1. Supabase va Bot sozlamalari
const supabase = createClient('https://xgqctjchppduhbickbmd.supabase.co', 'sb_publishable_E2zmVN0qXUHAovMaet8nog_8-IwSm-V');
const bot = new TelegramBot('7811209905:AAHTFGdyjM48VHmdvBo4tqIuY5MhuW911DM');

// 2. Majburiy kanal (O'zingiznikiga almashtiring)
const CHANNELS = ['@TechHub']; 

// 3. Webhook funksiyasi (Vercel uchun)
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(200).send('Webhook is working!');
    }

    const { message, callback_query } = req.body;

    // Tekshirish tugmasi bosilganda (Callback)
    if (callback_query) {
        const uid = callback_query.from.id;
        const isSub = await checkSub(uid);
        if (isSub) {
            await bot.answerCallbackQuery(callback_query.id, { text: "Rahmat! Endi o'yinga kirishingiz mumkin." });
            await bot.sendMessage(callback_query.message.chat.id, "✅ Tayyor! Endi /start buyrug'ini bosing.");
        } else {
            await bot.answerCallbackQuery(callback_query.id, { text: "Hali kanalga a'zo bo'lmadingiz!", show_alert: true });
        }
        return res.status(200).send('OK');
    }

    if (!message || !message.text) return res.status(200).send('OK');

    const chatId = message.chat.id;
    const uid = message.from.id;
    const text = message.text;

    // 4. Majburiy obunani tekshirish
    async function checkSub(userId) {
        try {
            const member = await bot.getChatMember(CHANNELS[0], userId);
            return member.status !== 'left' && member.status !== 'kicked';
        } catch { return false; }
    }

    if (text.startsWith('/start')) {
        const isSub = await checkSub(uid);
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

        // 5. Bazaga yozish va referal tizimi
        const startParam = text.split(' ')[1];
        try {
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

            await bot.sendMessage(chatId, `⛏ *URAN qazishni boshlang!*`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🚀 O'YINNI OCHISH", web_app: { url: "https://urancoin.vercel.app" } }],
                        [{ text: "👥 DO'STLARNI CHAQIRISH", switch_inline_query: `https://t.me/URANCOIN_BOT?start=${uid}` }]
                    ]
                }
            });
        } catch (e) { console.error(e); }
    }

    res.status(200).send('OK');
    }
  
