import React from 'react';
import ReactDOM from 'react-dom/client';
import { Overlay } from '../components/Overlay';

console.log('[Hunfly] Carregando Sales Engine 5.0 (Final UI)...');

const injectOverlay = () => {
  if (document.getElementById('hunfly-root')) return;

  const container = document.createElement('div');
  container.id = 'hunfly-root';
  document.body.appendChild(container);

  const shadowRoot = container.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; font-family: 'Inter', sans-serif; }

    /* --- CONTAINER --- */
    .hunfly-wrapper {
      position: fixed;
      z-index: 9999999;
      display: flex;
      flex-direction: column;
      filter: drop-shadow(0 15px 30px rgba(0,0,0,0.6));
    }

    /* --- PAINEL GLASS (Preto Profundo + Blur) --- */
    .hunfly-glass-panel {
      background: rgba(8, 8, 10, 0.80); /* Preto semi-transparente */
      backdrop-filter: blur(16px) saturate(110%); /* Desfoque bonito */
      -webkit-backdrop-filter: blur(16px) saturate(110%);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 14px;
      width: 340px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      color: #e2e8f0;
      transition: height 0.3s ease;
    }

    /* --- HEADER (Draggable) --- */
    .panel-header {
      height: 46px;
      padding: 0 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.04);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      user-select: none; /* Não seleciona texto ao arrastar */
    }
    .panel-header:active { background: rgba(255, 255, 255, 0.07); }
    
    .header-left { display: flex; align-items: center; gap: 8px; pointer-events: none; }
    .header-right { display: flex; align-items: center; gap: 10px; }
    
    .brand-text { font-weight: 700; font-size: 13px; letter-spacing: 0.5px; color: #fff; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #475569; }
    .status-dot.pulse { background: #3b82f6; box-shadow: 0 0 8px #3b82f6; }

    .ratio-badge { display: flex; flex-direction: column; align-items: flex-end; line-height: 1; margin-right: 4px; pointer-events: none; }
    .ratio-val { font-weight: 700; font-size: 11px; color: #fff; }
    .ratio-label { font-size: 8px; color: #94a3b8; text-transform: uppercase; }

    .icon-btn { 
      background: transparent; border: none; color: #94a3b8; cursor: pointer; 
      padding: 5px; border-radius: 6px; display: flex; align-items: center; transition: all 0.2s;
    }
    .icon-btn:hover { color: #fff; background: rgba(255,255,255,0.1); }
    .active-brain { color: #3b82f6; background: rgba(59, 130, 246, 0.15); }

    /* --- SEÇÃO IA (Separada) --- */
    .ai-section { padding: 12px 16px; background: rgba(59, 130, 246, 0.04); border-bottom: 1px solid rgba(255,255,255,0.06); animation: slideDown 0.3s; }
    .ai-input-wrapper { display: flex; gap: 8px; background: rgba(0,0,0,0.3); padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.2); }
    .ai-input-wrapper input { background: none; border: none; color: white; width: 100%; outline: none; font-size: 12px; }
    .send-ai-btn { background: none; border: none; color: #3b82f6; cursor: pointer; display: flex; align-items: center; padding: 0; }
    
    .ai-result-box { margin-top: 10px; background: rgba(59, 130, 246, 0.08); border-radius: 6px; padding: 8px; border-left: 2px solid #3b82f6; }
    .ai-label { font-size: 10px; font-weight: 700; color: #60a5fa; margin-bottom: 4px; display: flex; align-items: center; gap: 4px; }
    .ai-result-box p { font-size: 12px; line-height: 1.4; margin: 0; color: #dbeafe; }

    /* --- CHAT FANTASMA (Lista) --- */
    .chat-container {
      height: 180px;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
      scrollbar-width: thin;
      scrollbar-color: #334155 transparent;
    }
    .chat-container::-webkit-scrollbar { width: 3px; }
    .chat-container::-webkit-scrollbar-thumb { background-color: #334155; border-radius: 4px; }
    
    .chat-fade-mask {
      position: absolute; top: 0; left: 0; right: 0; height: 30px;
      background: linear-gradient(to bottom, rgba(8,8,10,1), transparent);
      z-index: 10; pointer-events: none;
    }

    .chat-line { font-size: 12px; line-height: 1.4; opacity: 0.6; transition: opacity 0.2s; }
    .chat-line:hover { opacity: 1; }
    .chat-line.user { color: #60a5fa; } /* Vendedor Azul */
    .chat-line.other { color: #94a3b8; } /* Cliente Cinza */
    
    .line-sender { font-weight: 700; opacity: 0.8; margin-right: 4px; }
    .line-text { opacity: 0.9; }

    /* --- TIMELINE (Circles & Line) --- */
    .timeline-section { padding: 12px 24px 16px; position: relative; background: rgba(0,0,0,0.15); margin-top: auto; }
    
    .timeline-track {
      position: absolute;
      top: 25px; left: 35px; right: 35px; /* Ajuste fino pra linha não vazar */
      height: 1px;
      background: #334155;
      z-index: 0;
    }
    
    .timeline-steps { display: flex; justify-content: space-between; position: relative; z-index: 1; }
    
    .t-step { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: default; width: 40px; }
    
    /* O Circulo */
    .t-circle {
      width: 26px; height: 26px; border-radius: 50%;
      background: rgba(8,8,10,1); /* Fundo igual ao painel para esconder a linha que passa atrás */
      border: 2px solid #334155; /* Borda Cinza (Pendente) */
      display: flex; align-items: center; justify-content: center;
      transition: all 0.3s;
    }
    
    .t-step.completed .t-circle {
      background: #3b82f6; /* Azul Preenchido */
      border-color: #3b82f6;
      color: white;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
    }
    
    .t-label { font-size: 9px; color: #64748b; font-weight: 500; text-align: center; white-space: nowrap; }
    .t-step.active .t-label { color: #fff; font-weight: 600; }
    .t-step.completed .t-label { color: #3b82f6; }

    /* --- FOOTER --- */
    .panel-footer { padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.06); }
    
    .mic-btn {
      width: 100%; padding: 8px; border-radius: 6px; border: none;
      background: #fff; color: #0f172a; font-weight: 600; font-size: 12px;
      display: flex; justify-content: center; align-items: center; gap: 8px;
      cursor: pointer; transition: all 0.2s;
    }
    .mic-btn:hover { background: #f1f5f9; }
    .mic-btn.listening { background: #ef4444; color: white; }
    
    .empty-state { text-align: center; color: #475569; font-size: 11px; margin-top: 60px; font-style: italic; }
    .loader-spin { font-size: 9px; color: #3b82f6; }

    @keyframes slideDown { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
  `;
  shadowRoot.appendChild(style);

  const reactRoot = document.createElement('div');
  shadowRoot.appendChild(reactRoot);
  const root = ReactDOM.createRoot(reactRoot);
  root.render(React.createElement(Overlay));

  // --- ENGINE DE VOZ ---
  let recognition: any = null;

  const initSpeech = () => {
    if ('webkitSpeechRecognition' in window) {
      // @ts-ignore
      recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const text = event.results[i][0].transcript;
            window.postMessage({ type: 'TRANSCRIPT_UPDATE', payload: { text: text } }, '*');
          }
        }
      };
    }
  };

  initSpeech();

  window.addEventListener('message', (event) => {
    if (!recognition) initSpeech();
    if (event.data.type === 'START_LISTENING') { try { recognition.start(); } catch (e) { } }
    if (event.data.type === 'STOP_LISTENING') { try { recognition.stop(); } catch (e) { } }
  });
};

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', injectOverlay); } else { injectOverlay(); }