require("dotenv").config();
const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const app = require('./app.js');

const bot = new Telegraf(process.env.BOT_TELEGRAN_TOKEN);
const chatid = process.env.TELEGRAN_CHAT_ID

// cria um menu com os comandos no chat do telegran
bot.telegram.setMyCommands([
    { command: 'start', description: 'inicia conversa com o bot' },
]);

//constante para o comando do help com a lista de comandos slash
const helpmessage = `
  Comandos do bot:
`;

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

// exibe as opções de comandos do bot
bot.help((ctx) => {
    ctx.reply(helpmessage);
})

bot.command('status', ctx => {
    ctx.reply(`Is Opened? ${app.isOpened}`);
});

bot.launch();