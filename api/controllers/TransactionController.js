/**
 * TransactionController
 *
 * @description :: Server-side logic for managing transactions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var bitcore = require('bitcore-lib');
var request = require('request');

module.exports = {

  'info': function (req, res) {
      res.json({
        "headers": req.headers,
        "remoteAddress": req.connection.remoteAddress,
        "remotePort": req.connection.remotePort,
        "query": req.query,
        "protocol": req.protocol,
        "method": req.method,
        "user": req.user
      });
  },

  'upload': function (req, res) {
    var address = req.param("address");
    var amount = parseInt(req.param("amount")) || 0;
    // res.status(200);
    // return res.json({'txhash': '9fe744315aad2cb843c330e33621ea22d4db97116332f344d5707adce922c220'});




    if (!bitcore.Address.isValid(address, bitcore.Networks.testnet)) {
      res.status(403);
      return res.view('403', {'data': 'Invalid address'});
    }

    if (amount <= 0) {
      res.status(403);
      return res.view('403', {'data': 'Invalid amount'});
    }
    var updateQuery = Transaction.update({'spent': false, "total": amount}, {'spent': true});
    updateQuery.limit(1);
    updateQuery.exec(function(err, tx_updated) {
        // console.log(err,tx);
        if (err) {
          sails.log.error(err);
          res.status(500);
          return res.view('500');
        }
        if (!tx_updated) {
          sails.log.error("Wallet for some sum is empty" );
          res.status(404);
          //return res.view('404', {'data': 'Unspent transaction with amount not found.'});
          return res.view('404', {'data': 'No more test coins in my wallet, please refill it. Thanks.'});
        }
        var tx = tx_updated[0];
        var key = bitcore.PrivateKey.fromWIF(tx.privateKey);
        var transaction = new bitcore.Transaction()
          .from({
            "txid": tx.inputHash,
            "vout": tx.output,
            "address": key.toAddress(bitcore.Networks.testnet).toString(),
            "scriptPubKey": tx.scriptPubKey,
            "amount": bitcore.Unit.fromSatoshis(tx.inputSum).toBTC()
          });
        transaction.version = 2;
        transaction.to(address, tx.total);
        transaction.sign(key, bitcore.crypto.Signature.SIGHASH_ALL | bitcore.crypto.Signature.SIGHASH_FORKID);
        request(
          {
            url: 'https://test-insight.bitpay.com/api/tx/send',
            method: 'POST',
            headers: {
              'User-Agent': 'Super Agent/0.0.1',
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: {'rawtx': transaction.toString()}
          },
          function (err, response, body) {
            if (err) {
              sails.log.error(err);
              return;
            }
            if (response.statusCode == 200) {
              sails.log.debug(response.statusCode, body);
            } else {
              sails.log.warn(response.statusCode, body);
            }
          })

        Transaction.update({id: tx.id}, {
          'receiver': {
            "headers": req.headers,
            "remoteAddress": req.connection.remoteAddress,
            "remotePort": req.connection.remotePort
          }
        }).exec(function (err, tx_updated) {
          if (err) {
            sails.log.error(err);
            return;
          }
        });
        res.view('txsent', {
          'address': address,
          'amount': amount,
          'txhash': transaction.id.toString(),
          'rawtx': transaction.toString()
        });
    });

        return res.json(req.param('address'), 200);

  },


	'send': function (req, res) {
    if (req.method !== "POST" || !('body' in req)) {
      res.status(403);
      return res.view('403', {'data': 'Invalid request'});
    }
    RecaptchaService.check(req,function(errorCodes) {
      if (errorCodes) {
        var i;
        for (i = 0, len = errorCodes.length; i < len; i++) {
          if (errorCodes[i] === 'request-error' || errorCodes[i] === 'missing-input-secret' || errorCodes[i] === 'invalid-input-secret') {
            sails.log.error("Recaptcha error:", RecaptchaService.translateErrors(errorCodes));
            res.status(500);
            return res.view('500');
          }
        }
        sails.log.info("Recaptcha:", RecaptchaService.translateErrors(errorCodes));
        res.status(403);
        return res.view('403', {'data': "Invalid captcha"});
      }

      var address = req.param("address");
      if (!bitcore.Address.isValid(address, bitcore.Networks.testnet)) {
        res.status(403);
        return res.view('403', {'data': 'Invalid address'});
      }
      var amount = parseInt(req.param("amount")) || 0;
      if (amount <= 0) {
        res.status(403);
        return res.view('403', {'data': 'Invalid amount'});
      }
      var updateQuery = Transaction.update({'spent': false, "total": amount}, {'spent': true});
      updateQuery.limit(1);
      updateQuery.exec(function(err, tx_updated) {
        // console.log(err,tx);
        if (err) {
          sails.log.error(err);
          res.status(500);
          return res.view('500');
        }
        if (!tx_updated) {
          sails.log.error("Wallet for some sum is empty" );
          res.status(404);
          //return res.view('404', {'data': 'Unspent transaction with amount not found.'});
          return res.view('404', {'data': 'No more test coins in my wallet, please refill it. Thanks.'});
        }
        var tx = tx_updated[0];
        var key = bitcore.PrivateKey.fromWIF(tx.privateKey);
        var transaction = new bitcore.Transaction()
          .from({
            "txid": tx.inputHash,
            "vout": tx.output,
            "address": key.toAddress(bitcore.Networks.testnet).toString(),
            "scriptPubKey": tx.scriptPubKey,
            "amount": bitcore.Unit.fromSatoshis(tx.inputSum).toBTC()
          });
        transaction.version = 2;
        transaction.to(address, tx.total);
        transaction.sign(key, bitcore.crypto.Signature.SIGHASH_ALL | bitcore.crypto.Signature.SIGHASH_FORKID);
        request(
          {
            url: 'https://test-insight.bitpay.com/api/tx/send',
            method: 'POST',
            headers: {
              'User-Agent': 'Super Agent/0.0.1',
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: {'rawtx': transaction.toString()}
          },
          function (err, response, body) {
            if (err) {
              sails.log.error(err);
              return;
            }
            if (response.statusCode == 200) {
              sails.log.debug(response.statusCode, body);
            } else {
              sails.log.warn(response.statusCode, body);
            }
          })

        Transaction.update({id: tx.id}, {
          'receiver': {
            "headers": req.headers,
            "remoteAddress": req.connection.remoteAddress,
            "remotePort": req.connection.remotePort
          }
        }).exec(function (err, tx_updated) {
          if (err) {
            sails.log.error(err);
            return;
          }
        });
        res.view('txsent', {
          'address': address,
          'amount': amount,
          'txhash': transaction.id.toString(),
          'rawtx': transaction.toString()
        });
      });
    });
  }
};
