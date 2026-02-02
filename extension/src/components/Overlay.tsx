import React, { useState, useEffect, useRef } from 'react';
import {
    ChevronDown, ChevronUp, Check,
    Brain, Mic, MicOff, Send, Sparkles
} from 'lucide-react';

type Message = { id: number; sender: string; text: string; type: 'user' | 'other' };
type SalesStep = { id: string; label: string; status: 'pending' | 'active' | 'completed' };

export const Overlay: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);

    // Talk Ratio
    const [userChars, setUserChars] = useState(0);
    const [totalChars, setTotalChars] = useState(0);

    // AI Section
    const [showAskAi, setShowAskAi] = useState(false);
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    // Draggable States
    const [position, setPosition] = useState({ x: window.innerWidth - 360, y: window.innerHeight - 500 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<{ startX: number, startY: number } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [steps, setSteps] = useState<SalesStep[]>([
        { id: '1', label: 'Rapport', status: 'active' },
        { id: '2', label: 'Dores', status: 'pending' },
        { id: '3', label: 'Solução', status: 'pending' },
        { id: '4', label: 'Fechamento', status: 'pending' },
    ]);

    // --- LÓGICA DE INTELIGÊNCIA DE VENDAS (Checkpoints) ---
    const updateStep = (stepId: string) => {
        setSteps(prev => prev.map((s, index) => {
            if (s.id === stepId) return { ...s, status: 'completed' };
            // Ativa o próximo passo automaticamente
            if (index > 0 && prev[index - 1].id === stepId) return { ...s, status: 'active' };
            return s;
        }));
    };

    const checkAutoSteps = (text: string) => {
        const lowerText = text.toLowerCase();

        // Regra 1: Rapport (Palavras: Tudo bem, Prazer)
        if (steps[0].status !== 'completed' &&
            (lowerText.includes('tudo bem') || lowerText.includes('prazer'))) {
            updateStep('1');
        }

        // Regra 2: Dores (Palavras: Problema, Dificuldade, Caro) - Só se Rapport já foi feito
        if (steps[1].status !== 'completed' && steps[0].status === 'completed' &&
            (lowerText.includes('problema') || lowerText.includes('dificuldade') || lowerText.includes('caro'))) {
            updateStep('2');
        }
    };

    // --- Lógica de Mensagens ---
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const { type, payload } = event.data;

            if (type === 'TRANSCRIPT_UPDATE') {
                // Vendedor (Azul)
                addMessage('Emanuel', payload.text, 'user');

                // RODAR A VERIFICAÇÃO DE CHECKPOINTS
                checkAutoSteps(payload.text);

                // Simulação Cliente (Cinza)
                if (Math.random() > 0.75) {
                    setTimeout(() => addMessage('Cliente', 'Entendi, interessante.', 'other'), 1000);
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [steps]); // Adicionei 'steps' na dependência para ler o estado atual

    // Auto Scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, showAskAi]);

    const addMessage = (sender: string, text: string, type: 'user' | 'other') => {
        const newMessage = { id: Date.now(), sender, text, type };
        setMessages(prev => [...prev, newMessage]);

        const len = text.length;
        setTotalChars(prev => prev + len);
        if (type === 'user') setUserChars(prev => prev + len);
    };

    const getTalkRatio = () => {
        if (totalChars === 0) return 0;
        return Math.round((userChars / totalChars) * 100);
    };

    // --- Lógica de IA - Conectada ao Backend Real ---
    const handleAiSubmit = async () => {
        if (!aiQuery.trim()) return;
        setIsAiLoading(true);
        setAiResponse(null);

        try {
            // Montar transcrição a partir das mensagens capturadas
            const transcription = messages
                .map(m => `${m.sender}: ${m.text}`)
                .join('\n');

            // Chamar API real do backend Hunfly (endpoint público)
            const response = await fetch('http://localhost:3001/api/extension/meeting-suggestion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcription: transcription || 'Reunião em andamento...',
                    question: aiQuery
                }),
            });

            const data = await response.json();

            if (data.ok && data.suggestion) {
                setAiResponse(data.suggestion);
            } else {
                setAiResponse('Erro ao gerar sugestão. Verifique se o backend está rodando.');
            }
        } catch (error) {
            console.error('[Hunfly AI] Error:', error);
            setAiResponse('Erro de conexão. Verifique se o backend está rodando na porta 3001.');
        } finally {
            setIsAiLoading(false);
        }
    };

    // --- Lógica de Arrastar (Header) ---
    const handleHeaderMouseDown = (e: React.MouseEvent) => {
        // Se clicar nos botões, não arrasta
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;

        setIsDragging(true);
        dragRef.current = { startX: e.clientX - position.x, startY: e.clientY - position.y };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !dragRef.current) return;

            let newX = e.clientX - dragRef.current.startX;
            let newY = e.clientY - dragRef.current.startY;

            // --- AJUSTE DE RESPONSIVIDADE (MARGENS) ---
            const panelWidth = 340;
            // Altura dinâmica ajustada para permitir chegar mais perto da borda
            // Antes estava 500 fixo, agora calcula melhor
            const panelHeight = isExpanded ? 450 : 50;

            const maxX = window.innerWidth - panelWidth;
            const maxY = window.innerHeight - panelHeight;

            // Mantém margem mínima de 5px (Bem pertinho da borda)
            newX = Math.max(5, Math.min(maxX - 5, newX));
            newY = Math.max(5, Math.min(maxY - 5, newY));

            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isExpanded]);

    const toggleListening = () => {
        setIsListening(!isListening);
        window.postMessage({ type: !isListening ? 'START_LISTENING' : 'STOP_LISTENING' }, '*');
    };

    return (
        <div
            className={`hunfly-wrapper ${isExpanded ? 'open' : ''}`}
            style={{ left: position.x, top: position.y }}
        >
            <div className="hunfly-glass-panel">

                {/* --- HEADER (Area de Arrastar) --- */}
                <div
                    className="panel-header"
                    onMouseDown={handleHeaderMouseDown}
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                    <div className="header-left">
                        <div className={`status-dot ${isListening ? 'pulse' : ''}`} />
                        <span className="brand-text">Hunfly</span>
                    </div>

                    <div className="header-right">
                        <div className="ratio-badge">
                            <span className="ratio-val">{getTalkRatio()}%</span>
                            <span className="ratio-label">Você</span>
                        </div>

                        <button
                            className={`icon-btn ${showAskAi ? 'active-brain' : ''}`}
                            onClick={() => setShowAskAi(!showAskAi)}
                            title="Perguntar à IA"
                        >
                            <Brain size={18} strokeWidth={2} />
                        </button>

                        <button className="icon-btn" onClick={() => setIsExpanded(!isExpanded)}>
                            {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                        </button>
                    </div>
                </div>

                {isExpanded && (
                    <div className="panel-content">

                        {/* 1. SEÇÃO IA (Separada e Isolada) */}
                        {showAskAi && (
                            <div className="ai-section slide-down">
                                <div className="ai-input-wrapper">
                                    <input
                                        autoFocus
                                        placeholder="Ex: Cliente achou caro..."
                                        value={aiQuery}
                                        onChange={(e) => setAiQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAiSubmit()}
                                    />
                                    <button className="send-ai-btn" onClick={handleAiSubmit}>
                                        {isAiLoading ? <span className="loader-spin">Wait</span> : <Send size={14} />}
                                    </button>
                                </div>
                                {/* Resposta da IA fica AQUI dentro */}
                                {aiResponse && (
                                    <div className="ai-result-box">
                                        <div className="ai-label"><Sparkles size={10} /> Copiloto:</div>
                                        <p>{aiResponse}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 2. CHAT FANTASMA (Texto Corrido) */}
                        <div className="chat-container" ref={scrollRef}>
                            <div className="chat-fade-mask"></div>
                            {messages.length === 0 && (
                                <div className="empty-state">Inicie a reunião...</div>
                            )}
                            {messages.map((msg) => (
                                <div key={msg.id} className={`chat-line ${msg.type}`}>
                                    <span className="line-sender">{msg.sender}: </span>
                                    <span className="line-text">{msg.text}</span>
                                </div>
                            ))}
                        </div>

                        {/* 3. TIMELINE (Limpa e Conectada) */}
                        <div className="timeline-section">
                            <div className="timeline-track"></div>
                            <div className="timeline-steps">
                                {steps.map((step) => (
                                    <div key={step.id} className={`t-step ${step.status}`}>
                                        {/* Circulo */}
                                        <div className="t-circle">
                                            {step.status === 'completed' && <Check size={10} strokeWidth={4} />}
                                        </div>
                                        {/* Texto Point */}
                                        <span className="t-label">{step.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. FOOTER */}
                        <div className="panel-footer">
                            <button
                                className={`mic-btn ${isListening ? 'listening' : ''}`}
                                onClick={toggleListening}
                            >
                                {isListening ? <Mic size={18} /> : <MicOff size={18} />}
                                <span>{isListening ? 'Parar' : 'Iniciar'}</span>
                            </button>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};