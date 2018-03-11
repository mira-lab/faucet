/**
 * Created by taras on 8/11/17.
 */

var reCAPTCHA=require('recaptcha2')

var recaptcha=new reCAPTCHA({
  siteKey:'6LfO5isUAAAAAKE08N8DfF9MEwjin4mvTSREcHZd',
  secretKey:'6LfO5isUAAAAAI_k1FhstvdLds2W9AIepNZc-2Ge'
})


module.exports = {

  /**
   * Send a customized welcome email to the specified email address.
   *
   * @required {String} emailAddress
   *   The email address of the recipient.
   * @required {String} firstName
   *   The first name of the recipient.
   */
  check: function (req, next) {
    recaptcha.validateRequest(req)
      .then(function(){
        next()
      })
      .catch(function(errorCodes){


        next(errorCodes);
      });

  },
  'translateErrors': function(errorCodes) {
    return recaptcha.translateErrors(errorCodes);
  }
}
