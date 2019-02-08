const express = require('express')
const webpage = require('webpage')
const phantom = require('phantom')
const app = express()
const prizm = require('./modules/prizm');
const port = 3000
const mongoose = require('mongoose');
const Memcached = require('memcached');
const memcached = new Memcached('192.168.0.102:11211');
const nodemailer = require('nodemailer');
const fs = require('fs');
const sendmail = require('sendmail')();
const https = require('https');
const mustache = require('mustache-express');
const subdomain = require('express-subdomain')
const router = express.Router();
const request = require('request');

const exphbs = require('express-handlebars');
const cron = require('node-cron');

const adminWallet = "PRIZM-GPN2-8CZ7-PNYP-8CEHG";
const adminPublickey = '759cc07249a9a45f063a2615f144931bb6fc5219385a496fb13df4bafea8812e';
const adminWalletEth = "0x7da0b37bcf3fe2c8a309c8d3dc98c3ea52d810a2";
mongoose.connect('mongodb://mrzlanx532:4aWvh75t@ds141264.mlab.com:41264/billtest', { useNewUrlParser: true }).then(

    (data) => { },

    err => { console.log(err) }

    );

const TransConfirmesSchema = new mongoose.Schema({
    indexNumber: Number,
    thisWallet: String,
    thisPublickey: String,
    prevWallet: String,
    prevPublickey: String,
    email: String,
    approve: Number 
}) 

const referralSchema = new mongoose.Schema({
    indexNumber: Number,
    thisWallet: String,
    thisPublickey: String,
    prevWallet: String,
    prevPublickey: String,
    email: String,
    approve: Number 
})

const paraminingCheckingSchema = new mongoose.Schema({
    dateStart: Number,
    lastChangeDate: Number,
    email: String,
    inParaPrizm: Number,
    percent: Number,
    currentIncome: Number 
})

const userSchema = new mongoose.Schema({
    info: {
        email: String
    },
    token: String,
    project: String,
    liberty: Number,
    date: { type: Date, default: Date.now },
    wallets: {
        prizm: {
            inSystemBalance: Number,
            wallet: String,
            publickey: String,
            inPull: Number
        },
        ether: {
            inSystemBalance: Number,
            wallet: String,
            inPull: Number,
        },
    },
    pointsBalance: Number,
    security: {
        key: String,
        ip: String,
        active: Boolean
    }
});

const convertationSchema = new mongoose.Schema({
    user: String,
    selling: {
        prizm: {
            pointWorth: Number,
            value: Number
        }
    },
    pointsGet: Number

})

const addPrizmInSystemSchema = new mongoose.Schema({
    user: String,
    wallet: String,
    transaction: String,
    amount: Number,
    transactionTimestamp: Number,
    date: { type: Date, default: Date.now }
})

const addBalanceSchema = new mongoose.Schema({
    uID: String,
    blockchain: {
        name: String,
        wallet: String,
        amount: Number,
        transactionTimestamp: Number
    },
    amount: Number,
    date: { type: Date, default: Date.now },
});

const currentParaSchema = new mongoose.Schema({
    id: Number,
    count: Number,
    date: Number,
})

const minusBalanceSchema = new mongoose.Schema({
    user: String,
    transactionData: {
        domain: String,
        hash: String,
        sum: Number
    },
    oldBalance: Number,
    newBalance: Number,
    date: { type: Date, default: Date.now },
})

const transactionShema = new mongoose.Schema({
    ID: String,
    domain: String,
    user: String,
    sum: Number,
    status: Number,
    security: String,
    hash: String,
    date: { type: Date, default: Date.now },
})

let referral = mongoose.model('referral', referralSchema);
let paraminingChecking = mongoose.model('paraminingChecking', paraminingCheckingSchema);
let Convertation = mongoose.model('convertation', convertationSchema);
let addPrizmInSystem = mongoose.model('AddPrizmInSystem', addPrizmInSystemSchema);
let AddBalance = mongoose.model('AddBalance', addBalanceSchema);
let User = mongoose.model('User', userSchema)
let Transcation = mongoose.model('Transaction', transactionShema);
let minusBalance = mongoose.model('minusBalance', minusBalanceSchema);
let currentPara = mongoose.model('currentPara', currentParaSchema);



app.use('/files', express.static('frontend'));
app.use('/user*', express.static('user'))
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies
app.engine('html', exphbs());

app.set('view engine', 'html');
app.set('views', __dirname + '/templates');

cron.schedule('0 0 * * *', () => {
  updatePercents();
  console.log('CRON сработал');
});

function plusBalance(arr, user) {
    console.log(`Init plus balance to ${user}`);

    addPrizmInSystem.create({
        user: user,
        wallet: arr.from,
        transaction: arr.transaction,
        amount: arr.amount
    });
    return new Promise((resolve, reject) => {
        User.find({ info: { email: user } }, (err, d) => {
            if (d.length) {
                console.log(`STARTING PLUS`);

                User.updateMany({ info: { email: user } }, {
                    wallets: {
                        prizm: {
                            inSystemBalance: Number(d[0].wallets.prizm.inSystemBalance) + Number(arr.amount),
                            wallet: d[0].wallets.prizm.wallet,
                            publickey: d[0].wallets.prizm.publickey,
                            inPull: d[0].wallets.prizm.inPull,
                        }
                    }
                }, (e, d) => {
                    resolve(d);
                    console.log(`ADDED ${arr.amount} PMZ`)
                })

            } else {
                console.log(`FATAL ERROR`);
                reject("FATAL ERROR");

            }
        })
    })
}
/**
 * господи
 * @param {Object} data
 *  @property {string} data.user - user
 * @property {string} data.domain - domain
 * @property {string} data.hash - hash
 * @property {string} data.sum -sum
 */
 function minusBalanceInit(data) {
    return new Promise((resolve, reject) => {
        User.findOne({ info: { email: data.user } }, (e, d) =>
            d ?
            data.sum > d.pointsBalance ?
            reject('No')
            : minusBalance.create({
                user: data.user,
                transactionData: {
                    domain: data.domain,
                    hash: data.hash,
                    sum: data.sum
                },
                oldBalance: d.pointsBalance,
                newBalance: Number(d.pointsBalance) - Number(data.sum)

            }, () =>
            User.updateOne({ pointsBalance: Number(d.pointsBalance) - Number(data.sum) }, () =>
                resolve(null)
                )
            )
            : reject('UserError')
            )
    })
}

