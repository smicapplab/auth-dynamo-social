#!/bin/bash

if [ ! -z $1 ]
then
    ENVIRONMENT=$1
    CONFIG_ENVIRONMENT=$1
else
    ENVIRONMENT=local
    CONFIG_ENVIRONMENT=develop
fi

S3_BUCKET="aws-sam-cli-managed-default-samclisourcebucket-1ekkpwvsstvqr"
if [ $ENVIRONMENT == "production" ]
then
    S3_BUCKET="aws-sam-cli-managed-default-samclisourcebucket-mvhledjcscwr"
fi

parameters=$(cat .env.$CONFIG_ENVIRONMENT.json | jq -r '.Parameters')

parameterValues () {
    value=$(echo $parameters | jq -r '.'$1)
    echo $value
}

parameterOverides="CIEnvironment=true "
parameterKeys=$(echo "$parameters" | jq -r 'keys | .[]')
for item in ${parameterKeys[@]}; do
    parameterOverides+="$item=$(parameterValues $item) "
done

parameterOverides+="NodeEnv=$ENVIRONMENT"

npm install --prefix ./layers/nodejs/ ./layers/nodejs/

echo $parameterOverides

aws cloudformation package --region ap-southeast-1 \
    --template-file template.yaml \
    --s3-bucket $S3_BUCKET \
    --s3-prefix steve-auth-api \
    --output-template-file template.json 

aws cloudformation deploy \
    --template-file template.json \
    --stack-name steve-auth-api-$ENVIRONMENT \
    --parameter-overrides $parameterOverides \
    --no-fail-on-empty-changeset \
    --s3-prefix steve-auth-api \
    --region ap-southeast-1 \
    --capabilities CAPABILITY_IAM
