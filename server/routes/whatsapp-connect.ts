import express from 'express';
import { supabaseAdmin } from '../lib/supabase.js';

const router = express.Router();

// Verificar status da conexão
router.get('/status', async (req, res) => {
  try {
    const { accountId } = req.query;

    if (!accountId) {
      return res.status(400).json({ error: 'accountId required' });
    }

    const { data: account, error } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('*')
      .eq('id', accountId as string)
      .single();

    if (error || !account) {
      console.log('Account not found or error:', error);
      return res.json({ status: 'disconnected' });
    }

    // Se tem instance_id, verificar status real na Evolution API
    if (account.instance_id) {
      const evolutionUrl = process.env.EVOLUTION_API_URL;
      const apiKey = process.env.EVOLUTION_API_KEY;

      if (evolutionUrl && apiKey) {
        try {
          const instanceName = account.instance_id;
          const fetchResponse = await fetch(`${evolutionUrl}/instance/fetchInstances?instanceName=${instanceName}`, {
            method: 'GET',
            headers: { 'apikey': apiKey },
            signal: AbortSignal.timeout(10000) // 10s timeout
          });

          if (fetchResponse.ok) {
            const instances = await fetchResponse.json();

            if (Array.isArray(instances) && instances.length > 0) {
              const instance = instances[0];
              const realStatus = instance.connectionStatus === 'open' ? 'connected' : 'disconnected';

              // Se status mudou, atualizar no banco
              if (realStatus !== account.status) {
                console.log(`[STATUS] Updating ${accountId}: ${account.status} → ${realStatus}`);
                await supabaseAdmin
                  .from('whatsapp_accounts')
                  .update({
                    status: realStatus,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', accountId as string);

                return res.json({
                  status: realStatus,
                  phoneNumber: account.phone_number,
                  displayName: account.display_name
                });
              }
            }
          }
        } catch (apiError) {
          console.error('[STATUS] Evolution API error (non-critical):', apiError);
          // Continua e retorna status do banco
        }
      }
    }

    return res.json({
      status: account.status || 'disconnected',
      phoneNumber: account.phone_number,
      displayName: account.display_name
    });
  } catch (error) {
    console.error('Error checking status:', error);
    return res.json({ status: 'disconnected' });
  }
});

// Gerar QR Code para conexão
router.get('/connect', async (req, res) => {
  try {
    const { accountId } = req.query;

    if (!accountId) {
      return res.status(400).json({ error: 'accountId required' });
    }

    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;

    if (!evolutionUrl || !apiKey) {
      console.error('Evolution API not configured');
      return res.status(500).json({ error: 'WhatsApp provider not configured' });
    }

    // Criar instância no Evolution API
    const instanceName = `hunfly_${accountId}`;

    // 1. Verificar se instância já existe
    console.log('Checking if instance exists...');
    const fetchResponse = await fetch(`${evolutionUrl}/instance/fetchInstances?instanceName=${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': apiKey
      },
      signal: AbortSignal.timeout(30000) // 30s timeout
    }).catch(err => {
      console.error('Evolution API timeout or error:', err.message);
      return null;
    });

    let shouldCreateInstance = true;

    if (fetchResponse && fetchResponse.ok) {
      const instances = await fetchResponse.json();

      if (Array.isArray(instances) && instances.length > 0) {
        const instance = instances[0];
        console.log('Instance found:', {
          status: instance.connectionStatus,
          disconnectionCode: instance.disconnectionReasonCode
        });

        // Se instância já conectada (status: 'open'), retornar sucesso imediatamente
        if (instance.connectionStatus === 'open') {
          console.log('✅ WhatsApp already connected!');

          try {
            await supabaseAdmin.from('whatsapp_accounts').update({
              status: 'connected',
              updated_at: new Date().toISOString()
            }).eq('id', accountId as string);
          } catch (dbError) {
            console.error('Failed to update status (non-critical):', dbError);
          }

          return res.json({ connected: true, message: 'WhatsApp already connected', instanceName });
        }

        // Se instância está em estado de erro (401, 403, 428, etc) ou "connecting" travado, deletar
        const hasError = instance.disconnectionReasonCode && instance.disconnectionReasonCode >= 400;

        // Só considerar travado se está "connecting" HÁ MAIS DE 2 MINUTOS
        const isStuckConnecting = instance.connectionStatus === 'connecting' &&
          instance.disconnectionAt &&
          (new Date().getTime() - new Date(instance.disconnectionAt).getTime()) > 120000; // 2 minutos

        // NUNCA deletar se acabou de desconectar (pode estar reconectando)
        const isRecentDisconnection = instance.disconnectionAt &&
          (new Date().getTime() - new Date(instance.disconnectionAt).getTime()) < 60000; // menos de 1 minuto

        if (isRecentDisconnection && hasError) {
          console.log('Recent disconnection detected, waiting for reconnection...');
          shouldCreateInstance = false;
          console.log('Instance recently disconnected, skipping deletion');
        } else

        if (hasError || isStuckConnecting) {
          console.log('Instance in error state, deleting:', {
            disconnectionCode: instance.disconnectionReasonCode,
            disconnectionAt: instance.disconnectionAt
          });

          // Deletar instância com erro
          const deleteResponse = await fetch(`${evolutionUrl}/instance/delete/${instanceName}`, {
            method: 'DELETE',
            headers: {
              'apikey': apiKey
            }
          });

          if (deleteResponse.ok) {
            console.log('Instance deleted successfully, will recreate');
            shouldCreateInstance = true;
          } else {
            console.error('Failed to delete instance, will try to recreate anyway');
          }
        } else {
          // Instância OK, não recriar
          shouldCreateInstance = false;
          console.log('Instance already exists and is healthy, skipping creation');
        }
      }
    }

    // 2. Criar instância se necessário
    if (shouldCreateInstance) {
      const createResponse = await fetch(`${evolutionUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        },
        body: JSON.stringify({
          instanceName,
          integration: 'WHATSAPP-BAILEYS',
          qrcode: true
        })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        console.error('Evolution API error:', errorData);
        return res.status(500).json({ error: 'Failed to create WhatsApp instance', details: errorData });
      }

      const instanceData = await createResponse.json();
      console.log('Instance created:', instanceData);
    }

    // 3. Conectar e obter QR Code
    // Tentar primeiro com /instance/connect
    console.log('Requesting QR Code from Evolution API...');
    let connectResponse = await fetch(`${evolutionUrl}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': apiKey
      },
      signal: AbortSignal.timeout(45000) // 45s timeout (pode demorar para acordar)
    }).catch(err => {
      console.error('Evolution API /connect timeout:', err.message);
      return { ok: false } as Response;
    });

    if (!connectResponse.ok) {
      console.log('Connect endpoint failed, trying connectionState...');

      // Fallback: tentar connectionState
      console.log('Trying fallback: connectionState endpoint...');
      connectResponse = await fetch(`${evolutionUrl}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': apiKey
        },
        signal: AbortSignal.timeout(45000)
      }).catch(err => {
        console.error('Evolution API /connectionState timeout:', err.message);
        return { ok: false } as Response;
      });

      if (!connectResponse.ok) {
        const errorData = await connectResponse.json().catch(() => ({}));
        console.error('Both connect and connectionState failed:', errorData);
        return res.status(503).json({
          error: 'WhatsApp service temporarily unavailable',
          message: 'Evolution API may be starting up (Render free tier). Please wait 1 minute and try again.',
          details: errorData
        });
      }
    }

    const connectData = await connectResponse.json();
    console.log('Connect response:', JSON.stringify(connectData, null, 2));

    // Se instância já está conectada (state: 'open'), não precisa de QR Code
    if (connectData.instance?.state === 'open' || connectData.state === 'open') {
      console.log('✅ WhatsApp already connected!');

      // Atualizar status no banco para 'connected'
      try {
        await supabaseAdmin
          .from('whatsapp_accounts')
          .update({
            status: 'connected',
            updated_at: new Date().toISOString()
          })
          .eq('id', accountId as string);
      } catch (dbError) {
        console.error('Failed to update status (non-critical):', dbError);
      }

      return res.json({
        connected: true,
        message: 'WhatsApp already connected',
        instanceName
      });
    }

    // Extrair QR Code da resposta (múltiplos formatos possíveis)
    let qrCode = null;

    // Formato 1: { base64: "data:image/png..." }
    if (connectData.base64) {
      qrCode = connectData.base64;
    }
    // Formato 2: { code: "2@H5YJ..." }
    else if (connectData.code) {
      qrCode = connectData.code;
    }
    // Formato 3: { qrcode: { base64: "..." } }
    else if (connectData.qrcode?.base64) {
      qrCode = connectData.qrcode.base64;
    }
    // Formato 4: { instance: { qrcode: { base64: "..." } } }
    else if (connectData.instance?.qrcode?.base64) {
      qrCode = connectData.instance.qrcode.base64;
    }
    // Formato 5: connectionState retorna { state: "open/close", qr: "..." }
    else if (connectData.qr) {
      qrCode = connectData.qr;
    }

    if (!qrCode) {
      console.error('No QR code in response:', connectData);
      return res.status(500).json({
        error: 'No QR Code received from Evolution API',
        details: connectData
      });
    }

    // Se qrCode não tem prefixo data:image, adicionar
    if (!qrCode.startsWith('data:image') && !qrCode.startsWith('http')) {
      console.log('QR Code is raw code, needs conversion to image');
      // Nota: código bruto precisa ser convertido para QR image no frontend
      // Por enquanto, retornar como está
    }

    console.log('QR Code extracted successfully, length:', qrCode.length);

    // Tentar atualizar instanceId no banco (opcional - não bloqueia se falhar)
    try {
      const { error: updateError } = await supabaseAdmin
        .from('whatsapp_accounts')
        .update({
          instance_id: instanceName,
          status: 'disconnected', // Será atualizado para 'connected' via webhook
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId as string);

      if (updateError) {
        console.error('Failed to update database:', updateError);
      } else {
        console.log('Database updated successfully');
      }
    } catch (dbError) {
      console.error('Failed to update database (non-critical):', dbError);
      // Continua mesmo se o banco falhar - o QR Code já foi gerado
    }

    return res.json({
      qrCode,
      instanceName,
      message: 'Scan the QR Code with WhatsApp'
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
    const { error } = await supabaseAdmin
      .from('whatsapp_accounts')
      .update({
        status: status === 'open' ? 'connected' : 'disconnected',
        updated_at: new Date().toISOString()
      })
      .eq('instance_id', instanceId);

    if (error) {
      console.error('Error updating status:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