function syncPrizmTest(data, user){
    console.log("Начало")
    console.log(user);
    console.log("Конец")
    /*return new Promise((resolve, reject) => {
        data.forEach((el, index) => {
            if (el.to == adminWallet) {
                console.log(`Found Transaction to Admin wallet ${index} / ${data.length - 1}`);
                
                addPrizmInSystem.find({ transaction: el.transaction }, (err, d) => {
                    if (d.length) {
                        console.log(`Registered transaction`);
                    } else {
                        plusBalance(el, user).then(
                            r => resolve(1)
                            ).catch(() => console.log(131))
                    }
                })

            } else {
                console.log(`Нет совпадений ${index} / ${data.length - 1}`);
                if (index == data.length - 1) {
                    reject(0)
                }

            }
        });
    })*/
}



function syncPrizm(data, user) {

    console.log("SYNC START")
    return new Promise((resolve, reject) => {
        data.forEach((el, index) => {
            if (el.to == adminWallet) {
                /*console.log(`Found Transaction to Admin wallet ${index} / ${data.length - 1}`);*/
                
                addPrizmInSystem.find({ transaction: el.transaction }, (err, d) => {
                    if (d.length) {
                        /*console.log(`Registered transaction`);*/
                    } else {
                        plusBalance(el, user).then(
                            r => resolve(1)
                            ).catch(() => console.log(131))
                    }
                })

            } else {
                /*console.log(`Нет совпадений ${index} / ${data.length - 1}`);*/
                if (index == data.length - 1) {
                    reject(0)
                }

            }
        });
    })
}
function getCurrentTimeUnix(){
    currentDate = Date.now().toString();
    currentDate = currentDate.substring(0, currentDate.length - 3);
    return currentDate;
}

function makeConvertToBalls(userData, blockchain, value) {
    console.log(`Init Convert`);

   /* console.log('userData: '+userData);
    console.log('blockchain: '+blockchain);
    console.log('value: '+value);*/

    return new Promise((resolve, reject) => {
        if (blockchain == "prizm") {
            let worth = 1;
            let toConvert = value / 1;

            console.log('userData: '+userData[0].email);
            Convertation.create({
                user: userData[0].email,
                selling: {
                    prizm: {
                        pointWorth: worth,
                        value: value
                    }
                },
                pointsGet: toConvert

            }, (e, d) => {

                console.log('To convert: '+toConvert);

                paraminingChecking.find({ email: userData[0].email }, (err, res) => {
                    if (!err) {
                        console.log('result: ');
                        if (res[0].currentIncome==0) {
                            console.log('На вашем счету 0 баллов');
                        }
                        else{
                            console.log('is Working!');
                            currentDate = Date.now();
                            paraminingChecking.updateOne({ email: userData[0].email }, {
                                dateStart: res[0].dateStart,
                                email: userData[0].email,
                                inParaPrizm: res[0].inParaPrizm,
                                percent: res[0].percent,
                                currentIncome: 0,
                                lastChangeDate: getCurrentTimeUnix()
                            }, (error, result) => {
                             console.log('Result: '+JSON.stringify(result));
                             console.log('Error: '+error); 
                         }
                         )
                        }
                    }
                    console.log('First param: '+err);
                    console.log('Second param: '+res);

                    User.findOne({ info: { email: userData[0].email } }, (err, _res) =>{

                        console.log('_RES: '+_res);
                        console.log('tochtonuzhno:'+res);

                        if (_res.pointsBalance == undefined) {
                            User.updateOne({ info: { email: userData[0].email } }, {
                                pointsBalance: res[0].currentIncome
                            }, () => resolve(1))
                        }
                        else{
                            User.updateOne({ info: { email: userData[0].email } }, {
                                pointsBalance: _res.pointsBalance + res[0].currentIncome
                            }, () => resolve(1))
                        }
                    })
                })
            })
        } else {
            reject(0)
        }
    })
}

function makeConvertToPull(userData, blockchain, value) {
    console.log(`Init Convert`);

   /* console.log('userData: '+userData);
    console.log('blockchain: '+blockchain);
    console.log('value: '+value);*/

    return new Promise((resolve, reject) => {
        if (blockchain == "prizm") {
            let worth = 1;
            let toConvert = value / 1;
            Convertation.create({
                user: userData[0].info.email,
                selling: {
                    prizm: {
                        pointWorth: worth,
                        value: value
                    }
                },
                pointsGet: toConvert

            }, (e, d) => {

                console.log('To convert: '+toConvert);

                paraminingChecking.find({ email: userData[0].info.email }, (err, res) => {
                    if (!err) {
                        console.log('result: ');
                        if (res=='') {
                            paraminingChecking.create({
                                dateStart: getCurrentTimeUnix(),
                                email: userData[0].info.email,
                                inParaPrizm: toConvert,
                                percent: 0.7,
                                currentIncome: 0,
                                lastChangeDate: getCurrentTimeUnix()
                            }, (e, d) => {
                                console.log('Если нет счета парамайнинга');
                            })
                        }
                        else{
                            console.log('is Working!');
                            currentDate = Date.now();
                            paraminingChecking.updateOne({ email: userData[0].info.email }, {
                                dateStart: res[0].dateStart,
                                email: userData[0].info.email,
                                inParaPrizm: res[0].inParaPrizm + toConvert,
                                percent: res[0].percent,
                                currentIncome: res[0].currentIncome,
                                lastChangeDate: getCurrentTimeUnix()
                            }, (error, result) => {
                             console.log('Result: '+JSON.stringify(result));
                             console.log('Error: '+error); 
                         }
                         )
                        }
                    }
                    console.log('First param: '+err);
                    console.log('Second param: '+res);
                    console.log('NeedParam: '+userData[0].info.email);


                    console.log('NeedParam1: '+userData[0].wallets.prizm.inSystemBalance);
                    console.log('NeedParam2: '+toConvert);

                    console.log(Number(userData[0].wallets.prizm.inSystemBalance) - toConvert);

                    User.updateOne({ info: { email: userData[0].info.email } }, {
                        wallets: {
                            prizm: {
                                inSystemBalance: Number(userData[0].wallets.prizm.inSystemBalance) - toConvert,
                                wallet: userData[0].wallets.prizm.wallet,
                                publickey: userData[0].wallets.prizm.publickey,
                                inPull: Number(userData[0].wallets.prizm.inPull) + toConvert
                            }
                        }
                    }, () => resolve(1))

                    console.log('Тестим');
                })

            })
        } else {
            reject(0)
        }
    })
}

