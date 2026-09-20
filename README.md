# **DevPay**

A developer-first UPI payment intent sandbox and cross-device testing gateway built on AWS serverless architecture.

## **Overview**

Integrating mobile UPI payments in India typically forces developers through days or weeks of merchant KYC validation, aggregation approval, and complex SDK setups before they can test a single client-side payment flow.

**DevPay** solves this cold-start problem by providing a zero-KYC testing sandbox. It compiles standard NPCI UPI parameters into device-specific deep link URIs, simulates transactions, fires outbound signed webhooks, and synchronizes payment state across desktop and mobile in real time using an AWS serverless backend.

### **AWS Service Utilization**

* **AWS Amplify Hosting:** Serves the React \+ Vite single-page application from edge locations with automated continuous deployment from GitHub, zero-config SSL, and custom rewrite rules.  
* **Amazon API Gateway:** Provides a low-latency HTTP REST API with route wildcarding (/{proxy+}) and integrated CORS preflight management.  
* **AWS Lambda (Python 3.14):** Executes stateless compute logic for payment intent persistence, transaction state mutation, and asynchronous outbound HTTP webhook dispatching.  
* **Amazon DynamoDB:** Stores intent state (PENDING $\\rightarrow$ SUCCESS) with single-digit millisecond latency to power cross-device polling between mobile and desktop clients without requiring dedicated socket servers.

## **Key Features**

* **Multi-Protocol Deep Link Compilation:** Formulates compliant payment payloads for:  
  * **Android Intents:** intent://pay?...\#Intent;scheme=upi;package=...;end  
  * **iOS URL Schemes:** gpay://pay?..., phonepe://pay?..., paytmmp://pay?..., bhim://pay?...  
  * **Generic UPI Fallback:** Standard upi://pay?... query string  
