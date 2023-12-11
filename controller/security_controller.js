const helper = require("../helpers")
const securityHandler = require("../handler/security_handler")


// "/login/category"?category=private&appName=GC2
const login = (req, res) => {
    const { countryCode, phone, password } = req.body;
    let countryDetails = helper.countryCodeISD(countryCode)
    if (countryDetails) {
        if (helper.validate_phone_number(countryCode, phone)) {
            securityHandler.login(countryDetails, phone, password, res)
        } else {
            return res.status(400).send(
                {
                    "errors": "Enter Valid Phone Number",
                    "status": 400 
                }
            )
        }
    } else {
        return res.status(400).send(
            {
                "errors": "Select Valid Country Code",
                "status": 400 
            }
        )
    }
}



module.exports = {login}