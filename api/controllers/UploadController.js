/**
 * UploadController
 *
 * @description :: Server-side logic for managing uploads
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const
    bitcore = require('bitcore-lib'),
    request = require('request'),
    BtcService = require('../services/BtcService'),
    Web3 = require('web3');

const
    insightApi = 'http://127.0.0.1:{port}/insight-api/',  /// 104.154.27.106
    insightPort = 3001,
    BtcNetwork = {
        Live: 'livenet',
        Test: 'testnet'  ///  https://test-insight.bitpay.com/api/addr/mrfPqS39QJCcwN5weDVGNfGuV5sSq2BSRw
    };

const
    faucetBtcAddress = "mrfPqS39QJCcwN5weDVGNfGuV5sSq2BSRw",
    faucetBtcPrivKey = "cNccCYyDSfv69XGfJioMgH7h4rbZyiML4jmQk4XXveFLMCXxHB1Q";

const
    faucetBchAddress = "mh4g51aGmW74561Vw68zMP6Qorrq6TkJbw",
    faucetBchPrivKey = "8d4fb6be30dd9f2cc38dc3a9ba8ba318f4f7c3dfd554fe0366334a0402b6d806";

const
    faucetEthAddress = "0x4206f95Fc533483FAE4687b86c1d0A0088E3cD48",
    faucetEthPrivKey = "eff415edb6331f4f67bdb7f1ecc639da9bcc0550b100bb275c7b5b21ce3a7804";

const
    testBtcAddress = "mrx4Wbn27PPgDeUUwP4gzwKqvKf5E4awXi",
    testBtcprivKey = "cN5ARKYjUNtsiTWkkUrRt1hPjh77J9vSEAEroMWxX6dBBd5QciRu";


/**
 * @param res
 * @param message
 * @param httpCode
 * @return {*|JSON|Promise<any>}
 */
function apiError(res, message, httpCode) {
    return res.json(httpCode || 403, message);
}

async function synchroTxs() {
    sails.log.debug("No transaction stored, try to synchronize from blockchain");

    let data = await BtcService.getTransactions(faucetBtcAddress);
    if ((data.addrStr !== faucetBtcAddress) || !data.transactions.length) {
        sails.log.error("No transaction finded, was try to search", data.transactions);
        return 'Fail get faucet wallet transactions ';
    }

    let transactions = await BtcService.checkCreateTxs(data.transactions);
    if (!transactions.length) {
        sails.log.error("Wallet for some sum is empty" );
        return 'No more test coins in my wallet, please refill it. Thanks.';
    }

    let transaction = await BtcService.getExistsTransaction({id: transactions[0]});
    transaction = transaction.length ? transaction[0] : null;

    var updateQuery = Transaction.update({'spent': false, id: transactions[0]}, {'spent': true});
    updateQuery.limit(1);
    updateQuery.exec(function(err, tx_updated) {
        if (err) {
            sails.log.error(err);
        }
    });

    return new Promise( (resolve) => resolve(transaction));
}

function simpleUpdated(tx_updated) {
    return new Promise( (resolve) => resolve(tx_updated));
}