* **Cross-Device State Synchronization:** Open a transaction on desktop, switch to the "Open on Mobile" tab, scan the QR with any smartphone camera, and simulate payment on mobile. The desktop screen updates to **Payment Successful** in real time via DynamoDB.  
* **Automated Webhook Dispatch:** Enter a custom endpoint (such as \[https://webhook.site/\](https://webhook.site/)... or your backend route). When a transaction is marked as successful, Lambda executes an outbound POST request with transaction metadata.  
* **Zero-Dependency Component Export:** Generate and download a standalone, customizable DevPayGateway.tsx file pre-populated with your current form inputs.

## **Repository Structure**

```Plaintext
devpay/  
├── backend/  
│   └── lambda-function.py     \# AWS Lambda routing, DynamoDB operations & webhook engine  
├── devpay-frontend/           \# React \+ Vite \+ Tailwind CSS frontend application  
│   ├── public/  
│   │   └── icon.png  
│   ├── src/  
│   │   ├── assets/  
│   │   ├── types/  
│   │   │   └── payment.ts     \# Type interfaces & UPI app handler targets  
│   │   ├── App.tsx            \# Gateway demo & Sandbox routing logic  
│   │   ├── config.ts          \# API Gateway invocation endpoint  
│   │   ├── DevPayGateway.tsx  \# Cross-device checkout modal & polling client  
│   │   ├── DevPaySandbox.tsx  \# Interactive payload compiler & testing dashboard  
│   │   ├── index.css  
│   │   └── main.tsx  
│   ├── index.html  
│   ├── package.json  
│   ├── tsconfig.json  
│   └── vite.config.ts  
└── README.md
```

## **API Reference**

Base Endpoint: \[https://u7e7ugonq0.execute-api.us-east-1.amazonaws.com\](https://u7e7ugonq0.execute-api.us-east-1.amazonaws.com)

### **1\. Create Payment Intent**

* **Method:** POST  
* **Path:** /intents  
* **Request Body:**  
  JSON  
  {  
  &nbsp;&nbsp;"id": "TXN\_123456",  
  &nbsp;&nbsp;"pa": "merchant@okaxis",  
  &nbsp;&nbsp;"pn": "Demo Store",  
  &nbsp;&nbsp;"am": "100.00",  
  &nbsp;&nbsp;"tn": "Order \#42",  
  &nbsp;&nbsp;"webhookUrl": "https://httpbin.org/post"  
  }

* **Response:** 201 Created

### **2\. Fetch Intent Status**

* **Method:** GET  
* **Path:** /intents/{id}  
* **Response:** 200 OK  
  JSON  
  {  
  &nbsp;&nbsp;"id": "TXN\_123456",  
  &nbsp;&nbsp;"pa": "merchant@okaxis",  
  &nbsp;&nbsp;"pn": "Demo Store",  
  &nbsp;&nbsp;"am": "100.00",  
  &nbsp;&nbsp;"tn": "Order \#42",  
  &nbsp;&nbsp;"status": "PENDING",  
  &nbsp;&nbsp;"createdAt": "2026-09-20T12:00:00.000000"  
  }

### **3\. Simulate Payment Success & Trigger Webhook**

* **Method:** POST  
* **Path:** /intents/{id}/simulate  
* **Response:** 200 OK  
  JSON  
  {  
  &nbsp;&nbsp;"success": true,  
  &nbsp;&nbsp;"id": "TXN\_123456",  
  &nbsp;&nbsp;"status": "SUCCESS",  
  &nbsp;&nbsp;"webhook": "DELIVERED\_200"  
  }

## **Local Development**

### **Prerequisites**

* Node.js 18+  
* npm 9+

### **Installation & Run**

> 1. Clone the repository:  
>    Bash  
>    git clone https://github.com/yash-g01/devpay.git  
>    cd devpay/devpay-frontend

> 2. Install dependencies:  
>    Bash  
>    npm install

> 3. Start the Vite development server with local network access:  
>    Bash  
>    npm run dev \-- \--host

> 4. Open the displayed **Network URL** (e.g., \[http://192.168.\](http://192.168.)x.x:5173) on your desktop browser to enable smartphone QR scanning across your local Wi-Fi.

## **AWS Deployment Guide**

### **DynamoDB**

> 1. Create a table named devpay\_intents.  
> 2. Set Partition Key to id (String).

### **AWS Lambda**

> 1. Create a Lambda function with runtime **Python 3.14** (or 3.12).  
> 2. Attach IAM Policy: AmazonDynamoDBFullAccess\_v2.  
> 3. Copy the code from backend/lambda-function.py into the Lambda editor and click **Deploy**.

### **Amazon API Gateway**

> 1. Create an **HTTP API** named devpay-api.  
> 2. Add a Lambda Integration pointing to devpay-handler.  
> 3. Configure route: ANY /{proxy+}.  
> 4. Enable CORS:  
   * **Access-Control-Allow-Origin:** \*  
   * **Access-Control-Allow-Methods:** GET, POST, OPTIONS  
   * **Access-Control-Allow-Headers:** Content-Type

### **AWS Amplify Hosting**

> 1. Connect your GitHub repository to Amplify Hosting.  
> 2. In build settings, point the monorepo root to devpay-frontend with build commands:  
>    YAML  
>    version: 1  
>    frontend:  
>    &nbsp;&nbsp;phases:  
>    &nbsp;&nbsp;&nbsp;&nbsp;preBuild:  
>    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;commands:  
>    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\- cd devpay-frontend  
>    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\- npm ci  
>    &nbsp;&nbsp;&nbsp;&nbsp;build:  
>    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;commands:  
>    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\- npm run build  
>    &nbsp;&nbsp;artifacts:  
>    &nbsp;&nbsp;&nbsp;&nbsp;baseDirectory: devpay-frontend/dist  
>    &nbsp;&nbsp;&nbsp;&nbsp;files:  
>    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\- '\*\*/\*'  
>    &nbsp;&nbsp;cache:  
>    &nbsp;&nbsp;&nbsp;&nbsp;paths:  
>    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\- devpay-frontend/node\_modules/\*\*/\*

> 3. Under **Rewrites and redirects**, add:  
   * **Source:** \</^\[^.\]+$|\\.(?\!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)(\[^.\]+$)/\>  
   * **Target:** /index.html  
   * **Status:** 200