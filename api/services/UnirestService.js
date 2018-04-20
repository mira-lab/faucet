const
    unirest = require('unirest'),
    // baseApiUrl = 'insight.bitpay.com/api/',
    BtcNetwork = {
        Live: 'livenet',
        Test: 'testnet'  ///  https://test-insight.bitpay.com/api/addr/mrfPqS39QJCcwN5weDVGNfGuV5sSq2BSRw
    };


module.exports = {

    constructor: function(insightApi, port) {
        // this.workNet = workNet;
        this.insightApi = insightApi;
        this.port = port || 3001;
    },

    /**
     * executeRequest & getBalance & getTransactions
     * @param id
     * @param endpoint
     * @param subRequest
     * @return {Promise}
     */
    executeRequest: function(id, endpoint, subRequest) {
        endpoint = endpoint || 'addr/';
        subRequest = subRequest || '/balance';
        //let url = 'https://' + (this.workNet === BtcNetwork.Test ? 'test-' : '') + baseApiUrl + endpoint + id + subRequest;
        let apiUrl = this.insightApi;
        apiUrl = apiUrl.replace('{port}', this.port) + endpoint + id + subRequest;

        return new Promise(function (resolve) {
            unirest.get(apiUrl)
                .headers({'Content-Type': 'application/json'})
                // .field('parameter', 'value') // Form field
                //.attach('file', '/tmp/file') // Attachment
                .end((response) => resolve(response.body));
        });
    }
};