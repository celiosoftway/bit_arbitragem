require("dotenv").config();
const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const axios = require("axios");

const bot = new Telegraf(process.env.BOT_TELEGRAN_TOKEN);
const chatid = process.env.TELEGRAN_CHAT_ID
const AUTH_TOKEN = process.env.SIGNATURE + process.env.API_KEY;
const COINPAIR = process.env.COINPAIR;

let buyprice = 0;
let sellprice = 0;
let variacao = 0
let bid = 0
let ask = 0

// stream
const { Socket } = require('phoenix-channels')
const socket = new Socket(`wss://websocket.bitpreco.com/orderbook/socket`)
socket.connect();

socket.onOpen(() => console.log('Connected successfully'))
socket.onError(e => {
    console.error('Failed to connect to socket', e);
    process.exit(0);
})

const ch_ticker = socket.channel(`ticker:ALL-BRL`, {});
ch_ticker.join()
    .receive('ok', resp => console.log('Joined successfully', resp))
    .receive('error', resp => console.log('Unable to join', resp))

ch_ticker.on('price', payload => {
    const coinPair = payload[COINPAIR];
    buyprice = parseFloat(coinPair.buy).toFixed(0);
    sellprice = parseFloat(coinPair.sell).toFixed(0);
    variacao = coinPair.var
})

const ch_orderbook = socket.channel(`orderbook:${COINPAIR}`, {})
ch_orderbook.join()
    .receive('ok', resp => { console.log('Joined successfully', resp); })
    .receive('error', resp => { console.log('Unable to join', resp); })

ch_orderbook.on('snapshot', payload => {
    ask = payload.asks[0].price
    bid =  payload.bids[0].price

    ask = parseFloat(ask).toFixed(0);
    bid = parseFloat(bid).toFixed(0);
}) 
// stream fim

// cria um menu com os comandos no chat do telegran
bot.telegram.setMyCommands([
    { command: 'start', description: 'inicia conversa com o bot' },
    { command: 'balance', description: 'Verifica o saldo da conta' },
    { command: 'mercado', description: 'Verifica o valor atual no mercado' },
]);

//constante para o comando do help com a lista de comandos slash
const helpmessage = `
  Comandos do bot:
  /balance Verifica o saldo da conta
  /mercado Verifica o valor atual no mercado
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

bot.command('balance', ctx => {
    getBalance()
});

async function getBalance() {
    const url_balance = `https://api.bitpreco.com/v1/trading/balance`;
    const data = { auth_token: AUTH_TOKEN }
    const result = await axios.post(url_balance, data);

    var dados = {
        success: result.data.success,
        BTC: result.data.BTC,
        BRL: result.data.BRL,
        ToBuy: (result.data.BRL * 50) / 100,
        ToSell:  (result.data.BTC * 50) / 100
    }

    if (dados.success == true) {
        bot.telegram.sendMessage(chatid, `
        ---
        BTC: ${dados.BTC},
        BRL: ${dados.BRL},
        ToBuy: ${dados.ToBuy},
        ToSell: ${dados.ToSell}`)
    } else {
        bot.telegram.sendMessage(chatid, `Erro ao verificar o saldo`)
    }

}


bot.command('mercado', ctx => {
    bot.telegram.sendMessage(chatid, `
    ---
    preço de venda: ${sellprice}, 
    preço de compra: ${buyprice}, 
    Variação ${variacao}, 
    Spread :${sellprice - buyprice}
    ---
    Asks - oferta de venda:${ask}
    Bids - oferta de compra:${bid}
    Spread:${ask - bid}
    ---
    `)
});
bot.launch();