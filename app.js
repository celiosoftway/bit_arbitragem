require("dotenv").config();
const axios = require("axios");

const url_balance = `https://api.bitpreco.com/v1/trading/balance`;

let amountToBuy = 0;
let amountToSell = 0;
let buyprice = 0;
let sellprice = 0;
let isOpened = false;
let isStartd = false;
let orderexe = 0
let id_buy = 0
let id_sell = 0

let time1 = new Date()
let time2 = new Date()

const AUTH_TOKEN = process.env.SIGNATURE + process.env.API_KEY;
const COINPAIR = process.env.COINPAIR;

const BUY_TRIGGER = parseFloat(process.env.BUY_TRIGGER);
const PROFITABILITY = parseFloat(process.env.PROFITABILITY);
const SELL_TRIGGER = BUY_TRIGGER * PROFITABILITY


// stream
const { Socket } = require('phoenix-channels')
const socket = new Socket(`wss://websocket.bitpreco.com/orderbook/socket`)
socket.connect();

socket.onOpen(() => console.log('Connected successfully'))
socket.onError(e => {
    console.error('Failed to connect to socket', e);
    process.exit(0);
})

const channel = socket.channel(`ticker:ALL-BRL`, {});
channel.join()
    .receive('ok', resp => console.log('Joined successfully', resp))
    .receive('error', resp => console.log('Unable to join', resp))


channel.on('price', payload => {
   // console.clear();

    const coinPair = payload[COINPAIR];
    console.log(`--`);
    console.log(`Is Opened? ${isOpened}`);
    console.log(`${orderexe} arbitragens executadas`)

    var data = {
        buy: coinPair.buy,
        sell: coinPair.sell,
        var: coinPair.var
    }

    time2 = new Date()
    let tempo = 10
    let miliseconds = time2.getTime() - time1.getTime();
    let seconds = miliseconds / 1000;
    let minutes = seconds / 60;

    if (isStartd) {
        tempo = minutes
    } else {
        isStartd = true
        tempo = 10
    }

    console.log(`Tempo: ${parseFloat(tempo).toFixed(2)}`)
    let dif = Math.abs(data.var)
    let dif2 = parseFloat(data.sell - data.buy).toFixed(0)

    if ((dif > 2) && (!isOpened) && (tempo > 2) && (dif2 > 1000)) {
        buyprice = data.buy + 200;
        sellprice = data.sell - 200;

        buyprice = parseFloat(buyprice).toFixed(0)
        sellprice = parseFloat(sellprice).toFixed(0)

        time1 = new Date()
        orderexe = orderexe + 1
        order();
    }

    console.log(`preço de compra: ${data.buy}, preço de venda: ${data.sell} Variação ${dif}, Dif :${dif2}` );
})
// stream fim

async function order() {
    //console.clear();
    await balance()

    buy_result = await buy(buyprice + 150)

    console.log('log da ordem de compra')
    console.log(buy_result.success)
    console.log(buy_result)


    if (buy_result.success == true) {
        isOpened = true

        id_buy = buy_result.order_id
        console.log(`Id da ordem de compra: ${id_buy}`)

        sell_result = await sell(sellprice - 150)

        console.log('log da ordem de compra')
        console.log(buy_result)

        if (sell_result.success == false) {
            console.log(`Erro ao vender: ${sell_result.message_cod}`)
            process.exit(0);
        } else {
            id_sell = sell_result.order_id
            console.log(`Id da ordem de venda: ${id_sell}`)
            console.log('log da ordem de venda')
            console.log(sell_result)

            fechaordem(id_buy, id_sell)
        }
    } else {
        console.log(`Erro ao comprar: ${buy_result.message_cod}`)
        process.exit(0);
    }
}

async function fechaordem(idcompra, idvenda) {
    let isfinish = false
    let result = 0
    let timer = ms => new Promise(res => setTimeout(res, ms))

    while (!isfinish) {
        await timer(30000)

        result = await status(idcompra)
        if(result.success == true){
            console.log(`Ordem de compra id ${idcompra}: ${result.order.status}`)

            if (result.order.status == 'FILLED') {
                isfinish = true;
            }
        }else {
            console.log(`Ordem de compra id ${idcompra}: ${result.message_cod}`)
            isfinish = true;
        }

        result = await status(idvenda)
        if(result.success == true){
            console.log(`Ordem de venda id ${idvenda}: ${result.order.status}`)

            if (result.order.status == 'FILLED' && isfinish) {
                isfinish = true;
            } else {
                isfinish = false;
            }
        }else {
            console.log(`Ordem de compra id ${idcompra}: ${result.message_cod}`)
        }
    }

    isOpened = false;
}

async function balance() {
    const url_balance = `https://api.bitpreco.com/v1/trading/balance`;

    const data = {
        auth_token: AUTH_TOKEN
    }

    const result = await axios.post(url_balance, data);

    amountToBuy = (result.data.BRL * 50) / 100
    amountToSell = (result.data.BTC * 50) / 100

    var dados = {
        success: result.data.success,
        BTC: result.data.BTC,
        BRL: result.data.BRL,
        ToBuy: amountToBuy,
        ToSell: amountToSell
    }

    console.log(dados)
    return dados;
}

async function ticker() {
    const url = `https://api.bitpreco.com/btc-brl/ticker`;

    const result = await axios.post(url);

    console.log(result.data)
    return result.data;
}

async function orderbook() {
    //asks: lista das ofertas de venda disponíveis
    //bids: lista das ofertas de compra disponíveis

    const url = `https://api.bitpreco.com/btc-brl/orderbook`;
    const result = await axios.post(url);

    const min = result.data.asks.reduce((a, b) => {
        if (b.price < a.price) a = b;
        return a;
    });

    const max = result.data.bids.reduce((a, b) => {
        if (b.price > a.price) a = b;
        return a;
    });

    let asks = min.price //ofertas de venda
    let bids = max.price //ofertas de compra
    let dif = ((bids - asks) / ((bids + asks) / 2)) * 100
    dif = parseFloat(dif.toFixed(2));

    //Encontre a diferença absoluta entre dois números: |a - b|.
    //Encontre a média desses dois números: (a + b) / 2.
    //Divida a diferença pela média: |a - b| / ((a + b) / 2).
    //Expresse o resultado em porcentagens multiplicando-o por 100.

    console.log(`compre por ${min.price}`);
    console.log(`Venda por ${max.price}`);
    console.log(`Variação de ${dif}%`);

    return result.data;
}

async function status(orderid) {
    const url = `https://api.bitpreco.com/v1/trading/order_status`;

    const data = {
        order_id: orderid,
        auth_token: AUTH_TOKEN
    }

    const result = await axios.post(url, data);

    // console.log(result.data)
    return result.data;
}

async function buy(pricetoby) {
    await balance()

    const url = `https://api.bitpreco.com/v1/trading/buy`;

    const data = {
        market: COINPAIR,
        limited: true,
        auth_token: AUTH_TOKEN,
        price: pricetoby,
        amount: amountToBuy / pricetoby
    }

    const result = await axios.post(url, data);
    console.log(result.data)

    return result.data;
}

async function sell(pricetosell) {
    const url = `https://api.bitpreco.com/v1/trading/sell`;

    await balance()

    const data = {
        market: COINPAIR,
        limited: true,
        auth_token: AUTH_TOKEN,
        price: pricetosell,
        amount: amountToSell
    }

    const result = await axios.post(url, data);
    console.log(result.data)


    return result.data;
}

module.exports = {
    isOpened
}