function makeConvert(userData, blockchain, value) {

    return new Promise((resolve, reject) => {
        if (blockchain == "prizm") {
            let worth = 1;
            let toConvert = value / 1;
            Convertation.create({
                user: userData[0].info.email,
                selling: {
                    prizm: {
                        pointWorth: worth,
                        value: value
                    }
                },
                pointsGet: toConvert

            }, (e, d) => {
                User.updateOne({ info: { email: userData[0].info.email } }, {
                    wallets: {
                        prizm: {
                            inSystemBalance: Number(userData[0].wallets.prizm.inSystemBalance) - Number(value),
                            wallet: userData[0].wallets.prizm.wallet,
                            publickey: userData[0].wallets.prizm.publickey
                        }
                    },
                    pointsBalance: userData[0].pointsBalance + toConvert
                }, () => resolve(1))
            })
        } else {
            reject(0)
        }
    })
}

function updatePercents(){

    //Tusk-function for CRON on Node.js

    var allEmails = [];
    var allCurrentIncome = [];
    var allPercent = [];
    var allInParaPrizm = [];

    var newCurrentIncome = [];

        paraminingChecking.find({}, (err, result) => {
            /*res.send(result);*/
            for (var key in result){
                allEmails[key] = result[key].email;
                allCurrentIncome[key] = result[key].currentIncome;
                allPercent[key] = result[key].percent;
                allInParaPrizm[key] = result[key].inParaPrizm;

                newCurrentIncome[key] = allInParaPrizm[key] * allPercent[key] + allCurrentIncome[key];
            }

            for (var _key in allEmails){
                if (newCurrentIncome[_key].toString().length > 4) {
                    console.log('Было: '+newCurrentIncome[_key]);
                    newCurrentIncome[_key] = newCurrentIncome[_key].toString().substring(0, 4);
                    console.log('Стало: '+newCurrentIncome[_key]);
                }
                paraminingChecking.updateOne({ email: allEmails[_key] }, { currentIncome: newCurrentIncome[_key] }, (err, _result) => {
                    console.log('Цикл №: '+_key);
                })
            }
        })   

}

function confirmTransaction(data) {
    return new Promise((resolve, reject) => {
        request.post({
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            url: 'https://migshoping.ru/payment/paid',
            body: `orderID=${data.ID}&hash=${data.hash}&sum=${data.sum}&system=points&number=123`
        }, function (error, response, body) {
            request.post({
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                url: 'https://migshoping.ru/payment/addpayment',
                body: `id=${data.ID}&number=0&date=${Math.round((new Date()).getTime() / 1000)}&system=points`
            }, function (error, response, body) {
                resolve(null)
            });
        });

    })
}


/**
 * Создаем транзакцию
 * @param {Object} data - Данные
 * @property {string} data.ID - Ордер
 * @property {string} data.domain - Домен
 * @property {string} data.email  - Юзер
 * @property {string} data.sum - Сумма
 * @returns {Promise.<string>} - Ссылка на pay
 */
 function createTransaction(data) {
    return new Promise((resolve, reject) => {
        User.find({ info: { email: data.email } }, (e, d) => {
            if (d.length) {
                let hash = Math.random().toString(36).substring(2, 15) + Math.floor(Date.now() / 1000).toString(36).substring(2, 15); //Stackof)
                let security = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                Transcation.create({
                    ID: data.ID,
                    domain: data.domain,
                    user: data.email,
                    sum: data.sum,
                    status: 0,
                    security: security,
                    hash: hash,

                }).then(() => resolve(`http://pay.migshoping.ru/pay/${hash}`));

            } else {
                reject("User not found")
            }
        });
    })
}
/**
 * Транзакция по хешу
 * @param {string} hash - Хеш транзакции
 * @returns {Promise} - Данные из бд
 */
 function getTransactionsByHash(hash) {
    return new Promise((resolve, reject) =>
        Transcation.findOne({ hash: hash }, (e, d) => d ? resolve(d) : reject("Not found"))
        )
}

function sendReturn(dataemail, prizm, publickey, pzm, key, field){

/*return [
    'notify' => [
        'smtp' => true,
        'smtp_host' => 'smtp.yandex.ru',
        'smtp_username' => 'migshoping@yandex.ru',
        'smtp_password' => 'a7905415',
        'smtp_port' => 465,
        'secure_type' => 'ssl',
        'senderName' => 'Migshoping',
        'senderEmail' => 'migshoping@yandex.ru',
    ],
    ];*/

    nodemailer.createTestAccount((err, account) => {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: 'smtp.yandex.ru',
        port: 465,
        secure: 'ssl', // true for 465, false for other ports
        auth: {
            user: 'migshoping@yandex.ru', // generated ethereal user
            pass: 'a7905415' // generated ethereal password
        }
    });

    // setup email data with unicode symbols
    let mailOptions = {
        from: 'migshoping@yandex.ru', // sender address
        to: 'testly@inbox.ru', // list of receivers
        subject: 'Возврат PRIZM', // Subject line
        text: 'Hello world?', // plain text body
        html: `
        <table>
        <tr>
        <th>Email:</th>
        <th>${dataemail}</th>
        </tr>
        <tr>
        <th>Prizm-кошелек:</th>
        <th>${prizm}</th>
        </tr>
        <tr>
        <th>Кол-во Prizm:</th>
        <th>${pzm}</th>
        </tr>
        <tr>
        <th>Public-key:</th>
        <th>${publickey}</th>
        </tr>
        <tr>
        <th>Ключ:</th>
        <th>${key}</th>
        </tr>
        <tr>
        <th>Поле:</th>
        <th>${field}</th>
        </tr>
        </table>
        ` // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
});
}


