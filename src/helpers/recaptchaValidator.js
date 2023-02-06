const axios = require('axios')

//V3
const getRecaptchaScore = (recaptcha) => {
    const SECRET = {  }
    const URL = `https://www.google.com/recaptcha/api/siteverify?`
    const requestUri = `${URL}&secret=${SECRET}&response=${recaptcha}`
    const configParam = { headers: { 'Content-Type': 'application/json' } }
    return axios.post(requestUri, configParam).then(result => {
        if (result.data.success === true) {
            return result.data.score
        } else {
            return -1
        }
    }).catch(error => {
        console.error("v3 error::", error)
        return false
    })
}

module.exports = getRecaptchaScore