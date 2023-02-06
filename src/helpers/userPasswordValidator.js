const userPasswordValidator = password => {
    let charCategoriesHits = 0
    const withNumber = str => str.search(/\d/) >= 0
    const withUppercaseLetter = str => str.search(/[A-Z]/) >= 0
    const withLowercaseLetter = str => str.search(/[a-z]/) >= 0
    const withSpecialChar = str =>
        str.search(
            /[\~\!\@\#\$\%\^\&\*\_\-\+\=\`\|\\\(\)\{\}\[\]\:\;\"\'\<\>\,\.\?\/]/,
        ) >= 0

    if (!password) {
        return {
            isValid: false,
            error: "Password must consist of at least 8 characters",
        }
    }

    if (password.length < 8) {
        return {
            isValid: false,
            error: "Password must consist of at least 8 characters",
        }
    }

    if (withNumber(password)) {
        charCategoriesHits += 1
    }

    if (withUppercaseLetter(password)) {
        charCategoriesHits += 1
    }

    if (withLowercaseLetter(password)) {
        charCategoriesHits += 1
    }

    if (withSpecialChar(password)) {
        charCategoriesHits += 1
    }

    if (charCategoriesHits < 3) {
        return {
            isValid: false,
            error: `Password should contain characters from three of the following categories: (1) Uppercase Letters (A-Z), (2) Lowercase Letters (a-z), (3) Numbers (0-9), (4) Special Characters (~!@#$%^&*_-+=\`|\\(){}[]:;"'<>,.?/)`,
        }
    }

    return { isValid: true }
}

module.exports = userPasswordValidator  