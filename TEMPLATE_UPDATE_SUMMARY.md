# WhatsApp Templates Update Summary

## Overview
Updated the WhatsApp templates implementation to align with Meta's official documentation and support all template types, features, and best practices.

## What Was Fixed

### 1. **Environment Configuration**
- ✅ Added missing `WHATSAPP_BUSINESS_ACCOUNT_ID` to `.env` file
- ✅ Loaded Business Account ID in service constructor
- ✅ Fixed "WhatsApp Business Account ID not configured" error

### 2. **Database Schema Updates**

#### New Columns Added:
- `template_type`: Support for DEFAULT, CATALOGUE, FLOWS, ORDER_DETAILS, ORDER_STATUS, CALLING_PERMISSIONS_REQUEST
- `message_send_ttl_seconds`: Message validity period (60-600 seconds for utility messages)
- `meta_quality_score`: Quality rating (GREEN, YELLOW, RED, UNKNOWN)
- `last_synced_at`: Timestamp of last sync with Meta API

#### Updated Constraints:
- Changed category enum to: AUTHENTICATION, MARKETING, UTILITY
- Added template_type enum validation
- Changed unique constraint from `name` to `name + language` (allows same template in multiple languages)

#### New Indexes:
- `idx_whatsapp_templates_template_type`
- `idx_whatsapp_templates_meta_status`
- `idx_whatsapp_templates_language`
- `idx_whatsapp_templates_quality_score`

### 3. **DTOs (Data Transfer Objects)**

#### Created `create-template.dto.ts`:
- Support for all template categories (AUTHENTICATION, MARKETING, UTILITY)
- Support for all template types (DEFAULT, CATALOGUE, FLOWS, ORDER_DETAILS, ORDER_STATUS, CALLING_PERMISSIONS_REQUEST)
- Support for both named and positional parameters
- Support for all header formats (TEXT, IMAGE, VIDEO, DOCUMENT, LOCATION)
- Support for all button types (QUICK_REPLY, URL, PHONE_NUMBER, COPY_CODE, OTP, FLOW, CATALOG)
- Character limit validations (header: 60, body: 1024, footer: 60, name: 512)
- TTL validation (60-600 seconds)

#### Created `send-template-message.dto.ts`:
- Support for sending templates with parameters
- Support for named and positional parameters
- Support for media in headers (image, video, document)
- Support for dynamic button parameters

### 4. **Service Updates (`whatsapp.service.ts`)**

#### New Methods:
- `createTemplate()`: Create templates via Meta API
- `sendTemplateMessage()`: Send template messages with parameters
- `getLocalTemplates()`: Fetch templates from local DB with filters (category, language, type)
- `getTemplateById()`: Get specific template by ID
- `deleteTemplate()`: Delete template from Meta and local DB

#### Enhanced Methods:
- `syncMetaTemplates()`: 
  - Now detects parameter format (named vs positional)
  - Extracts quality scores
  - Detects template types (FLOWS, CATALOGUE)
  - Stores TTL values
  - Better error handling and logging
  - Syncs by name + language combination

- `getMetaTemplates()`:
  - Uses Business Account ID from constructor
  - Better error messages

### 5. **Controller Updates (`whatsapp.controller.ts`)**

#### New Endpoints:
- `GET /messages/templates/:id` - Get template by ID
- `POST /messages/templates` - Create new template
- `DELETE /messages/templates/:name` - Delete template
- `POST /messages/send-template` - Send template message

#### Enhanced Endpoints:
- `GET /messages/templates` - Now supports filtering by:
  - `source` (meta or local)
  - `category` (AUTHENTICATION, MARKETING, UTILITY)
  - `language` (en_US, es_MX, etc.)
  - `type` (DEFAULT, CATALOGUE, FLOWS, etc.)

### 6. **Database Migrations**

#### Created Files:
1. `create_whatsapp_templates_table.sql` - Updated initial schema
2. `update_whatsapp_templates_table.sql` - Migration script for existing databases

#### Migration Features:
- Adds new columns with proper constraints
- Updates existing data to new format
- Creates new indexes
- Adds column comments for documentation
- Creates `active_whatsapp_templates` view for approved templates

### 7. **Documentation**

#### Created Files:
1. `WHATSAPP_TEMPLATES.md` - Comprehensive guide covering:
   - Template fundamentals
   - All template categories
   - Named vs positional parameters
   - All component types (HEADER, BODY, FOOTER, BUTTONS)
   - Template status and quality ratings
   - API endpoints
   - Best practices
   - Troubleshooting

2. `WHATSAPP_TEMPLATE_EXAMPLES.md` - Complete examples for:
   - Marketing templates (with images, catalogue, flows)
   - Utility templates (orders, payments, appointments)
   - Authentication templates (OTP, password reset)
   - Sending template messages
   - Character limits
   - Common errors and solutions

