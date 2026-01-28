// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WhatsAppManager } from '../whatsapp';

// Mock do whatsapp-web.js
vi.mock('whatsapp-web.js', () => {
    const EventEmitter = require('events');
    class MockClient extends EventEmitter {
        initialize = vi.fn();
        destroy = vi.fn();
        sendMessage = vi.fn().mockResolvedValue({ id: { fromMe: true } });
    }

    const lib = {
        Client: MockClient,
        LocalAuth: vi.fn(),
        Events: {
            AUTH_FAILURE: 'auth_failure',
            READY: 'ready',
            DISCONNECTED: 'disconnected',
            QR_RECEIVED: 'qr',
            AUTHENTICATED: 'authenticated',
            MESSAGE_RECEIVED: 'message_received',
        },
    };

    return {
        __esModule: true,
        ...lib,
        default: lib,
    };
});

describe('WhatsAppManager', () => {
    let whatsapp: WhatsAppManager;

    beforeEach(() => {
        vi.clearAllMocks();
        whatsapp = new WhatsAppManager();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('deve inicializar com estado desconectado', () => {
        const status = whatsapp.getStatus();
        expect(status.connected).toBe(false);
        expect(status.qr).toBe('');
    });

    it('deve manter legado desabilitado e não expor client', async () => {
        const qrSpy = vi.fn();
        whatsapp.on('qr_code', qrSpy);

        await whatsapp.initialize();

        // @ts-ignore
        const mockClient = whatsapp.client;
        expect(mockClient).toBeUndefined();

        expect(qrSpy).not.toHaveBeenCalled();
        const status = whatsapp.getStatus();
        expect(status.qr).toBe('');
    });
});
