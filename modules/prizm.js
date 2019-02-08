/**
 * Модуль парсера PRIZM
 */
 const request = require('request');
 const phantom = require('phantom');

 function parseDataTransactions(data) {
    return new Promise((resolve, reject) => {
        try {
            let newData = { status: 1, data: [] };
            data.transactions.forEach((el, i) => {
                let generated = {};
                generated['transaction'] = el.transaction;
                generated['from'] = el.senderRS;
                generated['to'] = el.recipientRS;
                generated['time'] = el.timestamp
                generated['amount'] = el.amountNQT;
                newData['data'].push(generated)
            });
            resolve(newData);
        } catch (error) {
            reject(error);
        }

    })
}

function parseDataBalance(data) {
    return new Promise((resolve, reject) => {
        try {
            let newData = { status: 1, balance: data.balanceNQT };

            resolve(newData);
        } catch (error) {
            reject(error);
        }

    })
}

function parseDataAll(data) {
    return new Promise((resolve, reject) => {
        try {
            /*console.log(data);*/
            let newData = data;

            resolve(newData);
        } catch (error) {
            reject(error);
        }

    })
}


/*exports.getParamining = wallet => {
    return new Promise((resolve, reject) => {
        request({ url: `https://wallet.prizm.space/prizm?requestType=getAccount&account=${wallet}&random=${Math.random()}`, jar: true }, (e, r, body) => {
            if (!e && r.statusCode == 200) {
                try {
                    parseDataBalance(JSON.parse(body)).then(data => resolve(data)).catch(e => reject(e));
                } catch (error) {
                    reject(`ParseBalance Error: ${error}`)
                }
            } else {
                reject(`Request to PRIZM Error: ${e}`)
            }
        });
    })
}*/





exports.getAllData = wallet => {
    return new Promise((resolve, reject) => {
        var page = require ('webpage'). create ();
        console.log ("«Пользовательский агент по умолчанию:«" + page.settings.userAgent);
        page.settings.userAgent = 'SpecialAgent';
        page.open ('http://www.google.com', function (status) {
          if (status!== 'success') {
            console.log ("«Не удалось получить доступ к сети»");
        } else {
            var ua = page.evaluate (function () {
              return document.getElementById ('qua'). textContent;
          });
            console.log (UA);
        }
        phantom.exit ();
    })
        /*request({ url: `http://wallet.prizm.space/prizm?requestType=getAccount&account=${wallet}&random=${Math.random()}`, jar: true }, (e, r, body) => {
            if (!e && r.statusCode == 200) {
                try {
                    parseDataAll(JSON.parse(body)).then(data => resolve(data)).catch(e => reject(e));
                } catch (error) {
                    reject(`ParseBalance Error: ${error}`)
                }
            } else {
                reject(`Request to PRIZM Error: ${e}`)
            }
        });*/
    })
}

exports.getBalance = wallet => {
    return new Promise((resolve, reject) => {
        request({ url: `https://migshoping.ru:3000/getBalance/${wallet}`, jar: true }, (e, r, body) => {
            if (!e && r.statusCode == 200) {
                try {
                    parseDataBalance(JSON.parse(body)).then(data => resolve(data)).catch(e => reject(e));
                } catch (error) {
                    reject(`ParseBalance Error: ${error}`)
                }
            } else {
                reject(`Request to PRIZM Error: ${e}`)
            }
        });
    })
}
exports.getTransactions = wallet => {
    return new Promise((resolve, reject) => {
        request({ rejectUnauthorized: false, url: `https://migshoping.ru:3000/getAllTrans/${wallet}`}, (e, r, body) => {
            /*console.log(r);*/
            /*reject(body);*/
            if (!e && r.statusCode == 200) {
                try {
                    parseDataTransactions(JSON.parse(body)).then(data => resolve(data)).catch(e => reject(e));
                } catch (error) {
                    reject(`ParseTransactions Error: ${error}`)
                }
            } else {
                reject(`Request to PRIZM Error: ${e}`)
            }
        });
    })
}