function sendTransactionVerify(data) {
    return new Promise((resolve, reject) => sendmail({
        from: 'no-reply@pay.migshoping.ru',
        to: data.email,
        subject: 'Код',
        html: `
        <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.2/css/bulma.min.css" />
        </head>
        <div class="container">
        <div class="columns is-centered">
        <div class="column is-half">
        <div class="box content">
        <h1>Списание ${data.sum} баллов</h1>
        <h1>Код</h1>
        <h1 class="has-text-danger">${data.code}</h1>
        </div>
        </div>
        </div>
        
        `,
    }, function (err, reply) {
        console.log(err && err.stack);
        console.dir(reply);
        resolve(null)
    }))
}

/**
 * Есть ли такая чтоб не генерировать много 
 * @param {Object} data 
 */
 function checkTransaction(data) {
    return new Promise((resolve, reject) =>
        Transcation.findOne(data, (e, d) => d ? resolve(d) : reject("Pass"))
        )
}

app.get('/info/ether/checkadd/:wallet', (req, res) => {
 res.setHeader('Content-Type', 'application/json');
 let data = req.params;

 User.findOne({"wallets.ether.wallet":data.wallet}, async (e, users_data) => { 
    if (users_data) {

        await Transactioneth.find({ user: users_data.info.email }, async (e_, trans_data) => { 
            if (trans_data != '') { 
                await ether.getTransactionsEther(data.wallet).then( async dataTrans => {

                    let etherscanTrans = JSON.parse(dataTrans);

                    let sum = users_data.wallets.ether.inSystemBalance;

                    var key = 0;

                    var stop = 0;

                    for(key in etherscanTrans.result){

                        if (etherscanTrans.result[key].to === adminWalletEth) {

                            let Transactioneth2 = mongoose.model('Transactioneth', transactionethShema);

                            console.log('key_need: '+key);

                            await Transactioneth2.findOne({hash: etherscanTrans.result[key].hash}, async (trans2find_e, trans2find)=>{
                                console.log('trans2find: '+trans2find);
                                if (trans2find == null) {

                                    let amount = etherscanTrans.result[key].value / 1000000000000000000;

                                    sum = Number(sum) + Number(amount);

                                    let Transactioneth3 = mongoose.model('Transactioneth', transactionethShema);
                                    await Transactioneth3.create({
                                        user: users_data.info.email,
                                        sum: amount,
                                        status: 1,
                                        hash: etherscanTrans.result[key].hash,
                                    }, async() => {

                                        let User2 = mongoose.model('User', userSchema);
                                        await User2.find({"info.email": users_data.info.email}, async(users_data2) =>{
                                            await User2.updateOne({"info.email": users_data.info.email}, {"wallets.ether.inSystemBalance": sum}, () => {
                                                stop++;
                                            });
                                        })
                                    });
                                }
                                else{

                                }
                            });
                        }
                        if (stop > 0) {
                            break;
                        }
                    }
                    
                })
            }
            else{

                ether.getTransactionsEther(data.wallet).then( dataTrans => {
                    let etherscanTrans = JSON.parse(dataTrans);
                    if (etherscanTrans.status == "1") {
                        let totaly = 0;
                        for(key in etherscanTrans.result){
                            if (String(etherscanTrans.result[key].to) == String(adminWalletEth)) {
                                if (Number(etherscanTrans.result[key].confirmations) > 1) {
                                    let amount = etherscanTrans.result[key].value / 1000000000000000000;
                                    totaly += amount;

                                    Transactioneth.create({
                                        user: users_data.info.email,
                                        sum: amount,
                                        status: 1,
                                        hash: etherscanTrans.result[key].hash,
                                    });
                                }
                            }
                        }

                        User.updateOne({"info.email":String(users_data.info.email)},{"wallets.ether.inSystemBalance": totaly}, (mistake, result___) => {});
                    }
                })
            }
        })
    }
    else{
        console.log('Пользователя не существует');
    }
})
 res.send('{"status": "1"}');
});

app.get('/getAllTrans/', (req, res) => {

    prizm.getTransactions(adminWallet).then( data => {
        res.send(data);
    }).catch( e => {
        res.send(e);
    })

})

app.get('/getTrans/', (req, res) => {
  /*  currentPara.create({ id: 2, count: 0.26965563 }, function (err, small) {
      if (err) return handleError(err);*/
      let get = req.params;
      res.setHeader('Content-Type', 'application/json');
      Transcation.find({}, (e, r) => {
        res.send(r);
    })
  })








app.get('/setpara/:para', (req, res) => {

    res.send(req.params.para);
    var unixdate = Date.now().toString();
    unixdate = unixdate.substring(0, unixdate.length - 3);
    /*currentPara.create({ id: 3, count: 0.26965563, date: unixdate }, function (err, small) {
      if (err) return handleError(err);*/
      currentPara.updateOne({id: 3}, {count: req.params.para, date: unixdate}, function (err, small){
        if (err) return handleError(err);
    })



      res.send('lol');


      /*currentPara.find({id: 3 }, (e, d) => {
        if (d.length) {
            res.send(d);
        }
    })*/



/*    User.find({ info:{ email:get.email} }, (e, d) => {
        if (d.length) {
            try{
                sendReturn(get.email, d[0].wallets.prizm.wallet, d[0].wallets.prizm.publickey, d[0].wallets.prizm.inSystemBalance, get.key, get.field);
                res.send('Сработало');
            }
            catch(err)
            {
                res.send(err);
            }
        }
    }); 
});*/


});

/*app.get('//create/', (req, res) => {
    res.status(500).render('temp.error.html', { code: 500, message: "Неверное обращение" })
})*/

app.get('/getpara/:id', (req, res) => {
  /*  currentPara.create({ id: 2, count: 0.26965563 }, function (err, small) {
      if (err) return handleError(err);*/
      let newData;

      var jsonParser = express.json();
      /*console.log(newData.balance);*/



      currentPara.find({id: 3 }, (e, d) => {
        if (d.length) {
            /*var a = Date.now().toString();
            a = a.substring(0, a.length - 3);
            console.log(a);*/
            /*res.send(Date.now());*/
            res.send(d);
        }
    })
  })

/* Special for DEBUG [BEGIN] */

app.get('/deleteOnePara/:id', (req, res) => {
  /*  currentPara.create({ id: 2, count: 0.26965563 }, function (err, small) {
      if (err) return handleError(err);*/
      let get = req.params;
      res.setHeader('Content-Type', 'application/json');
      referral.deleteOne({ _id: get.id }, (err, result) =>{
        res.send('Удалена запись: '+get.id);
    })
  })

