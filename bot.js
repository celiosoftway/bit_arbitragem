require("dotenv").config();
const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const app = require('./app.js');

const bot = new Telegraf(process.env.BOT_TELEGRAN_TOKEN);
const chatid = process.env.TELEGRAN_CHAT_ID

// cria um menu com os comandos no chat do telegran
bot.telegram.setMyCommands([
    { command: 'start', description: 'inicia conversa com o bot' },
    { command: 'balance', description: 'Verifica o saldo da conta' },
]);

//constante para o comando do help com a lista de comandos slash
const helpmessage = `
  Comandos do bot:
  /balance  Verifica o saldo da conta
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

bot.command('balance', ctx => {
    getBalance()
});

async function getBalance() {
    const balance = await app.balance()

    if (balance.success == true){
        bot.telegram.sendMessage(chatid, `
        BTC: ${balance.BTC},
        BRL: ${balance.BRL},
        ToBuy: ${balance.ToBuy},
        ToSell: ${balance.ToSell}`)
    }else{
        bot.telegram.sendMessage(chatid, `Erro ao verificar o saldo`)
    }
   
}

success: true,


bot.launch();