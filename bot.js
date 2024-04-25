const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
require("dotenv").config();
const bot = new Telegraf(process.env.BOT_TELEGRAN_TOKEN);
const chatid = process.env.TELEGRAN_CHAT_ID

// comando start, envia uma mensagem em privato
bot.command('start', (ctx) => {
    console.clear();

    if (ctx.from.id == chatid) {
        ctx.reply('Olá\n' +
            'Use o comando /help para ver a lista de comandos');
    } else {
        ctx.reply('Olá\n' +
            'Usuario sem permissão para usar esse bot');
    }

    console.log(ctx)
    console.log(ctx.update.message.from)
    return true;
})

bot.launch();