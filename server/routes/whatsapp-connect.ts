import express from 'express';
import { db } from '../db.js';
import { whatsappAccounts } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Verificar status da conexão
router.get('/status', async (req, res) => {
  try {
    const { accountId } = req.query;

    if (!accountId) {
      return res.status(400).json({ error: 'accountId required' });
    }

    const account = await db
      .select()
      .from(whatsappAccounts)
      .where(eq(whatsappAccounts.id, accountId as string))
      .limit(1);

    if (!account.length) {
      return res.json({ status: 'disconnected' });
    }

    return res.json({
      status: account[0].status || 'disconnected',
      phoneNumber: account[0].phoneNumber,
      displayName: account[0].displayName
    });
  } catch (error) {
    console.error('Error checking status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Gerar QR Code para conexão
router.get('/connect', async (req, res) => {
  try {
    const { accountId } = req.query;

    if (!accountId) {
      return res.status(400).json({ error: 'accountId required' });
    }

    // TODO: Aqui você integraria com Evolution API ou Cloud API
    // Por enquanto, retorna um QR Code de exemplo

    // Exemplo com Evolution API:
    // const evolutionUrl = process.env.EVOLUTION_API_URL;
    // const response = await fetch(`${evolutionUrl}/instance/connect/${accountId}`);
    // const data = await response.json();
    // return res.json({ qrCode: data.qrCode });

    // QR Code de exemplo (placeholder)
    const placeholderQR = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(`whatsapp-connect-${accountId}-${Date.now()}`)}`;

    return res.json({
      qrCode: placeholderQR,
      message: 'QR Code generated. Integrate with Evolution API for production.'
    });
  } catch (error) {
    console.error('Error generating QR:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook para receber status de conexão
router.post('/webhook/status', async (req, res) => {
  try {
    const { instanceId, status } = req.body;

    if (!instanceId) {
      return res.status(400).json({ error: 'instanceId required' });
    }

    // Atualizar status no banco
    await db
      .update(whatsappAccounts)
      .set({
        status: status === 'open' ? 'connected' : 'disconnected',
        updatedAt: new Date()
      })
      .where(eq(whatsappAccounts.instanceId, instanceId));

    return res.json({ success: true });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
