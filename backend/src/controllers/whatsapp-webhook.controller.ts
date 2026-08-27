import { Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsapp.service';

export class WhatsAppWebhookController {
  /**
   * 1. Meta Webhook Verification (GET)
   */
  static verifyWebhook(req: Request, res: Response) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const expectedToken = process.env.WHATSAPP_WEBHOOK_SECRET || 'school_management_whatsapp_webhook_secret_2026';

    if (mode && token) {
      if (mode === 'subscribe' && token === expectedToken) {
        return res.status(200).send(challenge);
      } else {
        return res.status(403).send('Forbidden: Token mismatch');
      }
    }

    return res.status(400).send('Bad Request');
  }

  /**
   * 2. Meta Webhook Notification Callback (POST)
   */
  static async handleWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['x-hub-signature-256'] as string;
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      const result = await WhatsAppService.processWebhook(signature, rawBody, req.body);
      console.log('[Webhook Processing Result]:', JSON.stringify(result));
      return res.status(200).json({ success: true, result });
    } catch (err: any) {
      console.error('[WhatsApp Webhook Error]:', err.message);
      return res.status(200).json({ success: false, error: err.message }); // Always 200 to prevent Meta webhook retries loop
    }
  }
}
