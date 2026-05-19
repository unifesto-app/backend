# WhatsApp Templates Guide

This guide covers the WhatsApp template functionality based on Meta's official documentation.

## Overview

WhatsApp templates are pre-approved message formats that can be sent to users outside of the 24-hour customer service window. Templates are essential for:
- Marketing campaigns
- Transactional notifications
- Authentication messages
- Utility messages

## Template Categories

### 1. AUTHENTICATION
Used for one-time passwords and authentication codes.
- Example: "Your verification code is {{1}}"

### 2. MARKETING
Used for promotional messages and marketing campaigns.
- Subject to per-user limits
- Requires opt-in from users
- Example: "🎉 Special offer! Get {{1}}% off on {{2}}"

### 3. UTILITY
Used for transactional updates and account notifications.
- Order confirmations
- Shipping updates
- Account alerts
- Example: "Your order {{1}} has been shipped"

## Parameter Formats

### Positional Parameters
Parameters are numbered sequentially: `{{1}}`, `{{2}}`, `{{3}}`, etc.

**Example Template Creation:**
```json
{
  "name": "order_confirmation",
  "language": "en_US",
  "category": "UTILITY",
  "parameter_format": "positional",
  "components": [
    {
      "type": "BODY",
      "text": "Hi {{1}}! Your order {{2}} has been confirmed.",
      "example": {
        "body_text": [["John", "ORD-12345"]]
      }
    }
  ]
}
```

**Sending with Positional Parameters:**
```json
{
  "to": "919876543210",
  "template": {
    "name": "order_confirmation",
    "language": { "code": "en_US" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Sarah" },
          { "type": "text", "text": "ORD-67890" }
        ]
      }
    ]
  }
}
```

### Named Parameters
Parameters use descriptive names: `{{first_name}}`, `{{order_number}}`, etc.

**Example Template Creation:**
```json
{
  "name": "order_confirmation",
  "language": "en_US",
  "category": "UTILITY",
  "parameter_format": "named",
  "components": [
    {
      "type": "BODY",
      "text": "Hi {{first_name}}! Your order {{order_number}} has been confirmed.",
      "example": {
        "body_text_named_params": [
          { "param_name": "first_name", "example": "John" },
          { "param_name": "order_number", "example": "ORD-12345" }
        ]
      }
    }
  ]
}
```

**Sending with Named Parameters:**
```json
{
  "to": "919876543210",
  "template": {
    "name": "order_confirmation",
    "language": { "code": "en_US" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "parameter_name": "first_name", "text": "Sarah" },
          { "type": "text", "parameter_name": "order_number", "text": "ORD-67890" }
        ]
      }
    ]
  }
}
```

## Template Components

### HEADER
Optional component that appears at the top of the message.

**Types:**
- `TEXT`: Plain text header with optional variables
- `IMAGE`: Image header
- `VIDEO`: Video header
- `DOCUMENT`: Document header

**Example with Text Header:**
```json
{
  "type": "HEADER",
  "format": "TEXT",
  "text": "Order Update"
}
```

**Example with Image Header:**
```json
{
  "type": "HEADER",
  "format": "IMAGE",
  "example": {
    "header_handle": ["<MEDIA_HANDLE>"]
  }
}
```

### BODY
Required component containing the main message text.

**Example:**
```json
{
  "type": "BODY",
  "text": "Hello {{1}}, your order {{2}} is on its way!",
  "example": {
    "body_text": [["John", "ORD-12345"]]
  }
}
```

### FOOTER
Optional component for additional information (no variables allowed).

**Example:**
```json
{
  "type": "FOOTER",
  "text": "Thank you for shopping with us!"
}
```

### BUTTONS
Optional interactive buttons.

**Button Types:**
- `QUICK_REPLY`: Quick response buttons
- `URL`: Opens a URL (can be dynamic)
- `PHONE_NUMBER`: Initiates a phone call
- `COPY_CODE`: Copies a code (for OTP/coupons)

**Example:**
```json
{
  "type": "BUTTONS",
  "buttons": [
    {
      "type": "QUICK_REPLY",
      "text": "Yes"
    },
    {
      "type": "URL",
      "text": "Track Order",
      "url": "https://example.com/track/{{1}}",
      "example": ["ORD-12345"]
    },
    {
      "type": "PHONE_NUMBER",
      "text": "Call Support",
      "phone_number": "+919876543210"
    }
  ]
}
```

## Template Status

Templates go through a review process and can have the following statuses:

- `APPROVED`: Template is approved and can be sent
- `PENDING`: Under review (can take up to 24 hours)
- `REJECTED`: Rejected due to policy violations
- `PAUSED`: Paused due to negative feedback
- `DISABLED`: Disabled due to recurring issues
- `IN_APPEAL`: Appeal has been requested
- `PENDING_DELETION`: Scheduled for deletion
- `DELETED`: Template has been deleted
- `ARCHIVED`: Archived due to inactivity (12+ months)

## Quality Ratings

Templates receive quality ratings based on user feedback:

- `GREEN` (High Quality): Little to no negative feedback
- `YELLOW` (Medium Quality): Some negative feedback, monitor closely
- `RED` (Low Quality): Significant negative feedback, risk of being paused
- `UNKNOWN`: Not enough data yet

## API Endpoints

### 1. Get Templates from Meta
```
GET /messages/templates?source=meta
```
Fetches all templates from Meta's API.

### 2. Get Local Templates
```
GET /messages/templates?category=UTILITY&language=en_US
```
Fetches templates from local database with optional filters.

### 3. Get Template by ID
```
GET /messages/templates/:id
```
Fetches a specific template by database ID.

### 4. Create Template
```
POST /messages/templates
Content-Type: application/json

{
  "name": "welcome_message",
  "category": "UTILITY",
  "language": "en_US",
  "parameter_format": "positional",
  "components": [
    {
      "type": "BODY",
      "text": "Welcome {{1}}! Thanks for joining {{2}}.",
      "example": {
        "body_text": [["John", "Unifesto"]]
      }
    }
  ]
}
```

### 5. Sync Templates
```
POST /messages/templates/sync
```
Syncs all approved templates from Meta to local database.

### 6. Delete Template
```
DELETE /messages/templates/:name?language=en_US
```
Deletes a template from both Meta and local database.

### 7. Send Template Message
```
POST /messages/send-template
Content-Type: application/json

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
          { "type": "text", "text": "Sarah" },
          { "type": "text", "text": "ORD-67890" }
        ]
      }
    ]
  },
  "event_id": "evt_123"
}
```

## Complete Template Example

### Marketing Template with All Components

```json
{
  "name": "flash_sale",
  "category": "MARKETING",
  "language": "en_US",
  "parameter_format": "named",
  "components": [
    {
      "type": "HEADER",
      "format": "IMAGE",
      "example": {
        "header_handle": ["<IMAGE_HANDLE>"]
      }
    },
    {
      "type": "BODY",
      "text": "🎉 Flash Sale Alert!\n\nHi {{customer_name}}, get {{discount}}% off on {{product_category}}!\n\nOffer valid until {{expiry_date}}.",
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

## Best Practices

1. **Template Naming**: Use lowercase letters, numbers, and underscores only
2. **Language Codes**: Use proper locale codes (e.g., `en_US`, `es_MX`, `hi_IN`)
3. **Parameter Limits**: Keep parameters to a minimum for better user experience
4. **Quality Monitoring**: Regularly check template quality ratings
5. **Testing**: Always test templates before sending to large audiences
6. **Compliance**: Ensure templates comply with WhatsApp Business Policy
7. **Opt-in**: For marketing messages, ensure users have opted in
8. **Timing**: Respect user time zones and preferences
9. **Personalization**: Use parameters to personalize messages
10. **Clear CTAs**: Make call-to-action buttons clear and actionable

## Template Limits

- **Unverified Business**: 250 templates per WhatsApp Business Account
- **Verified Business**: 6,000 templates per WhatsApp Business Account
- **Creation Rate**: 100 templates per hour
- **Name Length**: Maximum 512 characters

## Common Rejection Reasons

1. **Policy Violations**: Content violates WhatsApp Business Policy
2. **Misleading Content**: False or misleading information
3. **Poor Formatting**: Excessive capitalization, emojis, or special characters
4. **Unclear Purpose**: Template purpose is not clear
5. **Promotional in Utility**: Marketing content in utility category
6. **Missing Examples**: Required example parameters not provided

## Troubleshooting

### Template Not Syncing
- Ensure `WHATSAPP_BUSINESS_ACCOUNT_ID` is configured
- Check that template status is `APPROVED`
- Verify access token has proper permissions

### Template Rejected
- Review WhatsApp Business Policy
- Check for policy violations in content
- Ensure proper categorization
- Provide clear example parameters

### Low Quality Rating
- Review user feedback
- Improve message relevance
- Reduce sending frequency
- Better audience targeting

## Resources

- [Meta WhatsApp Templates Documentation](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates)
- [WhatsApp Business Policy](https://www.whatsapp.com/legal/business-policy)
- [Template Components Guide](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components)
