"use strict"
const { create, updateOne, findOne, findByIndex } = require("../../../src/helpers/dynamo")

describe("Tests search", async function () {
    it("test dynamo helper function", async () => {
        try {
            const item = {
                // attr1: 3,
                // attr2: "three",
                // attr3: new Date().toISOString(),
                // attr4: 1.787778,
                attr5: "sssssssss",
                pk: "#mypk:34567",
                sk: "#mysk:34567"
            }

            const response1 = await create( { item } )
            console.log( response1 )
            
            const response2 = await updateOne( { pk: "#mypk:34567", sk: "#mysk:34567", item } )
            console.log( response2 )

            const response3 = await  findByIndex({ indexName: "email-index", query: { email: "s.torrefranca@gmail.com" }, filter: {} })
            console.log( response3 )
        } catch (error) {
            console.error(error)
        }
    }).timeout(100000)
})
