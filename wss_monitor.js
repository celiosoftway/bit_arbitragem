require("dotenv").config();
const axios = require("axios");
const { Socket } = require('phoenix-channels')

const AUTH_TOKEN = process.env.SIGNATURE + process.env.API_KEY;
const COINPAIR = process.env.COINPAIR;

const SOCKET_URL = 'wss://bp-channels.gigalixirapp.com'

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
    //  console.clear();
    const coinPair = payload[COINPAIR];
    console.log('---');
    console.log('preço de venda: ',parseFloat(coinPair.sell).toFixed(0));
    console.log('preço de compra: ',parseFloat(coinPair.buy).toFixed(0));
    console.log('variação: ',coinPair.var);
    console.log('Spread : ',parseFloat(parseFloat(coinPair.sell).toFixed(0)) - parseFloat(coinPair.buy).toFixed(0));
})

/*
  buy = Preço de compra
  sell = Preço de venda

  Bid oferta de preço mais alto do lado da compra (maior para menor) oferta do comprador
  Ask oferta de preço mais baixo da venda (menor para maior) oferta do vendedor
 
  A mercado eu compro do melhor preço de livro:
    Compro da melhor oferta do book Ask
    Vendo para melhor oferta do book Bid

  A limite eu gero uma ordem com uma oferta melhor
*/

const ch_orderbook = socket.channel(`orderbook:${COINPAIR}`, {})
ch_orderbook.join()
    .receive('ok', resp => { console.log('Joined successfully', resp); })
    .receive('error', resp => { console.log('Unable to join', resp); })

ch_orderbook.on('snapshot', payload => {
    console.log('---');
    console.log('Asks - oferta de venda: ',parseFloat(payload.asks[0].price).toFixed(0))
    console.log('Bids - oferta de compra:', parseFloat(payload.bids[0].price).toFixed(0))
    console.log('Spread: ',parseFloat(payload.asks[0].price).toFixed(0) - parseFloat(payload.bids[0].price).toFixed(0) )
}) 
