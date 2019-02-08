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