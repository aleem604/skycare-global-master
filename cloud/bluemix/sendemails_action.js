console.log("SendEmails Action Fired!");


let SENDGRID_API_KEY = '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';
let EMAIL_TEMPLATE_ID = 'd-a17ef499184d4baa97a3ccc65c747f23';
let FROM_EMAIL_ADDRESS = 'daniel.thompson@skycareglobal.com';

const sendgrid = require('@sendgrid/mail');

/**
  *
  * main() will be run when you invoke this action
  *
  * @param Cloud Functions actions accept a single parameter, which must be a JSON object.
  *
  * @return The output of this action, which must be a JSON object.
  *
  */
function main(params) {
    console.log(params); 
    // Make sure the input contains "rows" and "total_rows"
    let rows = params.rows;
    let totalRows = params.total_rows;
    let logInputs = params.logInputs;

    if (!rows) {
        return Promise.reject('rows is required.');
    }
    if (!Array.isArray(rows)) {
        return Promise.reject('rows must be an Array.');
    }
    if (!totalRows || isNaN(totalRows)) {
        totalRows = rows.length;
    }
    if (!logInputs) {
        logInputs = false;
    }
    
    // Authorize the SendGrid service
    sendgrid.setApiKey(SENDGRID_API_KEY);   
    
    // Loop through each escort row, sending an email about expired credentials to each one
    let emailSenderPromises = [];
    for (let i = 0; i < totalRows; i+=2) {
        emailSenderPromises.push(sendEscortNotificationEmail(rows[i], rows[i+1].value['email']));
    }
    
    return Promise.all(emailSenderPromises).then(
        (results) => {
            // Record the inputs in Cloudant if it was requested
            if (logInputs) {
                let docid = 'TEST-INPUTS-' + Date.now();
                return { "doc" : { "_id" : docid, "value": params } };
            } else {
                return { "final_status" : results };
            }
        }
    ).catch( (err) => {
        return { "final_error" : err };
    });
}



function sendEscortNotificationEmail(escortRecord, email) {

    let expiredStyle = "color: red; font-weight: bold; text-transform: uppercase;";

    return new Promise((resolve, reject) => {
        const emailMessage = {
            to: email.toLowerCase(),
            from: FROM_EMAIL_ADDRESS,
            templateId: EMAIL_TEMPLATE_ID,
            dynamic_template_data: {
                ML_EXPIRED_STYLE: ((escortRecord.value["licenseIsExpired"] == true) ? expiredStyle : ''),
                ML_EXPIRED: escortRecord.value["licenseIsExpired"],
                ALS_EXPIRED_STYLE: ((escortRecord.value["alsIsExpired"] == true) ? expiredStyle : ''),
                ALS_EXPIRED: escortRecord.value["alsIsExpired"],
                PASS_EXPIRED_STYLE: ((escortRecord.value["passportIsExpired"] == true) ? expiredStyle : ''),
                PASS_EXPIRED: escortRecord.value["passportIsExpired"],
                ML_EXPIRE_DATE: formatExpirationDate(escortRecord.value["licenseExpiration"]),
                ALS_EXPIRE_DATE: formatExpirationDate(escortRecord.value["alsExpiration"]),
                PASS_EXPIRE_DATE: formatExpirationDate(escortRecord.value["passportExpiration"]),
            }
        };

        sendgrid.send(emailMessage)
            .then(result => resolve(result))
            .catch(error => reject(error));
    });
    
}


function formatExpirationDate(dateText) {
    if (dateText !== undefined && dateText !== null && dateText != '') {
        let parsedDate = new Date(Date.parse(dateText));
        parsedDate.setHours(parsedDate.getHours()+5);
        return parsedDate.toDateString();
    } else {
        return 'MISSING';
    }
}


exports.main = main;