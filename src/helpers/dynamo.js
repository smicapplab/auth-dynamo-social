const { DynamoDBClient } = require("@aws-sdk/client-dynamodb")
const { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb")
const config = require("./config")

const { SingleDynamoTable } = config

const marshallOptions = {
    convertEmptyValues: false,
    removeUndefinedValues: false,
    convertClassInstanceToMap: false,
};

const unmarshallOptions = {
    wrapNumbers: false,
};

const translateConfig = { marshallOptions, unmarshallOptions };

const dynamoClient = new DynamoDBClient()
let documentClient = DynamoDBDocumentClient.from(dynamoClient, translateConfig)


const create = async ({ item }) => {
    const params = {
        Item: item,
        TableName: SingleDynamoTable
    }

    try {
        const response = await documentClient.send(new PutCommand(params))
        return response
    } catch (error) {
        throw new Error(error.stack)
    }
}

const updateOne = async ({ item }) => {
    const itemKeys = Object.keys(item).filter(k => (k !== "pk" && k !== "sk"));
    const params = {
        TableName: SingleDynamoTable,
        UpdateExpression: `SET ${itemKeys.map((k, index) => `#field${index} = :value${index}`).join(', ')}`,
        ExpressionAttributeNames: itemKeys.reduce((accumulator, k, index) => ({
            ...accumulator,
            [`#field${index}`]: k
        }), {}),
        ExpressionAttributeValues: itemKeys.reduce((accumulator, k, index) => ({
            ...accumulator,
            [`:value${index}`]: item[k]
        }), {}),
        Key: {
            pk: item["pk"],
            sk: item["sk"]
        },
        ReturnValues: 'ALL_NEW'
    }

    const response = await documentClient.send(new UpdateCommand(params))
    return response
}

const findByIndex = async ({ indexName, query, filter, limit }) => {
    const queryKeys = Object.keys(query)
    let params = {
        TableName: SingleDynamoTable,
        IndexName: indexName,
        KeyConditionExpression: `${queryKeys.map((k, index) => `${k} = :value${index}`).join(', ')}`,
        ExpressionAttributeValues: queryKeys.reduce((accumulator, k, index) => ({
            ...accumulator,
            [`:value${index}`]: query[k]
        }), {}),
    };

    if( limit ){
        params["Limit"] = limit
    }

    console.log({ params })
    const data = await documentClient.send(new QueryCommand(params));
    return data
}

const findOne = async ({ pk, sk }) => {
    const params = {
        TableName: SingleDynamoTable,
        Key: {
            pk, sk
        },
    };

    const data = await documentClient.send(new GetCommand(params));
    return data
}


module.exports = { create, updateOne, findOne, findByIndex }