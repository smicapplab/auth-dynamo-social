"use strict"

process.env.TokenSecret = "mysecret"
process.env.SingleDynamoTable = "steve-db-develop"

const { sendMessageInfobip } = require("../../../src/helpers/infoBip")

describe("Tests accounts", async function () {
    it("test dynamo helper function", async () => {
        try {
            await sendMessageInfobip("test infoBIP", "09178540981")
        } catch (error) {
            console.error(error)
        }
    }).timeout(100000)
})
