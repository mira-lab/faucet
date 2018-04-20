/**
 * Transaction.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    inputHash: {
      type: 'string',
      required: true
    },
    output: {
      type:'integer',
      required: true
    },
    inputSum: {
      type:'integer',
      required: true
    },
    scriptPubKey: {
      type:'string',
      required: true
    },
    outputAddress: {
      type: 'string',
      required: true
    },
    privateKey: {
      type: 'string',
      required: true

    },
    currencyType: {
        type: 'string',
        required: true

    },

    spent: {
      type: 'boolean',
      required: true

    },
    body: {
      type: 'text',
    },

    receiver: {
      type: 'json',
    },

  }
};

