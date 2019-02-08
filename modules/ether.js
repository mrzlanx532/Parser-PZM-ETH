/*url_contract_balance = "https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=$contractETH&address=$partnerWallet&tag=latest&apikey=VWSYW1WRZQ98SBK8T5DAKDTATD1V8WB922";
contract_balance_query = file_get_contents(url_contract_balance);
contract_balance_query = json_decode( contract_balance_query);*/
const request = require('request');

exports.getBalanceEther = wallet => {

	return new Promise ((resolve, reject) => {
		request({ url: `https://api.etherscan.io/api?module=account&action=balance&address=${wallet}&tag=latest&apikey=VWSYW1WRZQ98SBK8T5DAKDTATD1V8WB922`, jar: true }, (e, r, body) => {
			console.log('gggg');
            if (!e && r.statusCode == 200) {
                try {
                	console.log('Success');
                    resolve(r.body);
                } catch (error) {
                    reject(`Ошибка 1: ${error}`)
                }
            } else {
                reject(`Ошибка 2: ${e}`)
            }
        });

	})
}

exports.getTransactionsEther = wallet => {


    return new Promise ((resolve, reject) => {
        request({ url: `http://api.etherscan.io/api?module=account&action=txlist&address=${wallet}&startblock=0&endblock=99999999&sort=asc&apikey=VWSYW1WRZQ98SBK8T5DAKDTATD1V8WB922`, jar: true }, (e, r, body) => {
            console.log('gggg');
            if (!e && r.statusCode == 200) {
                try {
                    console.log('Success');
                    resolve(r.body);
                } catch (error) {
                    reject(`Ошибка 1: ${error}`)
                }
            } else {
                reject(`Ошибка 2: ${e}`)
            }
        });

    })
}
