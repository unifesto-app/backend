import type { Request, Response } from 'express';
import { WhatsAppService } from './whatsapp.service';
export declare class WhatsAppController {
    private readonly whatsappService;
    private readonly logger;
    constructor(whatsappService: WhatsAppService);
    verify(mode: string, token: string, challenge: string, res: Response): void;
    receive(signature: string, req: Request & {
        rawBody?: Buffer;
    }): {
        received: boolean;
    };
}
