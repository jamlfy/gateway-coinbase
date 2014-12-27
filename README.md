# Gateway Coinbase

	var Gateway = require('gateway');
	var coinbase = require('gateway-coinbase');

	Gateway.use( coinbase({
		APIKey : '-- MY ID --',
		APISecret : '-- MY SECRET --',
	}));