app.get('/existsWallet/:wallet', (req, res) => {
    let get = req.params;
    res.setHeader('Content-Type', 'application/json');
    User.findOne({'wallets.prizm.wallet': get.wallet}, (err, result) => {
        if (result) {
            res.send('1');
        }
        else{
            res.send('0');   
        }
        if (err) return handleError(err);
    })

})

app.get('/getUserInfo/:email', (req, res) => {
  /*  currentPara.create({ id: 2, count: 0.26965563 }, function (err, small) {
      if (err) return handleError(err);*/
      let get = req.params;
      res.setHeader('Content-Type', 'application/json');
      User.find({info:{email: get.email}}, (err, result) => {
        res.send(result);
        if (err) return handleError(err);
    })
  })

app.get('/approve/:email', (req, res) => {
  /*  currentPara.create({ id: 2, count: 0.26965563 }, function (err, small) {
      if (err) return handleError(err);*/
      let get = req.params;
      res.setHeader('Content-Type', 'application/json');
      referral.updateOne({email: get.email}, {approve: 1}, (err, small) => {
        res.send('Готово');
        if (err) return handleError(err);
    })
  })

app.get('/deleteAllTableReferral/', (req, res) => {
    referral.deleteMany({}, (e, r) => {
        res.send('Готово');
    })
})

app.get('/getTableReferral/', (req, res) => {
  /*  currentPara.create({ id: 2, count: 0.26965563 }, function (err, small) {
      if (err) return handleError(err);*/
      res.setHeader('Content-Type', 'application/json');
      referral.find({}, (err, result) => {
        res.send(JSON.stringify(result));
    })
  })

app.get('/getTableReferral/:email', (req, res) => {
  /*  currentPara.create({ id: 2, count: 0.26965563 }, function (err, small) {
      if (err) return handleError(err);*/
      let get = req.params;
      res.setHeader('Content-Type', 'application/json');
      referral.findOne({ email: get.email}, (err, result) => {
        res.send(JSON.stringify(result));
    })
  })

app.get('/debug/addprizm/:email/:count/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    var get = req.params;

    var prizm;
    var publickey;

    User.find({ info:{ email:get.email} }, (e, d) => {
        if (d.length) {
            console.log(d[0].wallets.prizm.wallet);
            console.log(d[0].wallets.prizm.publickey);

            User.updateOne({ info: { email: get.email } }, {
                wallets: {
                    prizm: {
                        inSystemBalance: get.count,
                        publickey: d[0].wallets.prizm.publickey,
                        wallet: d[0].wallets.prizm.wallet,
                        inPull: d[0].wallets.prizm.inPull
                    }
                },
            }, function (err, small){
                if (err) return handleError(err);
            }
            )
        }
    });
    res.send('end');
});

app.get('/updatepercent/:key', (req, res) => {

    let get = req.params;
    var allEmails = [];
    var allCurrentIncome = [];
    var allPercent = [];
    var allInParaPrizm = [];

    var newCurrentIncome = [];

    if (get.key == 'point532') {    
        paraminingChecking.find({}, (err, result) => {
            res.send(Object.values(result));
            /*res.send(result);*/
            for (var key in result){
                allEmails[key] = result[key].email;
                allCurrentIncome[key] = result[key].currentIncome;
                allPercent[key] = result[key].percent;
                allInParaPrizm[key] = result[key].inParaPrizm;

                newCurrentIncome[key] = allInParaPrizm[key] * allPercent[key] + allCurrentIncome[key];
            }

            for (var _key in allEmails){
                paraminingChecking.updateOne({ email: allEmails[_key] }, { currentIncome: newCurrentIncome[_key] }, (err, _result) => {
                    console.log('Цикл №: '+_key);
                })
            }
        })   
    }
});

app.get('/getParaTable/:email', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    let get = req.params;
    paraminingChecking.find({ email: get.email }, (err, result) => {
        if (result.length) {
            res.send(JSON.stringify({
                dateStart: result[0].dateStart,
                email: result[0].email,
                inParaPrizm: result[0].inParaPrizm,
                percent: result[0].percent,
                currentIncome: result[0].currentIncome,
                lastChangeDate: result[0].lastChangeDate
            }))
        }
        else{
            res.send(JSON.stringify({ status: 3, error: "User not exist" }));
        }
    });

});

app.get('/paraToBalls/:email/:blockchain/:value', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    let get = req.params;
    var kek = true;


    paraminingChecking.find({ email: get.email  }, (e, d) => {
        if (d.length) {
            if (get.blockchain == "prizm") {

                console.log("d: "+d);
                console.log("get.blockchain: "+get.blockchain);
                console.log("get.value: "+get.value);
                console.log('currentIncome: '+d[0].currentIncome);
                console.log('kek: '+kek);
                kek != true ?
                res.send(JSON.stringify({ status: 0, error: "Not valid" })) :
                makeConvertToBalls(d, get.blockchain, get.value).then(() => 
                    res.send(JSON.stringify({ status: 1 })))
                .catch((e) =>
                    res.send(JSON.stringify({ status: 0, error: "Not valid" }))
                    )
            } else {
                res.send(JSON.stringify({ status: 0, error: "Not valid" }));
            }
        } else {
            res.send(JSON.stringify({ status: 3, error: "User not exist" }))
        }
    })
});

app.get('/deleteUser/:email', (req, res) => {
    let get = req.params;
    paraminingChecking.deleteMany({ email: get.email }).exec();
    User.deleteOne({ info: { email: get.email } }).exec();
    res.send('Ghbdtn');
});

