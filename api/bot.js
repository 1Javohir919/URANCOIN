const { createClient } = require('@supabase/supabase-js');
const TelegramBot = require('node-telegram-bot-api');

// Supabase ma'lumotlaringiz (Bularni o'zgartirmang)
const supabase = createClient('https://xgqctjchppduhbickbmd.supabase.co', 'sb_publishable_E2zmVN0qXUHAovMaet8nog_8-IwSm-V');

// SIZNING BOT TOKENINGIZ
const bot = new TelegramBot('7811209905:AAHTFGdyjM48VHmdvBo4tqIuY5MhuW911DM', { polling: true });

// MAJBURIY KANAL (Buni o'zingizni kanalingizga almashtiring)
const CHANNELS = ['@TechHub201']; 

async function checkSub(uid) {
    try {
        const res = await bot.getChatMember(CHANNELS[0], uid);
        return res.status !== 'left' && res.status !== 'kicked';
    } catch { return false; }
}

bot.onText(/\/start (.+)?/, async (msg, match) => {
    const cid = msg.chat.id;
    const uid = msg.from.id;
    const username = msg.from.username || "Miner";
    const referrerId = match[1];

    const isSub = await checkSub(uid);

    if (!isSub) {
        return bot.sendMessage(cid, `☢️ *URANCOIN* Minerga kirish uchun rasmiy kanalga a'zo bo'ling!`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📢 Kanalga a'zo bo'lish", url: `https://t.me/${CHANNELS[0].replace('@','')}` }],
                    [{ text: "✅ Tekshirish", callback_data: 'check' }]
                ]
            }
        });
    }

    try {
        // Foydalanuvchini bazadan qidirish
        let { data: user } = await supabase.from('users').select('*').eq('id', uid).single();

        if (!user) {
            // Yangi foydalanuvchi bo'lsa ro'yxatga olish va 5000 bonus
            await supabase.from('users').insert([{ 
                id: uid, 
                username: username, 
                balance: 5000,
                energy: 1000,
                referred_by: referrerId ? parseInt(referrerId) : null
            }]);

            // Taklif qilgan odamga bonus berish
            if (referrerId) {
                await supabase.rpc('increment_balance', { row_id: parseInt(referrerId), amount: 5000 });
                bot.sendMessage(referrerId, `👥 Do'stingiz ${username} qo'shildi! Sizga +5000 URAN berildi.`);
            }
        }

        bot.sendMessage(cid, `⛏ *URAN qazishni boshlang!* \n\nSizning hisobingizda *5000 URAN* bonus bor.`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🚀 O'YINNI OCHISH", web_app: { url: "https://file-bot-24.vercel.app" } }],
                    [{ text: "👥 DO'STLARNI CHAQIRISH", switch_inline_query: `💎 URANCOIN qazishni boshla va Telegram Stars yutib ol! \n\nhttps://t.me/URANCOIN_BOT?start=${uid}` }]
                ]
            }
        });
    } catch (e) { console.error(e); }
});

// Tekshirish tugmasi bosilganda
bot.on('callback_query', async (query) => {
    if (query.data === 'check') {
        const isSub = await checkSub(query.from.id);
        if (isSub) {
            bot.deleteMessage(query.message.chat.id, query.message.message_id);
            bot.sendMessage(query.message.chat.id, "✅ Rahmat! Endi /start bosing.");
        } else {
            bot.answerCallbackQuery(query.id, { text: "Hali a'zo bo'lmadingiz!", show_alert: true });
        }
    }
});
                               
