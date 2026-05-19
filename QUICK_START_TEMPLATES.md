# WhatsApp Templates - Quick Start Guide

## 🚀 Setup (5 minutes)

### Step 1: Configure Environment
Add to your `.env` file:
```env
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here
```

**How to find your Business Account ID:**
1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Navigate to WhatsApp Manager
3. The ID is in the URL or account details

### Step 2: Run Database Migration
```bash
cd backend
psql -U your_user -d your_database -f database/migrations/update_whatsapp_templates_table.sql
```

### Step 3: Restart Backend
```bash
npm run start:dev
```

### Step 4: Sync Templates
```bash
curl -X POST http://localhost:8080/messages/templates/sync \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📋 Common Operations

### List All Templates
```bash
GET /messages/templates
```

### Filter Templates
```bash
# By category
GET /messages/templates?category=UTILITY

# By language
GET /messages/templates?language=en_US

# By type
GET /messages/templates?type=ORDER_STATUS

# Combined
GET /messages/templates?category=UTILITY&language=en_US&type=DEFAULT
```

### Create Simple Template
```bash
POST /messages/templates
Content-Type: application/json

{
  "name": "welcome_message",
  "category": "UTILITY",
  "language": "en_US",
  "components": [
    {
      "type": "BODY",
      "text": "Welcome to Unifesto! We're glad to have you."
    }
  ]
}
```

### Send Template Message
```bash
POST /messages/send-template
Content-Type: application/json

{
  "to": "919876543210",
  "template": {
    "name": "welcome_message",
    "language": { "code": "en_US" }
  }
}
```

## 🎯 Quick Examples

### 1. Order Confirmation (Positional Parameters)
```json
{
  "name": "order_confirm",
  "category": "UTILITY",
  "language": "en_US",
  "parameter_format": "positional",
  "components": [
    {
      "type": "BODY",
      "text": "Hi {{1}}! Order {{2}} confirmed. Total: ₹{{3}}",
      "example": {
        "body_text": [["John", "ORD-123", "999"]]
      }
    }
  ]
}
```

**Send it:**
```json
{
  "to": "919876543210",
  "template": {
    "name": "order_confirm",
    "language": { "code": "en_US" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Sarah" },
          { "type": "text", "text": "ORD-456" },
          { "type": "text", "text": "1,499" }
        ]
      }
    ]
  }
}
```

### 2. OTP Template
```json
{
  "name": "otp_code",
  "category": "AUTHENTICATION",
  "language": "en_US",
  "parameter_format": "positional",
  "components": [
    {
      "type": "BODY",
      "text": "Your OTP is {{1}}. Valid for 10 minutes.",
      "example": {
        "body_text": [["123456"]]
      },
      "add_security_recommendation": true
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "COPY_CODE",
          "text": "Copy Code",
          "example": ["123456"]
        }
      ]
    }
  ]
}
```

**Send it:**
```json
{
  "to": "919876543210",
  "template": {
    "name": "otp_code",
    "language": { "code": "en_US" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "847392" }
        ]
      },
      {
        "type": "button",
        "sub_type": "copy_code",
        "index": "0",
        "parameters": [
          { "type": "coupon_code", "coupon_code": "847392" }
        ]
      }
    ]
  }
}
```

### 3. Marketing with Button
```json
{
  "name": "sale_alert",
  "category": "MARKETING",
  "language": "en_US",
  "parameter_format": "positional",
  "components": [
    {
      "type": "BODY",
      "text": "🎉 {{1}}% OFF on {{2}}! Limited time offer.",
      "example": {
        "body_text": [["30", "Electronics"]]
      }
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "URL",
          "text": "Shop Now",
          "url": "https://unifesto.app/sale"
        }
      ]
    }
  ]
}
```

## 🔍 Template Status

Check template status:
```bash
GET /messages/templates/:id
```

Response includes:
- `meta_status`: APPROVED, PENDING, REJECTED, PAUSED, DISABLED
- `meta_quality_score`: GREEN, YELLOW, RED, UNKNOWN

## ⚠️ Common Issues

### Issue: "Template not found"
**Solution:** Sync templates first
```bash
POST /messages/templates/sync
```

### Issue: "Business Account ID not configured"
**Solution:** Add to `.env`:
```env
WHATSAPP_BUSINESS_ACCOUNT_ID=your_id_here
```

### Issue: "Parameter count mismatch"
**Solution:** Ensure parameters match template definition exactly

### Issue: "Template status is PENDING"
**Solution:** Wait up to 24 hours for Meta review

## 📊 Template Categories

| Category | Use Case | Example |
|----------|----------|---------|
| AUTHENTICATION | OTP, password reset | "Your code is 123456" |
| MARKETING | Promotions, offers | "30% off sale!" |
| UTILITY | Orders, appointments | "Order confirmed" |

## 🎨 Template Types

| Type | Description | Use For |
|------|-------------|---------|
| DEFAULT | Standard messages | Most use cases |
| CATALOGUE | Product catalog | E-commerce |
| FLOWS | Interactive forms | Surveys, bookings |
| ORDER_STATUS | Order updates | Shipping updates |
| ORDER_DETAILS | Payment requests | Checkout |
| CALLING_PERMISSIONS_REQUEST | Call permission | Customer support |

## 📏 Character Limits

- Template name: 512 characters
- Header text: 60 characters
- Body text: 1,024 characters
- Footer text: 60 characters
- Button text: 25 characters

## 🔗 Useful Endpoints

```
GET    /messages/templates              # List templates
GET    /messages/templates/:id          # Get template
POST   /messages/templates              # Create template
POST   /messages/templates/sync         # Sync from Meta
DELETE /messages/templates/:name        # Delete template
POST   /messages/send-template          # Send template message
```

## 📚 Full Documentation

- **Comprehensive Guide**: `WHATSAPP_TEMPLATES.md`
- **Complete Examples**: `WHATSAPP_TEMPLATE_EXAMPLES.md`
- **Update Summary**: `TEMPLATE_UPDATE_SUMMARY.md`

## 💡 Pro Tips

1. **Test First**: Always test templates with a small audience first
2. **Monitor Quality**: Check quality scores regularly
3. **Use Variables**: Personalize messages with parameters
4. **Keep It Short**: Shorter messages have better engagement
5. **Clear CTAs**: Make buttons obvious and actionable
6. **Respect Timing**: Send messages at appropriate times
7. **Handle Opt-outs**: Respect user preferences
8. **Follow Policy**: Comply with WhatsApp Business Policy

## 🆘 Need Help?

1. Check the error message in logs
2. Review template status in Meta Business Manager
3. Verify environment configuration
4. Check full documentation files
5. Test with a simple template first

---

**Ready to send your first template?** Start with the welcome message example above! 🚀
