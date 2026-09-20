import json
import boto3
import urllib.request
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('devpay_intents')

def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        },
        "body": json.dumps(body)
    }

def lambda_handler(event, context):
    http_method = event.get('requestContext', {}).get('http', {}).get('method', '')
    path = event.get('rawPath', '')

    # Handle CORS preflight
    if http_method == 'OPTIONS':
        return response(200, {"message": "OK"})

    # 1. CREATE PAYMENT INTENT: POST /intents
    if http_method == 'POST' and path == '/intents':
        try:
            payload = json.loads(event.get('body', '{}'))
            intent_id = payload.get('id') or f"TXN_{int(datetime.utcnow().timestamp())}"
            
            item = {
                "id": intent_id,
                "pa": payload.get('pa', ''),
                "pn": payload.get('pn', ''),
                "am": str(payload.get('am', '0.00')),
                "tn": payload.get('tn', ''),
                "webhookUrl": payload.get('webhookUrl', ''),
                "status": "PENDING",
                "createdAt": datetime.utcnow().isoformat()
            }
            table.put_item(Item=item)
            return response(201, {"success": True, "intent": item})
        except Exception as e:
            return response(500, {"error": str(e)})

    # 2. GET INTENT STATUS: GET /intents/{id}
    if http_method == 'GET' and '/intents/' in path:
        intent_id = path.split('/')[-1]
        try:
            res = table.get_item(Key={"id": intent_id})
            item = res.get('Item')
            if not item:
                return response(404, {"error": "Intent not found"})
            return response(200, item)
        except Exception as e:
            return response(500, {"error": str(e)})

    # 3. SIMULATE SUCCESS & FIRE WEBHOOK: POST /intents/{id}/simulate
    if http_method == 'POST' and '/simulate' in path:
        parts = path.strip('/').split('/')
        intent_id = parts[1] # /intents/{id}/simulate
        try:
            # Fetch existing or create fallback record
            res = table.get_item(Key={"id": intent_id})
            item = res.get('Item', {})

            # Upsert status in DynamoDB (creates item if it didn't exist)
            table.update_item(
                Key={"id": intent_id},
                UpdateExpression="SET #st = :s, completedAt = :c, pa = if_not_exists(pa, :p), am = if_not_exists(am, :a)",
                ExpressionAttributeNames={"#st": "status"},
                ExpressionAttributeValues={
                    ":s": "SUCCESS",
                    ":c": datetime.utcnow().isoformat(),
                    ":p": item.get('pa', 'merchant@okaxis'),
                    ":a": item.get('am', '10.00')
                }
            )

            # Fire webhook if configured
            webhook_url = item.get('webhookUrl')
            webhook_status = "NOT_CONFIGURED"
            
            if webhook_url and webhook_url.startswith("http"):
                webhook_payload = json.dumps({
                    "event": "payment.success",
                    "id": intent_id,
                    "amount": item.get('am', '10.00'),
                    "vpa": item.get('pa', 'merchant@okaxis'),
                    "status": "SUCCESS",
                    "timestamp": datetime.utcnow().isoformat()
                }).encode('utf-8')

                req = urllib.request.Request(
                    webhook_url,
                    data=webhook_payload,
                    headers={'Content-Type': 'application/json', 'User-Agent': 'DevPay-Webhook-Agent/1.0'},
                    method='POST'
                )
                try:
                    with urllib.request.urlopen(req, timeout=5) as hook_res:
                        webhook_status = f"DELIVERED_{hook_res.status}"
                except Exception as hook_err:
                    webhook_status = f"FAILED_{str(hook_err)}"

            return response(200, {
                "success": True,
                "id": intent_id,
                "status": "SUCCESS",
                "webhook": webhook_status
            })
        except Exception as e:
            return response(500, {"error": str(e)})
