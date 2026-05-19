# WhatsApp Webhook Setup Guide

## ✅ Webhook Endpoints Implemented

The backend now has complete webhook support for WhatsApp Cloud API.

### **Endpoints**

#### 1. **Webhook Verification (GET)**
```
GET https://api.unifesto.app/messages/webhook
Query Parameters:
  - hub.mode=subscribe
  - hub.verify_token=un!feSt0@Meta2212
  - hub.challenge=<challenge_string>

Response: Returns the challenge string
```

#### 2. **Webhook Handler (POST)**
```
POST https://api.unifesto.app/messages/webhook
Body: WhatsApp webhook payload

Response: { success: true }
```

---

## 🔧 Meta Dashboard Configuration

### **Step 1: Access WhatsApp Configuration**
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Select your app
3. Navigate to **WhatsApp** → **Configuration**

### **Step 2: Configure Webhook**

#### **Callback URL**
```
https://api.unifesto.app/messages/webhook
```

#### **Verify Token**
```
un!feSt0@Meta2212
```

### **Step 3: Subscribe to Webhook Fields**
Select these fields:
- ✅ **messages** - Receive incoming messages
- ✅ **message_status** - Receive delivery status updates

### **Step 4: Click "Verify and Save"**
Meta will send a GET request to verify your webhook endpoint.

---

## 📋 Webhook Configuration Details

### **From .env file:**
```env
WHATSAPP_PHONE_NUMBER_ID=1064159243455469
WHATSAPP_ACCESS_TOKEN=EAA02tcbuBD0BRfxEJ4DntkqXziaSiGZBB0FPB3A7IMoehWQNCSRwQuXkRpeZBnJGQLRZAMQXW2asfDjiHPkZAbTZA9Cr8ekmAQO5GOGWtLnmKHPFd8qpzmB5BkZBwRtqSKllJdNibhLLaS0wAmRn2t5BYJcFrKZADFZC3ZCpaZC8g1P5YkouZAy2JHKQ1vjvjMdJ1x1wswLyO0w3egZCL5gmZCHHZB2I1IjzxukpHtcYMd91j9ZBpPJ5ZAQ8ZBMo3TJHmIYyzTVs3DAkcLgxMUsXbTM3MhaEGhXrd
WHATSAPP_WEBHOOK_SECRET=un!feSt0@Meta2212
```

### **Important URLs:**
- **Callback URL**: `https://api.unifesto.app/messages/webhook`
- **Verify Token**: `un!feSt0@Meta2212`

---

## 🔍 How It Works

### **Verification Flow (GET)**
```
1. Meta sends GET request with:
   - hub.mode=subscribe
   - hub.verify_token=un!feSt0@Meta2212
   - hub.challenge=random_string

2. Backend checks if verify_token matches

3. If valid, returns hub.challenge

4. Meta confirms webhook is verified ✅
```

### **Message Flow (POST)**
```
1. User sends WhatsApp message
   ↓
2. Meta sends POST to webhook
   ↓
3. Backend receives payload
   ↓
4. Stores message in database
   ↓
5. Returns { success: true }
```

### **Status Update Flow (POST)**
```
1. Message status changes (sent → delivered → read)
   ↓
2. Meta sends POST to webhook
   ↓
3. Backend receives status update
   ↓
4. Updates message in database
   ↓
5. Returns { success: true }
```

---

## 📊 Webhook Payload Examples

### **Incoming Message**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15550000000",
          "phone_number_id": "1064159243455469"
        },
        "contacts": [{
          "profile": {
            "name": "John Doe"
          },
          "wa_id": "919876543210"
        }],
        "messages": [{
          "from": "919876543210",
          "id": "wamid.HBgNOTE5MTIzNDU2Nzg5FQIAERgSMzQ1Njc4OTAxMjM0NTY3ODkA",
          "timestamp": "1234567890",
          "text": {
            "body": "Hello from user!"
          },
          "type": "text"
        }]
      },
      "field": "messages"
    }]
  }]
}
```

### **Status Update**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15550000000",
          "phone_number_id": "1064159243455469"
        },
        "statuses": [{
          "id": "wamid.HBgNOTE5MTIzNDU2Nzg5FQIAERgSMzQ1Njc4OTAxMjM0NTY3ODkA",
          "status": "delivered",
          "timestamp": "1234567890",
          "recipient_id": "919876543210"
        }]
      },
      "field": "messages"
    }]
  }]
}
```