module.exports = {

    'generate': function (req, res) {
        const bch = require('bitcoincashjs');

        const value = new Buffer('Bitcoin Cash - Peer-to-Peer 345gdfgh');
        const hash = bch.crypto.Hash.sha256(value);
        const bn = bch.crypto.BN.fromBuffer(hash);
        const PrivateKey = new bch.PrivateKey(bn, 'testnet');
        const address = PrivateKey.toAddress();

        // console.log(address.toString()) // 126tFHmNHNAXDYT1QeEBEwBbEojib1VZyg

        //#eth addr mh4g51aGmW74561Vw68zMP6Qorrq6TkJbw
        //#key 8d4fb6be30dd9f2cc38dc3a9ba8ba318f4f7c3dfd554fe0366334a0402b6d806

        res.json({
            'status': 'bch-generate-OK',
            'address': address.toString(),
            'private-key': PrivateKey
        });
    },

    // 'tbtc': function (req, res) {
    //     if (req.method !== "POST" || !('body' in req)) {
    //         return apiError('Invalid request');
    //     }
    //
    //     var address = req.param("address"),
    //         amount = parseInt(req.param("amount")) || 0;
    //
    //     if (!bitcore.Address.isValid(address, bitcore.Networks.testnet)) {
    //         return apiError('Invalid address');
    //     }
    //     if (amount <= 0) {
    //         return apiError('Invalid amount');
    //     }
    //     // let txs1 = [];
    //     // txs1.push("1234455678990");
    //     // sails.log.warn(txs1);
    //
    //     getBalance(faucetBtcAddress).then(function(balance) {
    //         if (amount > balance) {
    //             return apiError('No more test coins in my wallet, please wait until refill it. Thanks.');
    //         } else {
    //             var updateQuery = Transaction.update({'spent': false, "total": amount}, {'spent': true})
    //             updateQuery.limit(1)
    //             updateQuery.exec(function(err, tx_updated) {
    //                 if (err) {
    //                     sails.log.error(err);
    //                     return apiError('Internal error', 500);
    //                 }
    //
    //                 if (!tx_updated.length) {
    //                     sails.log.debug("No transaction stored, try to search this one" );
    //
    //                     ///synchroTxs(faucetBtcAddress);
    //
    //                     getTransactions(faucetBtcAddress).then(function(data) {
    //                         if ((data.addrStr != faucetBtcAddress) || !data.transactions.length) {
    //                             sails.log.error("No transaction finded, was try to search" );
    //                             return apiError('Fail get faucet wallet transactions ');
    //                         }
    //
    //                         checkCreateTxs(data.transactions).then(function(transactions) {
    //                             if (!transactions.length) {
    //                                 sails.log.error("Wallet for some sum is empty" );
    //                                 return apiError('No more test coins in my wallet, please refill it. Thanks.', 400);
    //                             }
    //
    //                             sails.log.debug(transactions);
    //                         },
    //                         function (err) {
    //                             console.log(err);
    //                             return apiError('Get faucet wallet transactions error');
    //                         });
    //
    //                     },
    //                     function (err) {
    //                         console.log(err);
    //                         return apiError('Get faucet wallet transactions error');
    //                     });
    //
    //
    //                 } else {
    //                     sails.log.error(tx_updated);
    //                 }
    //
    //                 res.json({
    //                     "headers": req.headers,
    //                     "remoteAddress": req.connection.remoteAddress,
    //                     "remotePort": req.connection.remotePort,
    //                     "query": req.query,
    //                     "protocol": req.protocol,
    //                     "method": req.method,
    //                     "user": req.user,
    //                     "address": address,
    //                     "balance": '' + balance
    //                 });
    //             });
    //         }
    //     },
    //     function (err) {
    //         console.log(err);
    //         return apiError('Get faucet wallet balance error');
    //     });
    // },

    'tbtc': function (req, res) {
        if (req.method !== "POST" || !('body' in req)) {
            return apiError('Invalid request');
        }

        var address = req.param("address"),
            amount = parseInt(req.param("amount")) || 0;

        if (!bitcore.Address.isValid(address, bitcore.Networks.testnet)) {
            return apiError(res, 'Invalid address');
        }
        if (amount <= 0) {
            return apiError(res, 'Invalid amount');
        }

        BtcService.constructor('tbtc', insightApi, insightPort, faucetBtcAddress, faucetBtcPrivKey);

        BtcService.getBalance(faucetBtcAddress).then(function(balance) {
            if (amount > balance) {
                return apiError(res, 'No more test coins in my wallet, please wait until refill it. Thanks.');
            } else {
                var updateQuery = Transaction.update({"spent": false, "currencyType": "tbtc"}, {"spent": true})
                updateQuery.limit(1);
                updateQuery.exec(function(err, tx_updated) {
                    if (err) {
                        sails.log.error(err);
                        return apiError(res, 'Internal error', 500);
                    }

                    let updated = !tx_updated.length ? synchroTxs() : simpleUpdated(tx_updated[0]);

                    updated.then(function (tx) {
                        if (typeof tx !== 'object') {
                            sails.log.error(tx_updated);
                            return apiError(tx_updated);
                        }

                        sails.log.debug("will spend transaction", tx);

                        BtcService.constructSignedTransaction(tx, address, amount).then(function (transaction) {
                            request({
                                url: insightApi.replace('{port}', insightPort) + 'tx/send',
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
                                if (response.statusCode === 200 || response.statusCode === 201) {
                                    sails.log.debug(response.statusCode, body);

                                    BtcService.saveTxReceiver(tx.id, req);

                                    let data = JSON.parse(body);
                                    sails.log.debug('new (change) txid = ' + data.txid);

                                    res.json({
                                        'status': 'tx-sent-OK',
                                        'address': address,
                                        'amount': amount,
                                        'txId': data.txid
                                    });

                                    setTimeout( function() {
                                            BtcService.getBlockchainTxAndStore(data.txid, faucetBtcAddress).then( function(createdId) {
                                                sails.log.debug('Created new tx with id= ' + createdId);
                                            })
                                        },
                                        2000
                                    );

                                } else {
                                    sails.log.warn("Transaction don't send! ", response.statusCode, body);
                                }

                            });
                        });
                    });
                });
            }
        });
    },

    'mira': function (req, res) {
        if (req.method !== "POST" || !('body' in req)) {
            return apiError('Invalid request');
        }

        var address = req.param("address"),
            amount = parseInt(req.param("amount")) || 0;

        // if (!bitcore.Address.isValid(address, bitcore.Networks.testnet)) {
        //     return apiError(res, 'Invalid address');
        // }
        if (amount <= 0) {
            return apiError(res, 'Invalid amount');
        }

        let web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

        web3.eth.getBalance(faucetEthAddress).then(function(balance) {  // balance = Wei
            if (amount > balance) {
                return apiError(res, 'No more test coins in my wallet, please wait until refill it. Thanks.');
            } else {
                // faucetEthAddress = "0x4206f95Fc533483FAE4687b86c1d0A0088E3cD48",
                // faucetEthPrivKey

                let ethAddr = "0x38217e5C965C5276c42225Aa5739a4438f9b3eF6";
                //#key 8d4fb6be30dd9f2cc38dc3a9ba8ba318f4f7c3dfd554fe0366334a0402b6d806
                // web3.eth.sendTransaction({
                //     from: '0x' + faucetEthAddress.replace('0x', ''),
                //     to: address.replace('0x', ''),
                //     value: amount
                // }).then( function(transaction) {
                //     sails.log.warn(transaction);
                // },
                // function (err) {
                //     console.log(err)
                // });

                web3.eth.personal.unlockAccount(faucetEthAddress, "kristina19092009").then( function (receipt) {
                    web3.eth.signTransaction({
                        from: '0x' + faucetEthAddress.replace('0x', ''),
                        to: '0x' + address.replace('0x', ''),
                        value: amount
                    })
                    .then( function(transaction) {

                            sails.log.warn(transaction.raw);

                            web3.eth.sendSignedTransaction(transaction.raw).then(function(response) {
                                sails.log.debug('Created new eth - tx  ', response);


                                res.json({
                                    'status': 'mira-send-OK',
                                    'address': faucetEthAddress,
                                    'balance': web3.utils.fromWei(balance)
                                });
                            });
                        },
                        function (err) {
                            console.log(err)
                        });
                },
                function (err) {
                    console.log(err)
                });




            }
        });
    }

};