app.get('/referral/:email', (req, res) => {

    let get = req.params;

    User.findOne( { info:{ email:get.email} }, (err, result) => {
        if (result) {
            referral.countDocuments((_err, _result) => {
                console.log('referral+query: '+_result);
                if (_result % 87 == 0) {
                    referral.create({
                        indexNumber: _result + 1,
                        thisWallet: result.wallets.prizm.wallet,
                        thisPublickey: result.wallets.prizm.publickey,
                        prevWallet: adminWallet,
                        prevPublickey: adminPublickey,
                        email: result.info.email,
                        approve: 0
                    }, (err, data) => {
                        console.log('"Предыдущий кошелек админа"')
                        res.send(JSON.stringify({ status: 1 }))
                        if (err) return handleError(err);
                    }
                    );        
                }
                else{
                    referral.findOne({ indexNumber: _result }, (__err, __result) => {
                        referral.create({
                            indexNumber: __result.indexNumber + 1,
                            thisWallet: result.wallets.prizm.wallet,
                            prevWallet: __result.thisWallet,
                            prevPublickey: __result.thisPublickey,
                            email: result.info.email,
                            approve: 0
                        }, (err, data) => {
                            console.log('"Предыдущий кошелек пользователя"')
                            res.send(JSON.stringify({ status: 1 }))
                            if (err) return handleError(err);
                        }
                        ); 
                    })

                }
            });
        }
        else{
            res.send(JSON.stringify({ status: 3, error: "User not exist" }));
        }
        
    })
});

app.get('/payBalls/:email/:value', (req, res) => {
  /*  currentPara.create({ id: 2, count: 0.26965563 }, function (err, small) {
      if (err) return handleError(err);*/
      let get = req.params;
      User.findOne({ info: { email: get.email }}, (e, r) => {
        var currentBalance = r.pointsBalance;

        console.log('get.email: '+get.email);
        console.log('currentBalance: '+currentBalance);
        console.log('get.value: '+get.value);

        User.updateOne({ info: { email: get.email } }, { pointsBalance: currentBalance - get.value }, (e, r)=>{
            console.log('Всепиздато');
            res.send('gerge');
        });
    })
  })



/* Special for DEBUG [END] */

app.get('/addBalls/:email', (req, res) => {
  /*  currentPara.create({ id: 2, count: 0.26965563 }, function (err, small) {
      if (err) return handleError(err);*/
      let get = req.params;
      res.setHeader('Content-Type', 'application/json');
      User.find({ info: { email: get.email }}, (e, r) => {
        res.send(r);
    })
      User.updateOne({ info: { email: get.email } }, { pointsBalance: 600 }, (e, r)=>{
        console.log('Всепиздато');
    });
  })


app.get('/sendmail/:email/:key/:field/', (req, res) => {
    let get = req.params;
    if (get.email.indexOf("point532")) {
        get.email = get.email.replace("point532",".");
    }

    User.find({ info:{ email:get.email} }, (e, d) => {
        if (d.length) {
            /*res.send('get.dataemail: '+get.email+' d[0].wallets.prizm.wallet: '+d[0].wallets.prizm.wallet+' d[0].wallets.prizm.publickey: '+d[0].wallets.prizm.publickey+'d[0].wallets.prizm.inSystemBalance: '+d[0].wallets.prizm.inSystemBalance+' get.key:'+ get.key+'get.field: '+get.field);*/
            try{
                sendReturn(get.email, d[0].wallets.prizm.wallet, d[0].wallets.prizm.publickey, d[0].wallets.prizm.inSystemBalance, get.key, get.field);
                res.send('Сработало');
            }
            catch(err)
            {
                res.send(err);
            }
        }
    });
});

app.get('/billing/sentopull/:email/:blockchain/:value', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    let get = req.params;
    User.find({ info: { email: get.email } }, (e, d) => {
        if (d.length) {
            if (get.blockchain == "prizm") {
                Number(get.value) > Number(d[0].wallets.prizm.inSystemBalance) ?
                res.send(JSON.stringify({ status: 0, error: "Not valid" })) :
                makeConvertToPull(d, get.blockchain, get.value).then(() => 
                    res.send(JSON.stringify({ status: 1 })))
                .catch(() =>
                    res.send(JSON.stringify({ status: 0, error: "Not valid" }))
                    )
            } else {
                res.send(JSON.stringify({ status: 0, error: "Not valid" }));
            }
        } else {
            res.send(JSON.stringify({ status: 3, error: "User not exist" }))
        }
    })
});

app.get('/billing/convert/:email/:blockchain/:value', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    let get = req.params;
    User.find({ info: { email: get.email } }, (e, d) => {
        if (d.length) {
            if (get.blockchain == "prizm") {
                Number(get.value) > Number(d[0].wallets.prizm.inSystemBalance) ?
                res.send(JSON.stringify({ status: 0, error: "Not valid" })) :
                makeConvert(d, get.blockchain, get.value).then(() =>
                    res.send(JSON.stringify({ status: 1 })))
                .catch(() =>
                    res.send(JSON.stringify({ status: 0, error: "Not valid" }))
                    )
            } else {
                res.send(JSON.stringify({ status: 0, error: "Not valid" }));
            }
        } else {
            res.send(JSON.stringify({ status: 3, error: "User not exist" }))
        }
    })
});

app.get('/pay/:transaction', (req, res) => {
    getTransactionsByHash(req.params.transaction).then(data =>
        data.status == 0 ?
        res.render('temp.pay.html', {
            ID: data.ID,
            user: data.user,
            sum: data.sum,
            hash: req.params.transaction
        })
        :
        res.status(400).render('temp.error.html', { code: 400, message: "Транзакция устарела" })

        ).catch(e => res.status(400).render('temp.error.html', { code: 400, message: "Транзакция не найдена" }))
})
app.get('/pay/:transaction/end', (req, res) =>
    getTransactionsByHash(req.params.transaction).then(dataTransaction =>
        dataTransaction.status == 0 ?
        User.findOne({
            info: {
                email: dataTransaction.user
            }
        }, (e, dataUser) =>
        dataUser ?
        dataUser.pointsBalance < dataTransaction.sum ?
        res.status(200).render('temp.pay.nofunds.html',
        {
            user: dataUser.info.email,
            points: dataUser.pointsBalance,
            sum: dataTransaction.sum
        }
        )
        :
        sendTransactionVerify(
        {
            email: dataUser.info.email,
            sum: dataTransaction.sum,
            code: dataTransaction.security
        }).then(() =>
        res.status(200).render('temp.pay.end.html',
        {
            user: dataUser.info.email,
            points: dataUser.pointsBalance,
            sum: dataTransaction.sum
        }
        ))
        :
        res.status(500).render('temp.error.html', { code: 500, message: "Ошибка данных" })


        )
        :
        res.status(400).render('temp.error.html', { code: 400, message: "Транзакция устарела" })


        ).catch(e => res.status(400).render('temp.error.html', { code: 400, message: "Транзакция не найдена" }))
    )

