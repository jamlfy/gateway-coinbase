const gateway = require('gateway');
const CoinbaseAPI = require('coinbase');

module.exports = function (opts) {
	if( typeof opts != 'object' || !opts.APIKey || !opts.APISecret )
		throw new Error('The configuration is dont exist');

	var coinbase = new CoinbaseAPI({
		APIKey: opts.APIKey,
		APISecret: opts.APISecret
	});

	var payment = new Gateway.Strategy('coinbase', 0, 0, opts.url, opts);

	payment.add('create', function (options, callback) {
		var paymentData = payment.data();
		var param = {
			"button": {
				"name": "",
				"type": "buy_now",
				"price_string": 0,
				"price_currency_iso": opts.currency || 'USD'
			}
		};

		var data = {
			method : opts.showMethod || options.showMethod,
			id : options.id
		};
		
		param.button.description = options.items[0].description || option.description;
		param.button.title = options.items[0].title || option.title;
		param.button.custom = options.id;
		param.button.callback_url = options.return_url || payment.url('success', data );

		if( options.items[0].currency || options.currency )
			param.price_currency_iso = options.items[0].currency || options.currency;

		if( options.items ){
			for (var i = options.items.length - 1; i >= 0; i--)
				param.button.price_string += options.items[i].amount;		
		} else {
			param.button.price_string = param.amount.total;
		}

		coinbase.buttons.create(param, function (err, resp) {
			if(err) return callback(err);
			options._raw = resp;
			options.date = new Date();
			options.system = {
				id : resp.button.code,
				name : paymentData.name,
				state : resp.success ? "ACTIVE" : 'INACTIVE',
				url : {
					success :resp.button.callback_url
				},
			};
			options.link = [ 'https://www.coinbase.com/checkouts/' + resp.button.code ];
			callback(options);
		});
	});

	payment.add('payment', function (req, params, data, cb) {
		var payer = {
			payer_id : ''
		};

		if( req.query[ params.id ] )
			payer.payer_id = req.query[ params.id ];

		if( req.params[ params.id ] )
			payer.payer_id = req.params[ params.id ];

		var data = { id : data };
		coinbase.ordres.get( data, function (err, doc){
			if(err) return cb(err);
			data._raw = doc;
			data.state = doc.order.status === 'completed' ? 'approved' : 'pending' ;
			data.method = payment.data().name;
			data.uuid = doc.order.id;
			data.time = {
				create : new Date(doc.order.create_at),
			};
			data.payer =  doc.order.transaction;
			data.payer.address = doc.order.receive_address;
			cb(err, data);
		});
	});

	return payment;
};