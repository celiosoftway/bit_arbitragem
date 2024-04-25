const axios = require("axios");
require("dotenv").config();

const AUTH_TOKEN = process.env.SIGNATURE + process.env.API_KEY;
const COINPAIR = process.env.COINPAIR;

let amountToBuy = 0;
let amountToSell = 0;
let id_buy = 0
let id_sell = 0
let buyprice = 0;
let sellprice = 0;

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

async function status(orderid) {
    const url = `https://api.bitpreco.com/v1/trading/order_status`;

    const data = {
        order_id: orderid,
        auth_token: AUTH_TOKEN
    }

    const result = await axios.post(url, data);

    console.log(result.data)
    return result.data;
}

async function buy(pricetoby, limite) {

    await balance()

    const url = `https://api.bitpreco.com/v1/trading/buy`;

    const data = {
        market: COINPAIR,
        limited: limite,
        auth_token: AUTH_TOKEN,
    }

    if (limite == true) {
        data.price = pricetoby,
            data.amount = amountToBuy / pricetoby
    } else {
        data.volume = amountToBuy;
    }

    const result = await axios.post(url, data);
    console.log(result.data)

    id_buy = result.data.order_id
    console.log(data)
    console.log(`Id da ordem de compra: ${id_buy}`)

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
    let dif2 = parseFloat(bids.toFixed(0)) - parseFloat(asks.toFixed(0))

    //Encontre a diferença absoluta entre dois números: |a - b|.
    //Encontre a média desses dois números: (a + b) / 2.
    //Divida a diferença pela média: |a - b| / ((a + b) / 2).
    //Expresse o resultado em porcentagens multiplicando-o por 100.

    console.log(`compre por ${bids}`);
    console.log(`Venda por ${asks}`);
    console.log(`Variação de ${dif}%, equivalente a ${dif2}`);

    buyprice = bids;
    sellprice = asks;

    return result.data;
}

async function ticker() {
    const url = `https://api.bitpreco.com/btc-brl/ticker`;
    const result = await axios.post(url);

    console.log(result.data)
    return result.data;
}

async function exec_order() {
    const url = `https://api.bitpreco.com/v1/trading/executed_orders`;

    const data = {
        market: COINPAIR,
        auth_token: AUTH_TOKEN,
    }

    const result = await axios.post(url, data);
    console.log(result.data)
    return result.data;
}

async function order(){
   console.clear();
   await balance()
   await orderbook()
   await buy(buyprice, true)
   await sell(sellprice)
}