---

## 🧪 Testing Webhook

### **1. Test Verification (Manual)**
```bash
curl -X GET "https://api.unifesto.app/messages/webhook?hub.mode=subscribe&hub.verify_token=un!feSt0@Meta2212&hub.challenge=test123"

# Expected Response: test123
```

### **2. Test from Meta Dashboard**
1. Go to WhatsApp Configuration
2. Click "Test" button next to webhook
3. Select "messages" or "message_status"
4. Click "Send Test"
5. Check backend logs

### **3. Test with Real Message**
1. Send a WhatsApp message to your business number
2. Check backend logs for webhook payload
3. Verify message is stored in database
4. Check frontend inbox for new message

---

## 📝 Backend Logs

The webhook handler logs everything:

```
[WhatsAppController] Webhook verification request received
[WhatsAppController] Mode: subscribe, Token: un!feSt0@Meta2212
[WhatsAppController] Webhook verified successfully

[WhatsAppController] Webhook payload received
[WhatsAppService] Processing webhook payload
[WhatsAppService] Processing 1 incoming messages
[WhatsAppService] Stored incoming message from 919876543210

[WhatsAppService] Processing 1 status updates
[WhatsAppService] Updated message wamid.xxx status to delivered
```

---

## 🔐 Security

### **Verification Token**
- ✅ Stored in environment variable
- ✅ Checked on every verification request
- ✅ Prevents unauthorized webhook registration

### **Webhook Secret**
- ✅ Used for verification
- ✅ Never exposed in code
- ✅ Configurable per environment

### **Error Handling**
- ✅ Always returns 200 to prevent retries
- ✅ Logs all errors
- ✅ Graceful failure handling

---

## 🚀 Deployment Checklist

### **Before Configuring Webhook:**
- [ ] Backend is deployed to production
- [ ] HTTPS is enabled (required by Meta)
- [ ] Environment variables are set
- [ ] Database migration is run
- [ ] Backend is accessible at `https://api.unifesto.app`

### **Configure in Meta Dashboard:**
- [ ] Add callback URL: `https://api.unifesto.app/messages/webhook`
- [ ] Add verify token: `un!feSt0@Meta2212`
- [ ] Subscribe to: messages, message_status
- [ ] Click "Verify and Save"
- [ ] Test webhook from dashboard

### **Verify Setup:**
- [ ] Webhook shows as "Verified" in Meta dashboard
- [ ] Send test message from Meta dashboard
- [ ] Check backend logs
- [ ] Verify message in database
- [ ] Check frontend inbox

---

## 🐛 Troubleshooting

### **Webhook Verification Fails**
**Problem**: Meta shows "Verification failed"

**Solutions**:
1. Check backend is running and accessible
2. Verify HTTPS is enabled
3. Check verify token matches exactly: `un!feSt0@Meta2212`
4. Check backend logs for errors
5. Test manually with curl command

### **No Webhooks Received**
**Problem**: Messages sent but no webhook received

**Solutions**:
1. Check webhook is subscribed to correct fields
2. Verify app is published (or in test mode)
3. Check backend logs
4. Test with Meta dashboard test button
5. Verify firewall allows Meta IPs

### **Messages Not Stored**
**Problem**: Webhook received but not in database

**Solutions**:
1. Check database migration is run
2. Verify RLS policies allow insert
3. Check backend logs for database errors
4. Verify Supabase connection

---

## 📊 Monitoring

### **What to Monitor:**
1. **Webhook Success Rate** - Should be ~100%
2. **Message Storage Rate** - All messages should be stored
3. **Status Update Rate** - All status changes should be captured
4. **Error Logs** - Should be minimal

### **Key Metrics:**
- Webhooks received per day
- Messages stored per day
- Status updates per day
- Failed webhook processing

---

## ✅ Summary

**Webhook Status**: ✅ Fully Implemented

**Configuration**:
- Callback URL: `https://api.unifesto.app/messages/webhook`
- Verify Token: `un!feSt0@Meta2212`
- Subscriptions: messages, message_status

**Features**:
- ✅ Webhook verification (GET)
- ✅ Incoming message handling (POST)
- ✅ Status update handling (POST)
- ✅ Database storage
- ✅ Error handling
- ✅ Logging

**Next Steps**:
1. Configure webhook in Meta dashboard
2. Test verification
3. Send test message
4. Verify in database and frontend

**Your webhook is ready to receive WhatsApp messages!** 🎉
