const express = require('express');
const request = require('request');
const cheerio = require('cheerio');
const app = express();

const ILIAD_BASE_URL = 'https://www.iliad.it/account/';
const ILIAD_OPTION_URL = {
	information: 'i-miei-dati-personali',
	credit: 'consumi-e-credito',
	voicemail: 'segreteria-telefonica',
	options: 'le-mie-opzioni',
	services: 'i-miei-servizi',
	recharge: 'rechargement',
	activation: 'attivazione-della-sim',
	document: 'le-condizioni-della-mia-offerta',
	recover: 'forget'
};
// Area Personale
app.get('/login', function (req, res) {
	res.type('json'); // set Content-Type response
	// get the information from the request query string
	var userid = req.query.userid;
	var password = req.query.password;

	var data_store = { 'data': {}, 'status': ''};

	if (userid && password) {
		var formData = {
			'login-ident': userid,
			'login-pwd': password
		}
		var options = {
			url: ILIAD_BASE_URL,
			method: 'POST',
			formData: formData
		};
		request(options, function (error, response, body) {
			if (!error) {
				var token = response["headers"]["set-cookie"][0].split(";")[0].split("=")[1] // get token from response cookies
				var options = {
					url: ILIAD_BASE_URL,
					method: "POST",
					headers: {cookie: "ACCOUNT_SESSID=" + token}
				};
				request(options, function (error, response, body) {
					const $ = cheerio.load(body);
					var results = $('body');
					results.each(function (i, result) {
						try {
							var nav = $(result).find("div.current-user").first().text().split("\n"); // get the div tag with account informations
							data_store["data"]["id"] = nav[2].replace(/^\s+|\s+$/gm, "").split(": ")[1]; // get id 
							data_store["data"]["name"] = nav[1].replace(/^\s+|\s+$/gm, ""); // get name and surname
							data_store["data"]["number"] = nav[3].replace(/^\s+|\s+$/gm, "").split(": ")[1]; // get telephone number
							data_store["data"]["token"] = token; 
							data_store["status"] = "success";
							res.status(200).send(data_store);
						} catch (exeption) {
							data_store["data"]["message"] = $(result).find("div.flash-error").first().text().replace(/^\s+|\s+$/gm, "").split("\n")[0]; // get message error
							data_store["status"] = "success";
							res.status(200).send(data_store);
						}
					});
				});
			} else {
				data_store = { "error": error, 'status': "error"};	
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};
		res.status(400).send(data_store);
	}
});
app.get('/logout', function (req, res) {
	res.type('json'); // set Content-Type response
	// get the information from the request query string
	var token = req.query.token;
	var data_store = { 'data': {}, 'status': ''};
	if (token) {
		var options = {
			url: ILIAD_BASE_URL + "?logout=user",
			method: "GET",
			headers: {
				cookie: 'ACCOUNT_SESSID=' + token // access cookie
			}
		}
		request(options, function (error, response, body) {
			if (!error) {
				data_store["status"] = "success";
				res.status(200).send(data_store);
			} else {
				data_store = { "error": error, 'status': "error"};
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};
		res.status(400).send(data_store);
	}
})
app.get('/recover', function (req, res) {
	res.type('json'); // set Content-Type response
	// get the information from the request query string
	// with email and userid
	var email = req.query.email;
	var userid = req.query.userid;
	// with name
	var name = req.query.name;
	var surname = req.query.surname;
	var data_store = { 'data': {}, 'status': ''};
	if (email && userid){
		var formData = {
			login: userid,
			email: email
		};
	} else if (email && name && surname){
		var formData = {
			nom: surname,
			prenom: name,
			email: email
		};	
	}
	if (formData){
		var options = {
			url: ILIAD_BASE_URL + ILIAD_OPTION_URL['recover'],
			method: 'POST',
			formData: formData,
			followAllRedirects: true
		};

		request(options, function (error, response, body) {
			if (!error) {
				const $ = cheerio.load(body);
				var results = $('body');
				results.each(function (i, result) {
					data_store["data"]["message"] = $(result).find("div.flash").first().text().replace(/^\s+|\s+$/gm, "").split("\n")[0];
					data_store["status"] = "success";
					res.status(200).send(data_store);
				});
			} else {
				data_store = { "error": error, 'status': "error"};	
				res.status(500).send(data_store);
			}
		})
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};
		res.status(400).send(data_store);
	}
});
app.get('/information/get', function (req, res) {
	res.type('json'); // set Content-Type response
	var token = req.query.token;
	var puk = req.query.puk;
	var data_store = { 'data': {}, 'status': ''};
	if (token) {
		var options = {
			url: ILIAD_BASE_URL + ILIAD_OPTION_URL['information'],
			method: 'POST',
			headers: {
				'cookie': 'ACCOUNT_SESSID=' + token // access cookie
			}
		};
		request(options, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				try{
					const $ = cheerio.load(body);
					var results = $('body');
					var array = [];
					results.each(function (i, result) {
						$(result).find("div.current-user").first().text().split("\n")[2].replace(/^\s+|\s+$/gm, "").split(": ")[1]; // if logged in
						$(result)
							.find('div.infos__content')
							.each(function (index, element) {
								array = array.concat([$(element).find('div.infos__text').text()]);
							});

						data_store["data"]["address"] = array[0].split('\n')[3].replace(/^\s+|\s+$/gm, ''); // get address
						data_store["data"]["cap"] = array[0].split('\n')[5].replace(/^\s+|\s+$/gm, ''); // get cap
						try {
							data_store["data"]["pay_method"] = array[1].split('\n')[2].replace(/^\s+|\s+$/gm, '') + " | " + array[1].split('\n')[3].replace(/^\s+|\s+$/gm, ''); // get pay method 
							data_store["data"]["pay_card"] = array[1].split('\n')[4].replace(/^\s+|\s+$/gm, ''); // get pay method card
						} catch (exception) {
							data_store["data"]["pay_method"] = array[1].split('\n')[2].replace(/^\s+|\s+$/gm, ''); // get pay method
						}
						data_store["data"]["mail"] = array[2].split('\n')[2].replace(/^\s+|\s+$/gm, ''); // get mail
						data_store["data"]["password"] = array[3].split('\n')[2].replace(/^\s+|\s+$/gm, ''); // get password
						if (puk || puk == '') {
							var options = {
								method: 'GET',
								url: ILIAD_BASE_URL + ILIAD_OPTION_URL['information'],
								qs: {
									show: 'puk'
								},
								headers: {
									"Cache-Control": "no-cache",
									"x-requested-with": "XMLHttpRequest",
									cookie: "ACCOUNT_SESSID=" + token,
									"accept-language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7,pt;q=0.6",
									accept: "application/json, text/javascript, */*; q=0.01",
									scheme: "https",
									method: "GET",
									authority: "www.iliad.it"
								},
								json: true
							};
							request(options, function (error, response, body) {
								if(!error) {
									if (body[0]["result"]["data"]) {
										data_store["data"]["puk"] = body[0]["result"]["data"]["code_puk"]; // get puk value
									} else {
										data_store["data"]["puk"] = "Codice PUK non disponibile";
									}
									data_store["status"] = "success";
									res.status(200).send(data_store);
								} else {
									data_store = { "error": error, 'status': "error"};	
									res.status(500).send(data_store);
								}
							});
						}else{
							data_store["status"] = "success";
							res.status(200).send(data_store);
						}
					});
				} catch (e) {
					data_store = { "error": "Invalid token", 'status': "error"};
					res.status(400).send(data_store);
				}
			} else {
				data_store = { "error": error, 'status': "error"};	
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};
		res.status(400).send(data_store);
	}
});
app.get('/information/email', function (req, res) {
	res.type('json'); // set Content-Type response
	var data_store = { 'data': {}, 'status': ''};
	var token = req.query.token;
	var email = req.query.email;
	var password = req.query.password;
	if (email && password && token) {
		var formData = {
			email: email,
			'email-confirm': email,
			password: password
		}
		var options = {
			url: ILIAD_BASE_URL + ILIAD_OPTION_URL['information'] + '/email',
			method: 'POST',
  			followAllRedirects: true,
			headers: {
				'cookie': 'ACCOUNT_SESSID=' + token //cookie di accesso
			},
			formData: formData
		};
		request(options, function (error, response, body) {
			if (!error) {
				var referer = response["request"]["headers"]["referer"];
				if (referer) {
					const $ = cheerio.load(body);
					var results = $('body');
					results.each(function (i, result) {
						data_store["data"]["message"] = $(result).find("div.flash").first().text().replace(/^\s+|\s+$/gm, "").split("\n")[0];
						data_store["status"] = "success";
						res.status(200).send(data_store);
					});
				} else {
					data_store = { "error": "Invalid token", 'status': "error"};
					res.status(400).send(data_store);
				}
			} else {
				data_store = { "error": error, 'status': "error"};	
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};
		res.status(400).send(data_store);
	}
});
app.get('/information/password', function (req, res) {
	res.type('json'); // set Content-Type response
	var data_store = { 'data': {}, 'status': ''};
	var token = req.query.token;
	var password = req.query.password;
	var new_password = req.query.new_password;
	if (new_password && password && token) {
		var formData = {
			'password-current': password,
			'password-new': new_password,
			'password-new-confirm': new_password
		}
		var options = {
			url: ILIAD_BASE_URL + ILIAD_OPTION_URL['information'] + '/password',
			method: 'POST',
  			followAllRedirects: true,
			headers: {
				'cookie': 'ACCOUNT_SESSID=' + token //cookie di accesso
			},
			formData: formData
		};
		request(options, function (error, response, body) {
			if (!error) {
				var referer = response["request"]["headers"]["referer"];
				if (referer) {
					const $ = cheerio.load(body);
					var results = $('body');
					results.each(function (i, result) {
						data_store["data"]["message"] = $(result).find("div.flash").first().text().replace(/^\s+|\s+$/gm, "").split("\n")[0];
						data_store["status"] = "success";
						res.status(200).send(data_store);
					});
				} else {
					data_store = { "error": "Invalid token", 'status': "error"};
					res.status(400).send(data_store);
				}
			} else {
				data_store = { "error": error, 'status': "error"};	
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};
		res.status(400).send(data_store);
	}
});
app.get('/information/pay', function (req, res) {
	res.type('json'); // set Content-Type response
	// get the information from the request query string
	var token = req.query.token;
	var password = req.query.password;
	// change payment method
	var method = req.query.method;
	// cb
	var cbtype = req.query.cbtype;
	var cbnumero = req.query.cbnumero;
	var cbexpmois = req.query.cbexpmois;
	var cbexpannee = req.query.cbexpannee;
	var cbcrypto = req.query.cbcrypto;
	// sepa
	var sepatitulaire = req.query.sepatitulaire;
	var sepabic = req.query.sepabic;
	var sepaiban = req.query.sepaiban;

	var data_store = { 'data': {}, 'status': ''};
	// richiesta per cambiare la mail
	if (method == 'aucun' && token && password) {
		var formData = {
			'mode-paiement': method,
			password: password
		};
	} else if (method == 'cb' && cbtype && cbnumero && cbexpmois && cbexpannee && cbcrypto && token && password) {
		var formData = {
			'mode-paiement': method,
			'cb-type': cbtype,
			'cb-numero': cbnumero,
			'cb-exp-mois': cbexpmois,
			'cb-exp-annee': cbexpannee,
			'cb-crypto': cbcrypto,
			password: password
		};
	} else if (method == 'seba' && sepatitulaire && sepabic && sepaiban && token && password) {
		var formData = {
			'mode-paiement': method,
			'sepa-titulaire': sepatitulaire,
			'sepa-bic': sepabic,
			'sepa-iban': sepaiban,
			password: password
		};
	}
	if (formData) {
		var options = {
			url: ILIAD_BASE_URL + ILIAD_OPTION_URL['information'] + '/paiement',
			method: 'POST',
			headers: {
				'cookie': 'ACCOUNT_SESSID=' + token //cookie di accesso
			},
			formData: formData,
  			followAllRedirects: true
		};
		request(options, function (error, response, body) {
			if (!error) {
				var referer = response["request"]["headers"]["referer"]
				if (referer) {
					const $ = cheerio.load(body);
					var results = $('body');
					results.each(function (i, result) {
						data_store["data"]["message"] = $(result).find("div.flash").first().text().replace(/^\s+|\s+$/gm, "").split("\n")[0];
						data_store["status"] = "success";
						res.status(200).send(data_store);
					})
				} else {
					data_store = { "error": "Invalid token", 'status': "error"};
					res.status(400).send(data_store);
				}
			} else {
				data_store = { "error": error, 'status': "error"};	
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};
		res.status(200).send(data_store);
	}
});
app.get('/sim/get', function (req, res) {
	res.type('json'); // set Content-Type response
	var token = req.query.token;
	var data_store = { 'data': {}, 'status': ''};
	if (token) {
		var options = {
			url: ILIAD_BASE_URL + ILIAD_OPTION_URL["activation"],
			method: 'GET',
			headers: {
				'cookie': 'ACCOUNT_SESSID=' + token // access cookie
			}
		};
		request(options, function (error, response, body) {
			if (!error) {
				try {
					const $ = cheerio.load(body);
					var results = $('body');
					results.each(function (i, result) {
						$(result).find("div.current-user").first().text().split("\n")[2].replace(/^\s+|\s+$/gm, "").split(": ")[1]; // if logged in
						var check = $(result).find('div.step__text').find('p.green').text();
						data_store["data"]["shipping"] = $(result).find('a.red').attr('href'); // tracking link
						data_store["data"]["order_date"] = $(result).find('div.step__text').first().text().split('\n')[3].replace(/^\s+|\s+$/gm, ''); // date
						if (check == 'SIM attivata') {
							data_store["data"]["active"] = true;
						} else {
							data_store["data"]["active"] = false;
						}
						data_store["data"]["offert"] = $(result).find('h2.title').first().text().replace(/^\s+|\s+$/gm, '').split(' a ')[1]; // offert
						data_store["status"] = "success";
						res.status(200).send(data_store);
					});
				} catch (e) {
					data_store = { "error": "Invalid token", 'status': "error"};
					res.status(400).send(data_store);
				}
			} else {
				data_store = { "error": error, 'status': "error"};	
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};
		res.status(400).send(data_store);
	}
});
app.get('/sim/activation', function (req, res) {
	res.type('json'); // set Content-Type response
	var data_store = { 'data': {}, 'status': ''};
	var iccid = req.query.iccid;
	var token = req.query.token;
	if (iccid && token) {
		var options = {
			url: ILIAD_BASE_URL + ILIAD_OPTION_URL['activation'],
			method: 'POST',
			headers: {
				'cookie': 'ACCOUNT_SESSID=' + token // access cookie
			},
			formData: {
				iccid: iccid
			}
		};
		request(options, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				try {
					const $ = cheerio.load(body);
					var results = $('body');
					results.each(function (i, result) {
						data_store["data"]["message"] = $(result).find("div.flash").first().text().replace(/^\s+|\s+$/gm, "").split("\n")[0];
						data_store["status"] = "success";
						res.status(200).send(data_store);

					});
				} catch (e) {
					data_store = { "error": "Invalid token", 'status': "error"};
					res.status(400).send(data_store);
				}
			} else {
				data_store = { "error": error, 'status': "error"};	
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};
		res.status(400).send(data_store);
	}
});
app.get('/credit/get', function (req, res) {
	res.type('json'); // set Content-Type response
	var details = req.query.details;
	var type = req.query.type;
	var token = req.query.token;
	var data_store = { 'data': {}, 'status': ''};
	if (type && token) {
		var options = {
			url: ILIAD_BASE_URL + ILIAD_OPTION_URL['credit'],
			method: 'GET',
			headers: {
				'cookie': 'ACCOUNT_SESSID=' + token
			},
		};
		request(options, function (error, response, body) {
			if (!error) {
				try {
					if (type == "italy") {
						var x = 0;
					} else if (type == "roaming") {
						var x = 4;
					}
					if (x == 4 || x == 0) {
						var array2 = [];
						const $ = cheerio.load(body);
						var results = $('body');
						results.each(function (i, result) {
							$(result).find("div.current-user").first().text().split("\n")[2].replace(/^\s+|\s+$/gm, "").split(": ")[1]; // if logged in
							$(result)
								.find('div.conso__content')
								.each(function (index, element) {
									array2 = array2.concat([$(element).find('div.conso__text').text().replace(/^\s+|\s+$/gm, '')]);
								});
							data_store["data"]["credit"] = $(result).find('h2').find('b.red').text().replace(/^\s+|\s+$/gm, '');
							data_store["data"]["renewal"] = $(result).find('div.end_offerta').text().replace(/^\s+|\s+$/gm, '').match( /\d{2}\/\d{2}\/\d{4}/)[0]; //titole credito
							name = ['call', 'sms', 'data', 'mms'];
							for (var y = 1; y < 5; y++) {
								var z = y - 1;
								data_store["data"][name[z]] = {};
								if (array2[x + z].split('\n')[0].split(": ")[1]){
									data_store["data"][name[z]]["consumption"] = array2[x + z].split('\n')[0].split(": ")[1]; //tipo
								} else {
									data_store["data"][name[z]]["consumption"] = array2[x + z].split('\n')[0].split(" ")[0]; //tipo
								}
								data_store["data"][name[z]]["credit_consumption"] = array2[x + z].split('\n')[1].split(': ')[1]; //consumi
							}
							data_store["status"] = "success";
							res.status(200).send(data_store);
						});
					} else {
						res.type('text'); // set Content-Type response
						res.send("Cannot GET /credit/" + type + "/");
					}
				} catch (e) {
					data_store = { "error": "Invalid token", 'status': "error"};
					res.status(400).send(data_store);
				}
			} else {
				data_store = { "error": error, 'status': "error"};	
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};
		res.status(400).send(data_store);
	}
});
app.get('/credit/details', function (req, res) {
	res.type('json'); // set Content-Type response
	var token = req.query.token;
	var data_store = { 'data': {}, 'status': ''};
	if (token) {
		var options = {
			umethod: 'GET',
			url: ILIAD_BASE_URL + ILIAD_OPTION_URL['credit'],
			qs: {
				details: ''
			},
			headers: {
				'Cache-Control': 'no-cache',
				'x-requested-with': 'XMLHttpRequest',
				referer: ILIAD_BASE_URL + ILIAD_OPTION_URL['credit'],
				cookie: 'ACCOUNT_SESSID=' + token,
				'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7,pt;q=0.6',
				accept: 'application/json, text/javascript,; q=0.01',
				scheme: 'https',
				method: 'GET',
				authority: 'www.iliad.it'
			},
			json: true,
			followAllRedirects: true
		};
		request(options, function (error, response, body) {
			if (!error) {
				const $ = cheerio.load(body);
				if ("" + $('div.table-details') + ""){
					var type = ['div.voix.preheader', 'div.renvoi-dappel.preheader', 'div.sms.preheader', 'div.data.preheader'];
					var name = ['call', 'call_forwarding', 'sms', 'data'];
					var data = {};
					var table = [];
					$('div.table-details')
						.each(function (index, element) {
							table = table.concat([$(element).find('div.line.local').text()]);
						});
					for (var x = 0; x < type.length; x++) {
						if (table[x]) {
							data[x] = table[x].replace(/^\s+|\s+$/gm, '').split('\n');
						} else {
							data[x] = undefined;
						}
					}
					if ($('div.no-conso').attr('style') == 'display:none;') {
						for (var z = 0; z < 4; z++) {
							if (data[z]){
								data_store["data"][name[z]] = {};
							}
							try{
								for (var x = 0; x < data[z].length / 8; x++){
									data_store["data"][name[z]][x] = {};
									data_store["data"][name[z]][x]["country"] = data[z][0].split(': ')[1];
									data_store["data"][name[z]][x]["type"] = data[z][1].split(':')[1];
									data_store["data"][name[z]][x]["number"] = data[z][3];
									data_store["data"][name[z]][x]["date"] = data[z][4].split(': ')[1];
									data_store["data"][name[z]][x]["volume"] = data[z][6];
									data_store["data"][name[z]][x]["price"] = data[z][7].split(': ')[1];
								}
							} catch (e) { }
						}
					} else {
						data_store["data"][0] = $('div.no-conso').text();
					}
					data_store["status"] = "success";
					res.status(200).send(data_store);
				} else {
					data_store = { "error": "Invalid token", 'status': "error"};
					res.status(400).send(data_store);
				}
			} else {
				data_store = { "error": error, 'status': "error"};	
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};
		res.status(400).send(data_store);
	}
})
app.get('/services/get', function (req, res) {
	res.type('json'); // set Content-Type response

	var token = req.query.token;

	var data_store = { 'data': {}, 'status': ''};

	if (token) {
		var options = {
			url: ILIAD_BASE_URL + ILIAD_OPTION_URL['services'],
			method: 'GET',
			headers: {
				'cookie': 'ACCOUNT_SESSID=' + token //cookie di accesso
			}
		};
		request(options, function (error, response, body) {
			if (!error) {
				try {
					const $ = cheerio.load(body);
					var results = $('body');
					var status = [];
					var array3 = [];
					var query = [];
					results.each(function (i, result) {
						$(result).find("div.current-user").first().text().split("\n")[2].replace(/^\s+|\s+$/gm, "").split(": ")[1]; // if logged in
						$(result)
							.find('div.as__status--active')
							.each(function (index, element) {
								status = status.concat([$(element).find('i').attr('class')]);
							});
						$(result)
							.find('div.grid-l.as__item')
							.find('div.grid-c.w-2.w-desktop-2.w-tablet-4.as__cell.as__status')
							.each(function (index, element) {
								if ($(element).find('a').attr('href')) {
									query = query.concat([$(element).find('a').attr('href').split('=')[1].split('&')[0]]);
								}

							});
						$(result)
							.find('div.bold')
							.each(function (index, element) {
								array3 = array3.concat([$(element).find('a').text()]);
							});

						var option = {};
						var num = query.length;
						var name = ["service", "active", "to_active"];

						for (var x = 0; x <= num; x++) {
							option[x] = [];
						}
						for (var x = 0; x < num; x++) {
							data_store["data"][x] = {};
						}

						for (var x = 0; x < Object.keys(option).length - 1; x++) {
							option[x][0] = array3[x + 4].split('\n')[2].replace(/^\s+|\s+$/gm, '');
							if (status[x] == 'icon i-check') {
								option[x][1] = true;
							} else {
								option[x][1] = false;
							}
							option[x][2] = query[x];
						}
						for (var x = 0; x <= num; x++) {
							for (var y = 0; y < option[x].length; y++) {
								data_store["data"][x][name[y]] = option[x][y];
							}
						}
						data_store["status"] = "success";
						res.status(200).send(data_store);
					});
				} catch (e) {
					data_store = { "error": "Invalid token", 'status': "error"};
					res.status(400).send(data_store);
				}
			} else{
				data_store = { "error": error, 'status': "error"};	
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};	
		res.status(400).send(data_store);
	}
});
app.get('/services/action', function (req, res) {
	res.type('json'); // set Content-Type response
	var update = req.query.update;
	var activate = req.query.activate;
	var token = req.query.token;
	var data_store = { 'data': {}, 'status': ''};
	if (activate && update && token) {
		var options = {
			url: ILIAD_BASE_URL + ILIAD_OPTION_URL['services'] + '?update=' + update + '&activate=' + activate,
			method: 'GET',
			headers: {
				'cookie': 'ACCOUNT_SESSID=' + token //cookie di accesso
			},
			followAllRedirects: true
		};
		request(options, function (error, response, body) {
			if (!error) {
				try {
					const $ = cheerio.load(body);
					var results = $('body');
					results.each(function (i, result) {
						$(result).find("div.current-user").first().text().split("\n")[2].replace(/^\s+|\s+$/gm, "").split(": ")[1]; // if logged in
						data_store['data']["message"] = $(result).find("div.flash").first().text().replace(/^\s+|\s+$/gm, "").split("\n")[0];
						data_store["status"] = "success";
						res.status(200).send(data_store);
					});
				} catch (e) {
					data_store = { "error": "Invalid token", 'status': "error"};
					res.status(400).send(data_store);
				}
			} else {
				data_store = { "error": error, 'status': "error"};
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};	
		res.status(400).send(data_store);
	}
});
app.get('/options/get', function (req, res) {
	res.type('json'); // set Content-Type response
	var data_store = { 'data': {}, 'status': ''};
	var token = req.query.token;
	if (token) {
		var options = {
			url: ILIAD_BASE_URL + ILIAD_OPTION_URL['options'],
			method: 'GET',
			headers: {
				'cookie': 'ACCOUNT_SESSID=' + token //cookie di accesso
			}
		};
		request(options, function (error, response, body) {
			if (!error) {
				try {
					const $ = cheerio.load(body);
					var results = $('body');
					var status = [];
					var text = [];
					var array3 = [];
					var query = [];
					results.each(function (i, result) {
						$(result).find("div.current-user").first().text().split("\n")[2].replace(/^\s+|\s+$/gm, "").split(": ")[1]; // if logged in
						$(result)
							.find('div.as__status--active')
							.each(function (index, element) {
								text = text.concat([$(element).find('span.as__status__text').text()]);
								status = status.concat([$(element).find('i').attr('class')]);
							});
						$(result)
							.find('div.as__item')
							.each(function (index, element) {
								if (element == $(element).find('div.as__status--active')) {} else {
									query = query.concat([$(element).find('a').attr('href').split('/')[3]]);
								}
							});
						$(result)
							.find('div.bold')
							.each(function (index, element) {
								array3 = array3.concat([$(element).find('a').text()]);
							});

						var option = {};
						var num = query.length;
						var name = ["service", "active", "to_active"];

						for (var x = 0; x <= num; x++) {
							option[x] = [];
						}
						for (var x = 0; x < num; x++) {
							data_store["data"][x] = {};
						}
						for (var x = 0; x < Object.keys(option).length - 1; x++) {
							option[x][0] = array3[x + 4].split('\n')[2].replace(/^\s+|\s+$/gm, '');
							if (status[x] == 'icon i-check') {
								option[x][1] = true;
							} else {
								option[x][1] = false;
							}
							option[x][2] = query[x];
						}
						for (var x = 0; x <= num; x++) {
							for (var y = 0; y < option[x].length; y++) {
								data_store["data"][x][name[y]] = option[x][y];
							}
						}
						data_store["status"] = "success";
						res.status(200).send(data_store);
					});
				} catch (e) {
					data_store = { "error": "Invalid token", 'status': "error"};
					res.status(400).send(data_store);
				}
			} else {
				data_store = { "error": error, 'status': "error"};	
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};	
		res.status(400).send(data_store);
	}
});
app.get('/options/action', function (req, res) {
	res.type('json'); // set Content-Type response
	var update = req.query.update;
	var activate = req.query.activate;
	var token = req.query.token;
	var data_store = { 'data': {}, 'status': ''};

	if (activate && update && token) {
		var options = {
			url: ILIAD_BASE_URL + ILIAD_OPTION_URL['options'] + '?update=' + update + '&activate=' + activate,
			method: 'GET',
			headers: {
				'cookie': 'ACCOUNT_SESSID=' + token //cookie di accesso
			},
			followAllRedirects: true
		};
		request(options, function (error, response, body) {
			if (!error) {
				try {
					const $ = cheerio.load(body);
					var results = $('body');
					results.each(function (i, result) {
						$(result).find("div.current-user").first().text().split("\n")[2].replace(/^\s+|\s+$/gm, "").split(": ")[1]; // if logged in
						data_store['data']["message"] = $(result).find("div.flash").first().text().replace(/^\s+|\s+$/gm, "").split("\n")[0];
						data_store["status"] = "success";
						res.status(200).send(data_store);
					});
				} catch (e) {
					data_store = { "error": "Invalid token", 'status': "error"};
					res.status(400).send(data_store);
				}
			} else {
				data_store = { "error": error, 'status': "error"};
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};	
		res.status(400).send(data_store);
	}
});
app.get('/document/get', function (req, res) {
	res.type('json'); // set Content-Type response
	var token = req.query.token;
	var data_store = { "data": {}, "status": ""};
	if (token) {
		var options = {
			url: ILIAD_BASE_URL + ILIAD_OPTION_URL['document'],
			method: 'POST',
			headers: {
				'cookie': 'ACCOUNT_SESSID=' + token //cookie di accesso
			},
		};
		request(options, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				try {
					const $ = cheerio.load(body);
					var results = $('body');
					var array = [];
					var array2 = [];
					results.each(function (i, result) {
						$(result).find("div.current-user").first().text().split("\n")[2].replace(/^\s+|\s+$/gm, "").split(": ")[1]; // if logged in
						$(result)
							.find('div.conso__content')
							.each(function (index, element) {
								array = array.concat([$(element).find('div.conso__text').text()]);
								array2 = array2.concat([$(element).find('div.conso__text').find('a').attr('href')]);
							});
						for (var x = 0; x < array.length; x++) {
							data_store["data"][x] = {};
							data_store["data"][x]["description"] = array[x].split('\n')[1].replace(/^\s+|\s+$/gm, '') + " " +array[x].split('\n')[2].replace(/^\s+|\s+$/gm, ''); //condition text
							data_store["data"][x]["link"] = 'https://www.iliad.it' + array2[x]; // condition doc
						}
						data_store["status"] = "success";
						res.status(200).send(data_store);
					});
				} catch (e) {
					data_store = { "error": "Invalid token", 'status': "error"};
					res.status(400).send(data_store);
				}
			} else {
				data_store = { "error": error, 'status': "error"};
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};	
		res.status(400).send(data_store);
	}
});
app.get('/recharge/get', function (req, res) {
	res.type('json'); // set Content-Type response
	var token = req.query.token;
	var data_store = { 'data': {}, 'status': ''};
	if (token) {
		var options = {
			url: ILIAD_BASE_URL + ILIAD_OPTION_URL['recharge'],
			method: 'GET',
			headers: {
				'cookie': 'ACCOUNT_SESSID=' + token // access cookie
			}
		};
		request(options, function (error, response, body) {
			if (!error) {
				try {
					const $ = cheerio.load(body);
					var results = $('body');
					results.each(function (i, result) {
						$(result).find("div.current-user").first().text().split("\n")[2].replace(/^\s+|\s+$/gm, "").split(": ")[1]; // if logged in
						var data = $(result).find("div.table-rechargements").first().text().replace(/^\s+|\s+$/gm, "").split('\n');
						data.splice(0, 4);
						var loop = data.length / 6;
						for (var x = 0; x < loop; x++){
							data_store["data"][x] = {};
							data_store["data"][x]["import"] = data[0].split(': ')[1];
							data_store["data"][x]["method"] = data[2];
							data_store["data"][x]["date"] = data[3].split(': ')[1];
							data.splice(0, 6);
						}
						data_store["status"] = "success";
						res.status(200).send(data_store);
					});
				} catch (e) {
					data_store = { "error": "Invalid token", 'status': "error"};
					res.status(400).send(data_store);
				}
			} else {
				data_store = { "error": error, 'status': "error"};
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};
		res.status(400).send(data_store);
	}
});
app.get('/recharge/action', function (req, res){
	res.type('json'); // set Content-Type response

	var cbtype = req.query.cbtype;
	var cbnumero = req.query.cbnumero;
	var montant = req.query.montant;
	var cbexpmois = req.query.cbexpmois;
	var cbexpannee = req.query.cbexpannee;
	var cbcrypto = req.query.cbcrypto;
	var token = req.query.token;

	var data_store = { 'data': {}, 'status': ''};

	if (montant && cbtype && cbnumero && cbexpmois && cbexpannee && cbcrypto && token) {
		var formData = {
			'cb-type': cbtype,
			'cb-numero': cbnumero,
			'cb-exp-mois': cbexpmois,
			'cb-exp-annee': cbexpannee,
			'cb-crypto': cbcrypto
		}
		var options = {
			url: ILIAD_BASE_URL + ILIAD_OPTION_URL['recharge'] + '?montant=' + montant,
			method: 'POST',
			headers: {
				'cookie': 'ACCOUNT_SESSID=' + token // access cookie
			},
			formData: formData
		};
		request(options, function (error, response, body) {
			data_store["data"][0] = {}
			if (!error) {
				try {
					const $ = cheerio.load(body);
					var results = $('body');
					results.each(function (i, result) {
						$(result).find("div.current-user").first().text().split("\n")[2].replace(/^\s+|\s+$/gm, "").split(": ")[1]; // if logged in
						data_store["data"]["message"] = $(result).find("div.flash").first().text().replace(/^\s+|\s+$/gm, "").split("\n")[0];
						data_store["status"] = "success";
						res.status(200).send(data_store);
					})
				} catch (e) {
					data_store = { "error": "Invalid token", 'status': "error"};
					res.status(400).send(data_store);
				}
			} else {
				data_store = { "error": error, 'status': "error"};
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};
		res.status(400).send(data_store);
	}
});
app.get('/voicemail/get', function (req, res) {
	res.type('json'); // set Content-Type response
	var token = req.query.token;
	var data_store = { 'data': {}, 'status': ''};
	if (token) {
		var options = {
			url: ILIAD_BASE_URL + ILIAD_OPTION_URL['voicemail'],
			method: 'GET',
			headers: {
				'cookie': 'ACCOUNT_SESSID=' + token // access cookie
			}
		};
		request(options, function (error, response, body) {
			if (!error) {
				try {
					const $ = cheerio.load(body);
					var results = $('body');
					results.each(function (i, result) {
						$(result).find("div.current-user").first().text().split("\n")[2].replace(/^\s+|\s+$/gm, "").split(": ")[1]; // if logged in
						if ($(result).find('p.text-center').text().replace(/^\s+|\s+$/gm, '') == '') {
							$(result)
								.find('div.msg')
								.each(function (index, element) {
									data_store["data"][index] = {}
									data_store["data"][index]["number"] = $(element).find('div.msg__details__tel').text().replace(/^\s+|\s+$/gm, '');
									data_store["data"][index]["date"] = $(element).find('div.msg__details__date').text().replace(/^\s+|\s+$/gm, '');
									data_store["data"][index]["idaudio"] = $(element).find('source').attr('src').split('=')[1];
									//data_store["data"][index][2] = 'https://www.iliad.it' + $(element).find('source').attr('src');
								})
						} else {
							data_store["data"][0] = $(result).find('p.text-center').text().replace(/^\s+|\s+$/gm, '')
						}
						data_store["status"] = "success";
						res.status(200).send(data_store);
					})
				} catch (e) {
					data_store = { "error": "Invalid token", 'status': "error"};
					res.status(400).send(data_store);
				}
			} else {
				data_store = { "error": error, 'status': "error"};
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};
		res.status(400).send(data_store);
	}
});
app.get('/voicemail/get_audio', function (req, res) {
	var token = req.query.token;
	var idaudio = req.query.idaudio;

	var data_store = { 'data': {}, 'status': ''};
	if (idaudio && token) {
		// Richiesta singolo messaggio (per id) da segreteria
		var options = {
			url: ILIAD_BASE_URL + ILIAD_OPTION_URL['voicemail'] + '/messaggio_vocale?id=' + idaudio,
			method: 'GET',
			headers: {
				'cookie': 'ACCOUNT_SESSID=' + token // access cookie
			},
			encoding: null
		};
		request(options, function (error, response, body) {
			if (!error) {
				try {
					res.send(body);
					// data_store["status"] = "success";
					// res.status(200).send(data_store);
				} catch (e) {
					data_store = { "error": "Invalid token", 'status': "error"};
					res.status(400).send(data_store);
				}
			} else {
				data_store = { "error": error, 'status': "error"};
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};
		res.status(400).send(data_store);
	}
});
app.get('/voicemail/delete_audio', function (req, res) {
	res.type('json'); // set Content-Type response
	var token = req.query.token;
	var idaudio = req.query.idaudio;

	var data_store = { 'data': {}, 'status': ''};

	if (idaudio && token) {
		// Eliminazione messaggio in segreteria
		var options = {
			url: ILIAD_BASE_URL + ILIAD_OPTION_URL['voicemail'] + '/messaggio_vocale?id=' + idaudio + '&action=delete',
			method: 'GET',
			headers: {
				'Cache-Control': 'no-cache',
				'x-requested-with': 'XMLHttpRequest',
				cookie: 'ACCOUNT_SESSID=' + token,
				'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7,pt;q=0.6',
				accept: 'application/json, text/javascript, */*; q=0.01',
				scheme: 'https',
				method: 'GET',
				authority: 'www.iliad.it'
			},
			json: true
		};
		request(options, function (error, response, body) {
			if (!error) {
				try {
					data_store["data"][0] = body[0]["result"]["success"];
					data_store["data"][1] = body[0]["result"]["msg"];
					data_store["status"] = "success";
					res.status(200).send(data_store);
				} catch (e) {
					data_store = { "error": "Invalid token", 'status': "error"};
					res.status(400).send(data_store);
				}
			} else {
				data_store = { "error": error, 'status': "error"};
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};
		res.status(400).send(data_store);
	}
});
app.get('/voicemail/report', function (req, res) {
	res.type('json'); // set Content-Type response
	var token = req.query.token;
	var data_store = { 'data': {}, 'status': ''};
	if (token) {
		var options = {
			url: ILIAD_BASE_URL + ILIAD_OPTION_URL['voicemail'],
			method: 'GET',
			headers: {
				'cookie': 'ACCOUNT_SESSID=' + token // access cookie
			}
		};
		request(options, function (error, response, body) {
			if (!error) {
				try {
					const $ = cheerio.load(body);
					var results = $('body');
					results.each(function (i, result) {
						$(result).find("div.current-user").first().text().split("\n")[2].replace(/^\s+|\s+$/gm, "").split(": ")[1]; // if logged in
						$(results)
							.find('div.notifs__list')
							.find('div.notifs__item')
							.each(function (index, element) {
								index = index;
								data_store['data'][index] = {};
								data_store['data'][index]["email"] = $(element).find('input.mdc-text-field__input').attr('value').replace(/^\s+|\s+$/gm, '');
								$(element).find('select.mdc-select__input').find('option').each(function (index2, element) {
									if ($(element).attr('selected') == 'selected')
										data_store['data'][index]["report"] = $(element).text().replace(/^\s+|\s+$/gm, '');
								})
							})
						data_store["status"] = "success";
						res.status(200).send(data_store);
					})
				} catch (e) {
					console.log(e)
					data_store = { "error": "Invalid token", 'status': "error"};
					res.status(400).send(data_store);
				}
			} else {
				data_store = { "error": error, 'status': "error"};
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};
		res.status(400).send(data_store);
	}
});
app.get('/voicemail/action_report', function (req, res) {
	res.type('json'); // set Content-Type response
	var token = req.query.token;
	var email = req.query.email;
	var action = req.query.action;
	var type = req.query.type;
	var data_store = { 'data': {}, 'status': ''};

	var headers = {
		'cookie': 'ACCOUNT_SESSID=' + token //cookie di accesso
	};
	if (email && action || action == "add" && type && token) {
		//richiesta per aggiungere/eliminare le mail per la notifica della segreteria  
		var url = ILIAD_BASE_URL + ILIAD_OPTION_URL['voicemail'] + '/notifiche?email=' + email + '&action=' + action;
		if (type) {
			url += '&type=' + type;
		}
		var options = {
			url: url,
			method: 'GET',
			headers: {
				'Cache-Control': 'no-cache',
				'x-requested-with': 'XMLHttpRequest',
				cookie: 'ACCOUNT_SESSID=' + token,
				'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7,pt;q=0.6',
				accept: 'application/json, text/javascript, */*; q=0.01',
				scheme: 'https',
				method: 'GET',
				authority: 'www.iliad.it'
			},
			json: true
		};
		request(options, function (error, response, body) {
			if (!error) {
				try {
					data_store['data']["message"] = body[0]['result']['msg'];
				} catch (e) {
					data_store['data']["message"] = body[0]['msg'];
				}
				if (data_store['data']["message"]) {
					data_store["status"] = "success";
					res.status(200).send(data_store);
				} else {
					data_store = { "error": "Invalid token", 'status': "error"};
					res.status(400).send(data_store);
				}
			} else {
				data_store = { "error": error, 'status': "error"};
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};
		res.status(400).send(data_store);
	}
});
app.get('/voicemail/options', function (req, res) {
	res.type('json'); // set Content-Type response
	var token = req.query.token;
	var data_store = { 'data': {}, 'status': ''};
	if (token) {
		var options = {
			url: ILIAD_BASE_URL + ILIAD_OPTION_URL['voicemail'],
			method: 'GET',
			headers: {
				'cookie': 'ACCOUNT_SESSID=' + token // access cookie
			}
		};
		request(options, function (error, response, body) {
			if (!error) {
				try {
					const $ = cheerio.load(body);
					var results = $('body');
					var status = [];
					var text = [];
					var array3 = [];
					results.each(function (i, result) {
						$(result).find("div.current-user").first().text().split("\n")[2].replace(/^\s+|\s+$/gm, "").split(": ")[1]; // if logged in
                        $(result)
                            .find('div.as__status--active')
                            .each(function (index, element) {
                                status = status.concat([$(element).find('i').attr('class')]);
                            });
                        $(result)
                            .find('div.as__item__name')
                            .each(function (index, element) {
                                array3 = array3.concat([$(element).find('div.inner').text().replace(/^\s+|\s+$/gm, '')]);
                            });

						for (var x = 0; x < status.length; x++) {
							data_store["data"][x] = {};
							data_store["data"][x]["option"] = array3[x];
							if (status[x] == 'icon i-check red') {
								data_store["data"][x]["active"] = true;
							} else {
								data_store["data"][x]["active"] = false;
							}
							data_store["data"][x]["to_active"] = x.toString();
						}
						data_store["status"] = "success";
						res.status(200).send(data_store);
					});
				} catch (e) {
					console.log(e)
					data_store = { "error": "Invalid token", 'status': "error"};
					res.status(400).send(data_store);
				}
			} else {
				data_store = { "error": error, 'status': "error"};
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};
		res.status(400).send(data_store);
	}
});
app.get('/voicemail/change_options', function (req, res) {
	res.type('json'); // set Content-Type response
	var activate = req.query.activate;
	var update = req.query.update;
	var codemessagerie = req.query.codemessagerie;
	var announce = req.query.announce;
	var token = req.query.token;
	var data_store = { 'data': {}, 'status': ''};
	var headers = {
		'cookie': 'ACCOUNT_SESSID=' + token //cookie di accesso
	};
	if (codemessagerie && update && activate) {
		var options = {
			url: 'https://www.iliad.it /account/segreteria-telefonica',
			method: 'POST',
			headers: headers,
			formData: {
				update: update,
				activate: activate,
				'code-messagerie': codemessagerie
			},
			followAllRedirects: true
		};
	} else if (announce && update && activate) {
		var options = {
			url: 'https://www.iliad.it /account/segreteria-telefonica',
			method: 'POST',
			headers: headers,
			formData: {
				update: update,
				activate: activate,
				announce: announce
			},
			followAllRedirects: true
		};
	} else if (update && activate) {
		var options = {
			url: 'https://www.iliad.it/account/segreteria-telefonica?update=' + update + '&activate=' + activate,
			method: 'GET',
			headers: headers,
			followAllRedirects: true
		};
	}
	if (token && options) {
		request(options, function (error, response, body) {
			if (!error) {
				try {
					const $ = cheerio.load(body);
					var results = $('body');
					results.each(function (i, result) {
						$(result).find("div.current-user").first().text().split("\n")[2].replace(/^\s+|\s+$/gm, "").split(": ")[1]; // if logged in
						data_store["data"]["message"] = $(result).find("div.flash").first().text().replace(/^\s+|\s+$/gm, "").split("\n")[0];
						data_store["status"] = "success";
						res.status(200).send(data_store);
					})
				} catch (e) {
					data_store = { "error": "Invalid token", 'status': "error"};
					res.status(400).send(data_store);
				}
			} else {
				data_store = { "error": error, 'status': "error"};
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", 'status': "error"};
		res.status(400).send(data_store);
	}
});
// Iliad Store
app.get('/store', function (req, res) {
    res.type('json'); // set Content-Type response
	var search = req.query.search;
	var data_store = { 'data': {}, 'status': ''};
	var options = {
        url: "https://www.iliad.it/assets/store-locator/borne_interactive.json",
        json: true
	};
	if (search){
		request(options, function (error, response, body) {
			if (!error){
				var index = 0;
				body.forEach(element => {
					if (search.toLowerCase() == element['localite'].toLowerCase() || search == element['cp']){
						data_store["data"][index] = {};
						data_store["data"][index]["address"] = element["adresse"].split("\n").join(" ");
						data_store["data"][index]["id"] = element["id_enseigne"].split("\n").join(" ");
						data_store["data"][index]["type"] = element["enseigne_label"].split("\n").join(" ");
						data_store["data"][index]["cap"] = element["cp"].split("\n").join(" ");
						data_store["data"][index]["latitude"] = element["latitude"].split("\n").join(" ");
						data_store["data"][index]["longitude"] = element["longitude"].split("\n").join(" ");
						data_store["data"][index]["city"] = element["localite"].split("\n").join(" ");
						data_store["data"][index]["schedule"] = element["horaire"];
						index++;
					}
				});
				data_store["status"] = "success";
				res.status(200).send(data_store);
			} else {
				data_store = { "error": error, 'status': "error"};
				res.status(500).send(data_store);
			}
		});
	} else {
		data_store = { "error": "Params cannot be undefined", "status": "error"};
		res.status(400).send(data_store);
	} 
});
const server = app.listen(process.env.PORT || 1331, function () {});
