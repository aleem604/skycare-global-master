#!/bin/sh

EXPIRED_EMAIL_STYLE="color: red; font-weight: bold; text-transform: uppercase;"
EMAIL_TEMPLATE_ID="d-a17ef499184d4baa97a3ccc65c747f23"
SENDGRID_API_KEY="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"
FROM_EMAIL_ADDRESS="quote@skycareglobal.com"

# Make sure that the JSON parser is installed
JQ_IS_PRESENT=$(jq --version 2>&1 | grep -c "jq-")
if [ $JQ_IS_PRESENT -eq 0 ]; then
    sudo yum install jq
else
    echo "JQ is already installed"
fi

# Retrieve the list of escorts with expiring credentials
EXPIRED_CREDS="$(curl -Gs -H 'Authorization:Basic YWRtaW46cGFzcw==' http://localhost:8080/skycare/_design/escorts/_view/expiringCredentials)"

# Determine how many escorts we are processing
TOTAL_ESCORTS=$(echo "$EXPIRED_CREDS" | jq .total_rows)

# Loop through each escort and decide what we are doing with each one
COUNTER=0;
while [ "$COUNTER" -lt $(expr $TOTAL_ESCORTS '-' 1) ];
do

    ESCORT_ID=$(echo "$EXPIRED_CREDS" | jq .rows[$COUNTER].key[0])
    ESCORT_PAIR_INDEX=$(echo "$EXPIRED_CREDS" | jq .rows[$COUNTER].key[1])

    if [ $ESCORT_PAIR_INDEX -eq "0" ]; then
        NEXT_COUNTER=$(expr $COUNTER '+' 1)
        NEXT_ESCORT_ID=$(echo "$EXPIRED_CREDS" | jq .rows[$NEXT_COUNTER].key[0])
        NEXT_ESCORT_PAIR_INDEX=$(echo "$EXPIRED_CREDS" | jq .rows[$NEXT_COUNTER].key[1])

        if [ $ESCORT_ID = $NEXT_ESCORT_ID ]; then

            ML_EXPIRED=$(echo "$EXPIRED_CREDS" | jq .rows[$COUNTER].value.licenseIsExpired)
            ML_EXPIRE_DATE=$(echo "$EXPIRED_CREDS" | jq .rows[$COUNTER].value.licenseExpiration)
            if [ $ML_EXPIRE_DATE = "null" ]; then
                ML_EXPIRE_DATE="MISSING"
            else
                ML_EXPIRE_DATE=$(echo $ML_EXPIRE_DATE | sed -e 's/"//g' | sed -e 's/T[0-9]*:[0-9]*:[0-9]*\.[0-9]*Z//g')
            fi
            ML_EXPIRED_STYLE=""
            if [ $ML_EXPIRED = "true" ]; then
                ML_EXPIRED_STYLE=$EXPIRED_EMAIL_STYLE
            fi

            ALS_EXPIRED=$(echo "$EXPIRED_CREDS" | jq .rows[$COUNTER].value.alsIsExpired)
            ALS_EXPIRE_DATE=$(echo "$EXPIRED_CREDS" | jq .rows[$COUNTER].value.alsExpiration)
            if [ $ALS_EXPIRE_DATE = "null" ]; then
                ALS_EXPIRE_DATE="MISSING"
            else
                ALS_EXPIRE_DATE=$(echo $ALS_EXPIRE_DATE | sed -e 's/"//g' | sed -e 's/T[0-9]*:[0-9]*:[0-9]*\.[0-9]*Z//g')
            fi
            ALS_EXPIRED_STYLE=""
            if [ $ALS_EXPIRED = "true" ]; then
                ALS_EXPIRED_STYLE=$EXPIRED_EMAIL_STYLE
            fi

            PASS_EXPIRED=$(echo "$EXPIRED_CREDS" | jq .rows[$COUNTER].value.passportIsExpired)
            PASS_EXPIRE_DATE=$(echo "$EXPIRED_CREDS" | jq .rows[$COUNTER].value.passportExpiration)
            if [ $PASS_EXPIRE_DATE = "null" ]; then
                PASS_EXPIRE_DATE="MISSING"
            else
                PASS_EXPIRE_DATE=$(echo $PASS_EXPIRE_DATE | sed -e 's/"//g' | sed -e 's/T[0-9]*:[0-9]*:[0-9]*\.[0-9]*Z//g')
            fi
            PASS_EXPIRED_STYLE=""
            if [ $PASS_EXPIRED = "true" ]; then
                PASS_EXPIRED_STYLE=$EXPIRED_EMAIL_STYLE
            fi

            ESCORT_EMAIL=$(echo "$EXPIRED_CREDS" | jq .rows[$NEXT_COUNTER].value.email)

            MAILDATA='{ "personalizations": [
                            {
                             	"to": [{"email": '${ESCORT_EMAIL}'}],
                                "dynamic_template_data": {
                                    "ML_EXPIRED_STYLE": "'${ML_EXPIRED_STYLE}'",
                                    "ML_EXPIRED": '${ML_EXPIRED}',
                                    "ALS_EXPIRED_STYLE": "'${ALS_EXPIRED_STYLE}'",
                                    "ALS_EXPIRED": '${ALS_EXPIRED}',
                                    "PASS_EXPIRED_STYLE": "'${PASS_EXPIRED_STYLE}'",
                                    "PASS_EXPIRED": '${PASS_EXPIRED}',
                                    "ML_EXPIRE_DATE": "'${ML_EXPIRE_DATE}'",
                                    "ALS_EXPIRE_DATE": "'${ALS_EXPIRE_DATE}'",
                                    "PASS_EXPIRE_DATE": "'${PASS_EXPIRE_DATE}'"
                                }
                            }
                        ],
                        "from": {"email": "'${FROM_EMAIL_ADDRESS}'", "name": "Skycare Global"},
                        "template_id": "'${EMAIL_TEMPLATE_ID}'"
                      }'

            echo ""
            echo "Sending an email for expired credentials for $ESCORT_EMAIL..."
            echo ""
            echo ""
            echo $MAILDATA

            curl --request POST \
                --url https://api.sendgrid.com/v3/mail/send \
                --header 'Authorization: Bearer '$SENDGRID_API_KEY \
                --header 'Content-Type: application/json' \
                --data "'$MAILDATA'"

        fi
    fi

    ((COUNTER++));
done