app.post('/pay/:transaction/end', (req, res) =>
    typeof req.body.code !== "undefined" ?
    getTransactionsByHash(req.params.transaction)
    .then(dataTransaction =>
        dataTransaction.status == 0 ?
        dataTransaction.security == req.body.code ?
        minusBalanceInit(dataTransaction).then(() =>
            Transcation.updateOne({ hash: req.params.transaction }, { status: 1 }, (e, d) => {
                confirmTransaction(dataTransaction).then(() => res.status(200).render('temp.pay.success.html'))
            })
            ).catch(() =>
            res.status(500).render('temp.error.html', { code: 500, message: "Ошибка сервера" })
            )
            :
            res.status(400).render('temp.error.html', { code: 400, message: "Неверный код" })
            :
            res.status(400).render('temp.error.html', { code: 400, message: "Транзакция устарела" })
            )
    .catch(() =>
        res.status(500).render('temp.error.html', { code: 500, message: "Ошибка сервера" })
        )
    :
    res.status(500).render('temp.error.html', { code: 500, message: "Ошибка сервера" })
    )

//Транзакции
app.get('/transactions/create/', (req, res) => {
    res.status(500).render('temp.error.html', { code: 500, message: "Неверное обращение" })
})
app.post('/transactions/create/', (req, res) => {
    console.log(req.body);
    if (
        typeof req.body.orderID !== "undefined" &&
        typeof req.body.domain !== "undefined" &&
        typeof req.body.user !== "undefined" &&
        typeof req.body.sum !== "undefined"
        ) {
        checkTransaction({ //Чекаем на повторение
            ID: req.body.orderID,
            user: req.body.user
        }).then(data => //Если есть отдаем
        res.status(200)
        .json({ status: 200, paymentLink: `http://pay.migshoping.ru/pay/${data.hash}` }))
            .catch(() => //Или создаем новую
                createTransaction({
                    ID: req.body.orderID,
                    domain: req.body.domain,
                    email: req.body.user,
                    sum: req.body.sum
                }).then(url =>
                res.status(200)
                .json({ status: 200, paymentLink: url })
                )
                )

        } else {
            console.log('Error')
            res.status(400).json({ status: 400, error: "Data invalid" })
        }
    })

app.post('/transactions/verifi/', (req, res) =>
    Transcation.findOne({ ID: req.body.order, hash: req.body.hash }, (e, data) => {
        console.log(req.body)
        data ?
        data.status == 0 ?
        res.status(400).json({ status: 400 })
        :
        res.status(200).json({ status: 200 })
        :
        res.status(400).json({ status: 400 })
    }
    )
    )

app.get('/billing/syncTest/:email', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    let get = req.params;


    beforeEmail = get.email

    if (get.email.indexOf("point532") != '-1' ) {
        get.email = get.email.replace("point532",".");
    }

    afterEmail = get.email;


    User.find({ info: { email: afterEmail } }, (e, d) => {
        /*res.send(JSON.stringify({ status: 3, error: "User not exist" });*/
        if (d.length) { //Если есть юзер
            /*res.send(d+'gerger');*/

            prizm.getTransactions(d[0].wallets.prizm.wallet).then(data => {

                /*res.send(d[0].wallets.prizm.wallet);*/


                syncPrizmTest(data.data, afterEmail).then(r => res.send(JSON.stringify({ status: 11 }))).catch(e => {
                    res.send(JSON.stringify({ status: 1 }));
                }
                )
            }

            ).catch(er => prizm.getTransactions(d[0].wallets.prizm.wallet).then(data => {
                syncPrizmTest(data.data, afterEmail).then(r => res.send(JSON.stringify({ status: 11 }))).catch(e => {
                    res.send(JSON.stringify({ status: 1 }));
                }
                )
            }
            ).catch(e => res.send(JSON.stringify({ status: 0, error: "GT" })))
            );
        } else {
            res.send(JSON.stringify({ status: 3, error: "User not exist" }))
        }
    })

})

app.get('/billing/sync/:email', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    let get = req.params;


    beforeEmail = get.email

    if (get.email.indexOf("point532") != '-1' ) {
        get.email = get.email.replace("point532",".");
    }

    afterEmail = get.email;


    User.find({ info: { email: afterEmail } }, (e, d) => {
        /*res.send(JSON.stringify({ status: 3, error: "User not exist" });*/
        if (d.length) { //Если есть юзер
            /*res.send(d+'gerger');*/
            prizm.getTransactions(d[0].wallets.prizm.wallet).then(data => {
                /*res.send(d[0].wallets.prizm.wallet);*/
                syncPrizm(data.data, afterEmail).then(r => res.send(JSON.stringify({ status: 11 }))).catch(e => {
                    res.send(JSON.stringify({ status: 1 }));
                })}).catch(er => prizm.getTransactions(d[0].wallets.prizm.wallet).then(data => {
                    syncPrizm(data.data, afterEmail).then(r => res.send(JSON.stringify({ status: 11 }))).catch(e => {
                        res.send(JSON.stringify({ status: 1 }));
                    }
                    )
                }
                ).catch(e => {
                    console.log(d[0].wallets.prizm.wallet);
                    res.send(JSON.stringify({ status: 0, error: "GT", message: e }))
                }
                )
                );
            } else {
                res.send(JSON.stringify({ status: 3, error: "User not exist" }))
            }
        })

})

app.get('/approveWallet/:wallet', (req, res) => {

    let get = req.params;

    console.log('Блять сколько можно!!!!!');

    console.log(get.wallet);
    prizm.getTransactions(get.wallet).then(data =>
    {
        /*res.send(JSON.stringify(data))*/
        console.log('Zaebal SYka');
        /*res.send(JSON.stringify(data))*/

        referral.findOne( {thisWallet: get.wallet}, (e, r) => {

            console.log('This wallet: '+r.thisWallet);
            console.log('Prev wallet: '+r.prevWallet);

            for (key in data.data) {
                if ((data.data[key].from == r.thisWallet) && (data.data[key].to == r.prevWallet)) {
                        /*console.log('data.from: '+data.data[key].from+' | thisWallet: '+r.thisWallet);
                        console.log('data.to: '+data.data[key].to+' | prevWallet: '+r.prevWallet);*/

                        referral.updateOne({ thisWallet: r.thisWallet, prevWallet: r.prevWallet }, { approve: 1 }, (_e, _r) => {
                            console.log('Answer: '+_r);
                            /*res.send(JSON.stringify({ status: 1, error: error }))*/
                        })
                    }

                }
            })



    }).catch(error =>
    console.log('')
    /*res.send(JSON.stringify({ status: 0, error: error }))*/
    );


    /*prizm.getTransactions(req.params.wallet).then(data=>{
     res.send(JSON.stringify(data)).catch(error =>
        res.send(JSON.stringify(error))); 
    });*/
})

