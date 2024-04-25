const axios = require("axios");
require("dotenv").config();
const url_balance = `https://api.bitpreco.com/v1/trading/balance`;
const AUTH_TOKEN = process.env.SIGNATURE + process.env.API_KEY;
const COINPAIR = process.env.COINPAIR;

let buyprice = 0;
let sellprice = 0;

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
    console.clear();
    const coinPair = payload[COINPAIR];

    var data = {
        buy: coinPair.buy,
        sell: coinPair.sell,
        var: coinPair.var
    }

    console.log(data);

    buyprice = data.buy;
    sellprice = data.sell;

    console.log(`preço de compra: ${buyprice},\npreço de venda: ${sellprice},\nvariação: ${data.var},\nDif :${parseFloat(sellprice -buyprice).toFixed(0)}` );
})