3. `TEMPLATE_UPDATE_SUMMARY.md` - This file

## Template Types Supported

### Marketing
- **DEFAULT**: Standard marketing messages with media and buttons
- **CATALOGUE**: Product catalogue integration
- **FLOWS**: Interactive forms and surveys

### Utility
- **DEFAULT**: General transactional messages
- **ORDER_STATUS**: Order tracking and updates
- **ORDER_DETAILS**: Payment requests and order details
- **FLOWS**: Appointment management, feedback forms
- **CALLING_PERMISSIONS_REQUEST**: Request permission to call

### Authentication
- **DEFAULT**: OTP, password reset, verification codes

## Button Types Supported

1. **QUICK_REPLY**: Quick response buttons
2. **URL**: Static or dynamic URLs
3. **PHONE_NUMBER**: Call buttons
4. **COPY_CODE**: Copy OTP/coupon codes
5. **OTP**: One-tap autofill (Android)
6. **FLOW**: WhatsApp Flows integration
7. **CATALOG**: Product catalogue

## Parameter Formats

### Positional Parameters
```
"Hi {{1}}! Your order {{2}} is ready."
```

### Named Parameters
```
"Hi {{customer_name}}! Your order {{order_id}} is ready."
```

## API Usage Examples

### 1. Sync Templates from Meta
```bash
POST /messages/templates/sync
Authorization: Bearer YOUR_TOKEN
```

### 2. Get Templates (Filtered)
```bash
GET /messages/templates?category=UTILITY&language=en_US&type=ORDER_STATUS
Authorization: Bearer YOUR_TOKEN
```

### 3. Create Template
```bash
POST /messages/templates
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "name": "order_confirmation",
  "category": "UTILITY",
  "template_type": "DEFAULT",
  "language": "en_US",
  "parameter_format": "named",
  "message_send_ttl_seconds": 300,
  "components": [...]
}
```

### 4. Send Template Message
```bash
POST /messages/send-template
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "to": "919876543210",
  "template": {
    "name": "order_confirmation",
    "language": { "code": "en_US" },
    "components": [...]
  }
}
```

### 5. Delete Template
```bash
DELETE /messages/templates/order_confirmation?language=en_US
Authorization: Bearer YOUR_TOKEN
```

## Next Steps

### 1. Update Environment Variables
Add your WhatsApp Business Account ID to `.env`:
```env
WHATSAPP_BUSINESS_ACCOUNT_ID=your_actual_business_account_id
```

### 2. Run Database Migration
Execute the migration script:
```bash
psql -U your_user -d your_database -f database/migrations/update_whatsapp_templates_table.sql
```

Or if starting fresh:
```bash
psql -U your_user -d your_database -f database/migrations/create_whatsapp_templates_table.sql
```

### 3. Sync Templates
Call the sync endpoint to fetch all approved templates from Meta:
```bash
curl -X POST http://localhost:8080/messages/templates/sync \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Test Template Sending
Try sending a template message using the examples in `WHATSAPP_TEMPLATE_EXAMPLES.md`

## Breaking Changes

### Database Schema
- ⚠️ Unique constraint changed from `name` to `name + language`
- ⚠️ Category values changed to uppercase (UTILITY, MARKETING, AUTHENTICATION)
- ⚠️ Removed `meta_template_name` and `meta_language` columns

### Migration Path
The `update_whatsapp_templates_table.sql` script handles all breaking changes automatically:
1. Adds new columns
2. Updates existing data
3. Removes deprecated columns
4. Updates constraints and indexes

## Features Added

✅ Support for all template types (6 types)
✅ Support for all button types (7 types)
✅ Named and positional parameters
✅ Message validity period (TTL)
✅ Quality score tracking
✅ Template type detection
✅ Multi-language support (same template, different languages)
✅ Complete CRUD operations
✅ Comprehensive documentation
✅ Real-world examples
✅ Character limit validations
✅ Proper error handling

## Testing Checklist

- [ ] Environment variables configured
- [ ] Database migration executed
- [ ] Templates synced from Meta
- [ ] Can fetch templates with filters
- [ ] Can create new template
- [ ] Can send template message
- [ ] Can delete template
- [ ] Quality scores are tracked
- [ ] TTL values are stored
- [ ] Multi-language templates work

## Resources

- [Meta WhatsApp Templates Documentation](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates)
- [WhatsApp Business Policy](https://www.whatsapp.com/legal/business-policy)
- [Template Components Guide](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components)

## Support

For issues or questions:
1. Check `WHATSAPP_TEMPLATES.md` for detailed documentation
2. Review `WHATSAPP_TEMPLATE_EXAMPLES.md` for examples
3. Verify environment configuration
4. Check template status in Meta Business Manager
5. Review application logs for detailed error messages