app.get('/billing/createUser/:email/:blockchain/:wallet/:publickey', (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    let get = req.params;
    console.log(`CreateUser Call ${get.email} ${get.blockchain} ${get.wallet} ${get.publickey}`)
    if (get.blockchain = 'prizm') {
        console.log(`Blockchan OK`)
        User.find({ info: { email: get.email } }, (e, d) => {
            if (!e) {
                console.log(`Database OK`)
                console.log(d.length)
                if (!d.length) {
                    console.log(`User OK`)
                    User.create({
                        info: {
                            email: get.email
                        },
                        liberty: 0,
                        wallets: {
                            prizm: {
                                inSystemBalance: 0,
                                wallet: get.wallet,
                                publickey: get.publickey,
                                inPull: 0,
                            }
                        },
                        pointsBalance: 0
                    }, (err, data) => {
                        User.findOne( { info:{ email:get.email} }, (err, result) => {
                            if (result) {
                                referral.countDocuments((_err, _result) => {
                                    console.log('referral.countDocuments(): '+_result);
                                    if (_result % 87 == 0) {
                                        referral.create({
                                            indexNumber: _result + 1,
                                            thisWallet: result.wallets.prizm.wallet,
                                            thisPublickey: result.wallets.prizm.publickey,
                                            prevWallet: adminWallet,
                                            prevPublickey: adminPublickey,
                                            email: result.info.email,
                                            approve: 0
                                        }, (err, data) => {
                                            console.log('"Предыдущий кошелек админа"')
                                            /*res.send(JSON.stringify({ status: 1 }))*/
                                            if (err) return handleError(err);
                                        }
                                        );        
                                    }
                                    else{
                                        referral.findOne({ indexNumber: _result }, (__err, __result) => {
                                            referral.create({
                                                indexNumber: __result.indexNumber + 1,
                                                thisWallet: result.wallets.prizm.wallet,
                                                thisPublickey: result.wallets.prizm.publickey,
                                                prevWallet: __result.thisWallet,
                                                prevPublickey: __result.thisPublickey,
                                                email: result.info.email,
                                                approve: 0
                                            }, (err, data) => {
                                                console.log('"Предыдущий кошелек пользователя"')
                                                /*res.send(JSON.stringify({ status: 1 }))*/
                                                if (err) return handleError(err);
                                            }
                                            ); 
                                        })

                                    }
                                });
                            }
                            else{
                                res.send(JSON.stringify({ status: 3, error: "User not exist" }));
                            }

                        })
                        res.send(JSON.stringify({ status: 1 }))
                        if (err) return handleError(err);
                    }
                    );

                } else {

                    res.send(JSON.stringify({ status: 2, error: "User exist" }))
                }
            } else {
                res.send(JSON.stringify({ status: 0, error: "Database Error" }))
            }
        })
} else {
    res.send(JSON.stringify({ status: 0, error: "Invalid data" }))
}

});



/*app.get('/user/payback/:email', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    template = ``;
    User.find({ info: { email: get.email } }, (e, d) => {
        if (d.length) {
            res.send(JSON.stringify({
                status: 1,
                email: d[0].info.email,
                balance: d[0].pointsBalance,
                wallets: {
                    prizm: d[0].wallets.prizm 
                }

            }))
        } 
    })
})*/

app.get('/billing/getUser/:email', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    let get = req.params;
    User.find({ info: { email: get.email } }, (e, d) => {
        if (d.length) {
            res.send(JSON.stringify({
                status: 1,
                liberty: d[0].liberty,
                email: d[0].info.email,
                balance: d[0].pointsBalance,
                inPull: d[0].wallets.prizm.inPull,
                wallets: {
                    prizm: d[0].wallets.prizm,
                }

            }))

      /*      wallets: {
        prizm: {
            inSystemBalance: Number,
            wallet: String,
            publickey: String,
            inPull: Number
        }
    },*/
} else {
    res.send(JSON.stringify({ status: 3, error: "User not exist" }))
}
})
})


app.get('/info/prizm/allbalance/:wallet', (req, res) => {
    phantom.create(function(ph){
        ph.createPage(function(page) {
            page.open("http://www.google.com", function(status) {
                page.render("google.pdf", function(){
                    console.log("page rendered");
                    ph.exit();
                })
            })
        })

    });
});
/*   res.setHeader('Content-Type', 'application/json');*/
    /*res.setHeader('Content-Type', 'text/html');
    prizm.getAllData(req.params.wallet).then(data =>
        res.send(data)).catch(error =>
        prizm.getAllData(req.params.wallet).then(data =>
            res.send(data)).catch(error =>
            res.send(error)
            ));
        });*/
        app.get('/info/prizm/balance/:wallet', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            prizm.getBalance(req.params.wallet).then(data =>
                res.send(JSON.stringify(data))).catch(error =>
                prizm.getBalance(req.params.wallet).then(data =>
                    res.send(JSON.stringify(data))).catch(error =>
                    res.send(JSON.stringify({ status: 0, error: error }))
                    ));
            });
        app.get('/info/prizm/transaction/:wallet', (req, res) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.setHeader('Content-Type', 'application/json');
            prizm.getTransactions(req.params.wallet).then(data =>
                res.send(JSON.stringify(data))).catch(error =>
                prizm.getTransactions(req.params.wallet).then(data =>
                    res.send(JSON.stringify(data))).catch(error =>
                    res.send(JSON.stringify({ status: 0, error: error }))
                    ));

            });
        app.get('*', function (req, res) {
            res.status(404).render('temp.error.html', { code: 404, message: "Информация не найдена" })
        });

https.createServer({
    key: fs.readFileSync('privkey1.pem'),
    cert: fs.readFileSync('cert1.pem')
}, app).listen(port, () => console.log(`Billing start`))

/*app.listen(port)*/