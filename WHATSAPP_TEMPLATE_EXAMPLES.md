# WhatsApp Template Examples

Complete examples for all template types based on Meta's WhatsApp Business Platform.

## Table of Contents
1. [Marketing Templates](#marketing-templates)
2. [Utility Templates](#utility-templates)
3. [Authentication Templates](#authentication-templates)
4. [Template Types](#template-types)

---

## Marketing Templates

### 1. Default Marketing Template with Image Header

```json
{
  "name": "flash_sale_announcement",
  "category": "MARKETING",
  "template_type": "DEFAULT",
  "language": "en_US",
  "parameter_format": "named",
  "components": [
    {
      "type": "HEADER",
      "format": "IMAGE",
      "example": {
        "header_handle": ["<IMAGE_MEDIA_HANDLE>"]
      }
    },
    {
      "type": "BODY",
      "text": "🎉 Flash Sale Alert!\n\nHi {{customer_name}}, get {{discount}}% off on {{product_category}}!\n\nOffer valid until {{expiry_date}}. Shop now and save big!",
      "example": {
        "body_text_named_params": [
          { "param_name": "customer_name", "example": "Sarah" },
          { "param_name": "discount", "example": "30" },
          { "param_name": "product_category", "example": "Electronics" },
          { "param_name": "expiry_date", "example": "Dec 31" }
        ]
      }
    },
    {
      "type": "FOOTER",
      "text": "Terms and conditions apply"
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "URL",
          "text": "Shop Now",
          "url": "https://unifesto.app/sale"
        },
        {
          "type": "QUICK_REPLY",
          "text": "Remind me later"
        }
      ]
    }
  ]
}
```

### 2. Catalogue Template

```json
{
  "name": "product_catalogue",
  "category": "MARKETING",
  "template_type": "CATALOGUE",
  "language": "en_US",
  "parameter_format": "positional",
  "components": [
    {
      "type": "BODY",
      "text": "Hi {{1}}! Check out our latest collection of {{2}}. We have amazing deals waiting for you!",
      "example": {
        "body_text": [["John", "smartphones"]]
      }
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "CATALOG",
          "text": "View Catalog"
        }
      ]
    }
  ]
}
```

### 3. Marketing with Flow

```json
{
  "name": "survey_request",
  "category": "MARKETING",
  "template_type": "FLOWS",
  "language": "en_US",
  "parameter_format": "positional",
  "components": [
    {
      "type": "BODY",
      "text": "Hi {{1}}! We'd love to hear your feedback. Please take a moment to complete our quick survey.",
      "example": {
        "body_text": [["Sarah"]]
      }
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "FLOW",
          "text": "Take Survey",
          "flow_id": "YOUR_FLOW_ID",
          "flow_action": "navigate"
        }
      ]
    }
  ]
}
```

---

## Utility Templates

### 1. Order Confirmation (Default)

```json
{
  "name": "order_confirmation",
  "category": "UTILITY",
  "template_type": "DEFAULT",
  "language": "en_US",
  "parameter_format": "named",
  "message_send_ttl_seconds": 300,
  "components": [
    {
      "type": "HEADER",
      "format": "TEXT",
      "text": "Order Confirmed ✅"
    },
    {
      "type": "BODY",
      "text": "Hi {{customer_name}}!\n\nYour order {{order_number}} has been confirmed.\n\nTotal: ₹{{amount}}\nExpected delivery: {{delivery_date}}",
      "example": {
        "body_text_named_params": [
          { "param_name": "customer_name", "example": "John" },
          { "param_name": "order_number", "example": "ORD-12345" },
          { "param_name": "amount", "example": "2,499" },
          { "param_name": "delivery_date", "example": "Dec 25" }
        ]
      }
    },
    {
      "type": "FOOTER",
      "text": "Thank you for shopping with us!"
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "URL",
          "text": "Track Order",
          "url": "https://unifesto.app/track/{{1}}",
          "example": ["ORD-12345"]
        },
        {
          "type": "PHONE_NUMBER",
          "text": "Call Support",
          "phone_number": "+919876543210"
        }
      ]
    }
  ]
}
```

### 2. Order Status Update

```json
{
  "name": "order_shipped",
  "category": "UTILITY",
  "template_type": "ORDER_STATUS",
  "language": "en_US",
  "parameter_format": "positional",
  "message_send_ttl_seconds": 600,
  "components": [
    {
      "type": "BODY",
      "text": "Great news! Your order {{1}} has been shipped.\n\nTracking ID: {{2}}\nExpected delivery: {{3}}",
      "example": {
        "body_text": [["ORD-12345", "TRK-98765", "Dec 25, 2026"]]
      }
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "URL",
          "text": "Track Package",
          "url": "https://unifesto.app/track/{{1}}",
          "example": ["TRK-98765"]
        }
      ]
    }
  ]
}
```

### 3. Order Details with Payment

```json
{
  "name": "payment_request",
  "category": "UTILITY",
  "template_type": "ORDER_DETAILS",
  "language": "en_US",
  "parameter_format": "named",
  "components": [
    {
      "type": "BODY",
      "text": "Hi {{customer_name}},\n\nYour order {{order_id}} is ready for payment.\n\nAmount due: ₹{{amount}}\n\nPlease complete the payment to proceed.",
      "example": {
        "body_text_named_params": [
          { "param_name": "customer_name", "example": "Sarah" },
          { "param_name": "order_id", "example": "ORD-67890" },
          { "param_name": "amount", "example": "1,999" }
        ]
      }
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "URL",
          "text": "Pay Now",
          "url": "https://unifesto.app/pay/{{1}}",
          "example": ["ORD-67890"]
        }
      ]
    }
  ]
}
```

### 4. Appointment Reminder with Flow

```json
{
  "name": "appointment_reminder",
  "category": "UTILITY",
  "template_type": "FLOWS",
  "language": "en_US",
  "parameter_format": "positional",
  "components": [
    {
      "type": "BODY",
      "text": "Hi {{1}}! This is a reminder for your appointment on {{2}} at {{3}}.",
      "example": {
        "body_text": [["John", "Dec 25, 2026", "10:00 AM"]]
      }
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "FLOW",
          "text": "Reschedule",
          "flow_id": "YOUR_FLOW_ID",
          "flow_action": "navigate"
        },
        {
          "type": "QUICK_REPLY",
          "text": "Confirm"
        },
        {
          "type": "QUICK_REPLY",
          "text": "Cancel"
        }
      ]
    }
  ]
}
```

### 5. Calling Permission Request

```json
{
  "name": "call_permission",
  "category": "UTILITY",
  "template_type": "CALLING_PERMISSIONS_REQUEST",
  "language": "en_US",
  "parameter_format": "positional",
  "components": [
    {
      "type": "BODY",
      "text": "Hi {{1}}, we'd like to call you regarding your recent inquiry about {{2}}. May we call you on WhatsApp?",
      "example": {
        "body_text": [["Sarah", "event booking"]]
      }
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "QUICK_REPLY",
          "text": "Yes, call me"
        },
        {
          "type": "QUICK_REPLY",
          "text": "Not now"
        }
      ]
    }
  ]
}
```

---

## Authentication Templates

### 1. OTP with Copy Code Button

```json
{
  "name": "otp_verification",
  "category": "AUTHENTICATION",
  "template_type": "DEFAULT",
  "language": "en_US",
  "parameter_format": "positional",
  "components": [
    {
      "type": "BODY",
      "text": "Your verification code is: {{1}}\n\nThis code will expire in 10 minutes. Do not share this code with anyone.",
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

### 2. OTP with One-Tap Autofill (Android)

```json
{
  "name": "otp_autofill",
  "category": "AUTHENTICATION",
  "template_type": "DEFAULT",
  "language": "en_US",
  "parameter_format": "positional",
  "components": [
    {
      "type": "BODY",
      "text": "{{1}} is your verification code for Unifesto.\n\nDo not share this code with anyone.",
      "example": {
        "body_text": [["123456"]]
      },
      "add_security_recommendation": true
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "OTP",
          "otp_type": "ONE_TAP",
          "text": "Autofill",
          "autofill_text": "Autofill",
          "package_name": "com.unifesto.app",
          "signature_hash": "YOUR_APP_SIGNATURE_HASH"
        }
      ]
    }
  ]
}
```

### 3. Password Reset

```json
{
  "name": "password_reset",
  "category": "AUTHENTICATION",
  "template_type": "DEFAULT",
  "language": "en_US",
  "parameter_format": "named",
  "components": [
    {
      "type": "BODY",
      "text": "Hi {{username}},\n\nWe received a request to reset your password. Click the button below to reset it.\n\nIf you didn't request this, please ignore this message.",
      "example": {
        "body_text_named_params": [
          { "param_name": "username", "example": "john_doe" }
        ]
      }
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "URL",
          "text": "Reset Password",
          "url": "https://unifesto.app/reset/{{1}}",
          "example": ["reset_token_123"]
        }
      ]
    }
  ]
}
```

---

## Sending Template Messages

### Example 1: Send Order Confirmation

```bash
POST /messages/send-template
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "to": "919876543210",
  "template": {
    "name": "order_confirmation",
    "language": {
      "code": "en_US"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "parameter_name": "customer_name",
            "text": "Sarah"
          },
          {
            "type": "text",
            "parameter_name": "order_number",
            "text": "ORD-67890"
          },
          {
            "type": "text",
            "parameter_name": "amount",
            "text": "2,499"
          },
          {
            "type": "text",
            "parameter_name": "delivery_date",
            "text": "Dec 25"
          }
        ]
      },
      {
        "type": "button",
        "sub_type": "url",
        "index": "0",
        "parameters": [
          {
            "type": "text",
            "text": "ORD-67890"
          }
        ]
      }
    ]
  },
  "event_id": "evt_123"
}
```

### Example 2: Send OTP

```bash
POST /messages/send-template
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "to": "919876543210",
  "template": {
    "name": "otp_verification",
    "language": {
      "code": "en_US"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "847392"
          }
        ]
      },
      {
        "type": "button",
        "sub_type": "copy_code",
        "index": "0",
        "parameters": [
          {
            "type": "coupon_code",
            "coupon_code": "847392"
          }
        ]
      }
    ]
  }
}
```

### Example 3: Send Marketing with Image

```bash
POST /messages/send-template
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "to": "919876543210",
  "template": {
    "name": "flash_sale_announcement",
    "language": {
      "code": "en_US"
    },
    "components": [
      {
        "type": "header",
        "parameters": [
          {
            "type": "image",
            "image": {
              "link": "https://unifesto.app/images/sale-banner.jpg"
            }
          }
        ]
      },
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "parameter_name": "customer_name",
            "text": "John"
          },
          {
            "type": "text",
            "parameter_name": "discount",
            "text": "40"
          },
          {
            "type": "text",
            "parameter_name": "product_category",
            "text": "Fashion"
          },
          {
            "type": "text",
            "parameter_name": "expiry_date",
            "text": "Dec 31"
          }
        ]
      }
    ]
  }
}
```

---

## Template Character Limits

| Component | Character Limit |
|-----------|----------------|
| Template Name | 512 characters |
| Header Text | 60 characters |
| Body Text | 1,024 characters |
| Footer Text | 60 characters |
| Button Text | 25 characters |
| URL | 2,000 characters |

---

## Best Practices

1. **Keep it concise**: Use clear, brief messages
2. **Personalize**: Use variables to personalize messages
3. **Clear CTA**: Make call-to-action buttons obvious
4. **Test thoroughly**: Test templates before sending to large audiences
5. **Monitor quality**: Check quality ratings regularly
6. **Respect timing**: Send messages at appropriate times
7. **Provide value**: Ensure messages are relevant and useful
8. **Follow policies**: Comply with WhatsApp Business Policy
9. **Use TTL wisely**: Set appropriate message validity periods for time-sensitive messages
10. **Handle opt-outs**: Respect user preferences and opt-out requests

---

## Common Errors and Solutions

### Error: Template Not Found
**Solution**: Ensure template is synced and status is APPROVED

### Error: Parameter Mismatch
**Solution**: Verify parameter count and order match template definition

### Error: Invalid Phone Number
**Solution**: Use E.164 format (e.g., 919876543210)

### Error: Template Paused
**Solution**: Check quality rating and address user feedback issues

### Error: Rate Limit Exceeded
**Solution**: Implement proper rate limiting and pacing

---

## Resources

- [Meta WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/business-management-api)
- [Template Components](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components)
- [WhatsApp Business Policy](https://www.whatsapp.com/legal/business-policy)
