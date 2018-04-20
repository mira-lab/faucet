const
    bitcore = require('bitcore-lib'),
    UnirestService = require('./UnirestService');


async function getExistsTransaction(criteria) {
    let result = await Transaction.find(criteria).limit(1);
    return new Promise( (resolve) => resolve(result));
}

/**
 * Store transaction to DB
 */
async function storeTransaction(currencyType, faucetBtcAddress, faucetBtcPrivKey, txs, vout) {
    var initialValues = {
        "inputHash": txs.txid,
        "output": vout.n,
        "inputSum": bitcore.Unit.fromBTC(vout.value).toSatoshis(),
        "scriptPubKey": vout.scriptPubKey.hex,
        "outputAddress": faucetBtcAddress,  //vout.scriptPubKey.addresses[0]
        "privateKey": faucetBtcPrivKey,
        "currencyType": currencyType,
        "spent": false
    };
    let result = await Transaction.create(initialValues);
    return new Promise( (resolve) => resolve(result));
}


module.exports = {

    constructor: function(currencyType, apiUrl, port, faucetBtcAddress, faucetBtcPrivKey) {
        this.faucetBtcAddress = faucetBtcAddress;
        this.faucetBtcPrivKey = faucetBtcPrivKey;
        this.currencyType = currencyType;

        UnirestService.constructor(apiUrl, port);
    },

    getBlockchainTxAndStore: getBlockchainTxAndStore,

    /**
     * Check all list of txs & create record if not listed in BD
     * @param transactionList
     * @param faucetBtcAddress
     * @param faucetPrivKey
     * @return {Array}
     */
    checkCreateTxs: async function(transactionList) {
        let txs = [];
        try {
            for (const hashTx of transactionList) {
                let createdId = await getBlockchainTxAndStore(hashTx, this.faucetBtcAddress);
                txs = txs.concat(createdId);
            }
        } catch(error) {
            sails.log.error(error);
        }
        return new Promise( (resolve) => resolve(txs));
    },


    getExistsTransaction: getExistsTransaction,

    checkCreateTxRecord: async function(transaction, vout) {
        let findTx = await getExistsTransaction({inputHash: transaction.txid});
        let stored = !findTx.length
            ? (await storeTransaction(this.currencyType, this.faucetBtcAddress, this.faucetBtcPrivKey, transaction, vout))
            : false;
        //sails.log.debug(stored);
        return new Promise( (resolve) => resolve(stored));
    },

    getBalance: function(address) {
        return UnirestService.executeRequest(address);
    },
    getTransactions: function(address) {
        return UnirestService.executeRequest(address, 'addr/', '/');
    },

    constructSignedTransaction: function(tx, address, amount) {
        //sails.log.debug(tx);
        let key = bitcore.PrivateKey.fromWIF(tx.privateKey),
            transaction = new bitcore.Transaction().from({
                "txid": tx.inputHash,
                "vout": tx.output,
                "address": tx.outputAddress,    //key.toAddress(bitcore.Networks.testnet).toString(),
                "scriptPubKey": tx.scriptPubKey,
                "satoshis": tx.inputSum     // "amount": bitcore.Unit.fromSatoshis(tx.inputSum).toBTC()
            });
        transaction.version = 2;
        transaction.change(this.faucetBtcAddress);
        transaction.to(address, amount);
        /// transaction.fee(5430);
        transaction.sign(key, bitcore.crypto.Signature.SIGHASH_ALL | bitcore.crypto.Signature.SIGHASH_FORKID);

        sails.log.debug('raw-tx is ', transaction.toString());

        return new Promise( (resolve) => resolve(transaction));
    },

    saveTxReceiver: function(txid, req) {
        Transaction.update({id: txid}, {
            'receiver': {
                "headers": req.headers,
                "remoteAddress": req.connection.remoteAddress,
                "remotePort": req.connection.remotePort
            }
        }).exec(function (err, tx_updated) {
            if (err) {
                sails.log.error(err);
            }
        });
    },

 /**
  * These 2 functions were taken from
  * https://github.com/bitpay/bitcore-wallet-service/blob/master/lib/model/txproposal.js#L243
  */
    // Note: found empirically based on all multisig P2SH inputs and within m & n allowed limits.
    'getEstimatedTxSize': function(nbOutputs) {
        let safetyMargin = 0.02,
            overhead = 4 + 4 + 9 + 9,
            inputSize = 147,  //P2PKH
            outputSize = 34,
            nbInputs = 1;            //Assume 1 input

        nbOutputs = nbOutputs || 2; // Assume 2 outputs
        let size = overhead + inputSize * nbInputs + outputSize * nbOutputs;
        return parseInt((size * (1 + safetyMargin)).toFixed(0));
    },

    // Approx utxo amount, from which the uxto is economically redeemable
    'getMinFee': function( nbOutputs) {
        let feePerKB = 100000, // https://github.com/phplaboratory/bitcore-wallet-service/blob/master/lib/common/defaults.js#L35
            lowLevelRate = (feePerKB / 1000).toFixed(0),
            size = getEstimatedTxSize( nbOutputs);
        return size * lowLevelRate;
    }
};

/**
 * Get Blockchain-Tx and Store to DB
 */
async function getBlockchainTxAndStore(hashTx, faucetBtcAddress) {
    let txs = [];
    let transaction = await UnirestService.executeRequest(hashTx, 'tx/', '/');

    for (const vout of transaction.vout) {
        if ((vout.value > 0.1) && (vout.scriptPubKey.addresses[0] === faucetBtcAddress) && (vout.spentTxId === null)) {
            let stored = await BtcService.checkCreateTxRecord(transaction, vout);
            if (stored) {
                sails.log.debug('store to DB txid = ' + hashTx + ' id= ' + stored.id);
                txs.push(stored.id);
            }
        }
    }
    return new Promise( (resolve) => resolve(txs));
}