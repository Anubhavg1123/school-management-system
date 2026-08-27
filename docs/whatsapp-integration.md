# Official Meta WhatsApp Business API Integration Guide

## 1. Overview
The platform integrates directly with Meta Graph API (`/v18.0/{phone_number_id}/messages`) for official WhatsApp Business messaging.

## 2. Environment Configuration
Set the following environment variables in `.env`:
```env
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_ACCESS_TOKEN=EAAG...
WHATSAPP_PHONE_NUMBER_ID=10065...
WHATSAPP_WEBHOOK_SECRET=school_management_whatsapp_webhook_secret_2026
```

## 3. Zero-Fake Delivery Policy
When `WHATSAPP_ACCESS_TOKEN` or `WHATSAPP_PHONE_NUMBER_ID` is unconfigured:
- The system returns HTTP `400 Bad Request` with error code `WHATSAPP_NOT_CONFIGURED`.
- It explicitly indicates that the provider is missing configuration rather than simulating fake delivery responses or fake success indicators.

## 4. Webhook Setup (Meta Developer Portal)
1. Set Callback URL: `https://your-domain.com/api/integrations/whatsapp/webhook`
2. Set Verify Token: Value of `WHATSAPP_WEBHOOK_SECRET`
3. Subscribe to fields: `messages`
4. The system validates incoming HMAC SHA256 signatures using `x-hub-signature-256` header.
