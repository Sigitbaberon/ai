import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateContent } from './services/geminiService';
import type { Message } from './types';
import { MessageRole } from './types';
import { SendIcon, CopyIcon, CheckIcon, BotIcon, UserIcon, LoadingSpinner, TelegramIcon } from './constants';

// --- Component Definitions (defined outside App to prevent re-renders) ---

interface HeaderProps {
    botId: string;
    tokenSnippet: string;
}
const Header: React.FC<HeaderProps> = ({ botId, tokenSnippet }) => (
    <header className="bg-white/50 backdrop-blur-lg p-4 border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-800">Telegram Bot Content Assistant</h1>
            <p className="text-sm text-slate-500 mt-1">
                Generate content for your bot and share it directly via the Telegram app.
            </p>
            <div className="text-xs text-slate-400 mt-2 bg-slate-50 p-2 rounded-md">
                <span className="font-mono">Bot ID: {botId}</span> | <span className="font-mono">Token: {tokenSnippet}</span>
            </div>
        </div>
    </header>
);


interface MessageProps {
    message: Message;
}
const MessageBubble: React.FC<MessageProps> = ({ message }) => {
    const [hasCopied, setHasCopied] = useState(false);
    const isUser = message.role === MessageRole.USER;

    const handleCopy = () => {
        navigator.clipboard.writeText(message.text);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    const handleSendToTelegram = () => {
        const text = encodeURIComponent(message.text);
        const telegramUrl = `https://t.me/share/url?url= &text=${text}`;
        window.open(telegramUrl, '_blank', 'noopener,noreferrer');
    };

    const bubbleClasses = isUser
        ? 'bg-blue-600 text-white self-end'
        : 'bg-slate-100 text-slate-800 self-start';
    
    const Icon = isUser ? UserIcon : BotIcon;

    return (
        <div className={`flex items-start gap-3 w-full max-w-xl ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`}>
             <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                <Icon className="w-5 h-5"/>
            </div>
            <div className={`relative rounded-xl px-4 py-3 shadow-sm ${bubbleClasses}`}>
                <p className="whitespace-pre-wrap">{message.text}</p>
                {!isUser && (
                    <div className="absolute -bottom-3 right-0 flex items-center gap-1.5">
                         <button
                            onClick={handleCopy}
                            className="bg-white p-1.5 rounded-full shadow-md hover:bg-slate-100 transition-all text-slate-500 hover:text-blue-600"
                            aria-label="Copy message"
                        >
                            {hasCopied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={handleSendToTelegram}
                            className="bg-white p-1.5 rounded-full shadow-md hover:bg-slate-100 transition-all text-slate-500 hover:text-blue-600"
                            aria-label="Send to Telegram"
                        >
                            <TelegramIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


interface ChatWindowProps {
    messages: Message[];
    isLoading: boolean;
}
const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex flex-col gap-6">
                {messages.map((msg, index) => (
                    <MessageBubble key={index} message={msg} />
                ))}
                {isLoading && (
                     <div className="flex items-start gap-3 w-full max-w-xl self-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                            <BotIcon className="w-5 h-5"/>
                        </div>
                        <div className="relative rounded-xl px-4 py-3 shadow-sm bg-slate-100 text-slate-800 self-start flex items-center">
                            <LoadingSpinner />
                            <span className="text-slate-500">Generating...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};


interface PromptFormProps {
    onSendMessage: (prompt: string) => void;
    isLoading: boolean;
}
const PromptForm: React.FC<PromptFormProps> = ({ onSendMessage, isLoading }) => {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim() && !isLoading) {
            onSendMessage(prompt.trim());
            setPrompt('');
        }
    };

    return (
        <div className="p-4 bg-white border-t border-slate-200">
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Type your prompt here..."
                    className="flex-1 p-3 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send message"
                >
                    <SendIcon className="w-6 h-6" />
                </button>
            </form>
        </div>
    );
};


interface SettingsProps {
    systemInstruction: string;
    onSave: (instruction: string) => void;
}
const Settings: React.FC<SettingsProps> = ({ systemInstruction, onSave }) => {
    const [localInstruction, setLocalInstruction] = useState(systemInstruction);

    const handleSave = () => {
        onSave(localInstruction);
    };

    return (
        <div className="w-full md:w-80 lg:w-96 bg-slate-50 border-l border-slate-200 p-4 flex flex-col">
            <h2 className="text-lg font-semibold text-slate-700 mb-3">Bot Personality</h2>
            <p className="text-sm text-slate-500 mb-4">Set the system instruction to define how your bot should behave.</p>
            <textarea
                value={localInstruction}
                onChange={(e) => setLocalInstruction(e.target.value)}
                rows={8}
                className="w-full p-2 border border-slate-300 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="e.g., You are a friendly and helpful assistant."
            />
            <button
                onClick={handleSave}
                className="mt-4 w-full bg-slate-700 text-white py-2 rounded-md hover:bg-slate-800 transition-colors"
            >
                Save Personality
            </button>
        </div>
    );
}

// --- Main App Component ---

const App: React.FC = () => {
    const USER_BOT_ID = "7588681180";
    const USER_BOT_TOKEN_SNIPPET = "7588...NB_Y";
    const INITIAL_SYSTEM_PROMPT = "You are a helpful and witty Telegram bot assistant. Your responses should be concise, engaging, and suitable for a chat application.";

    const [systemInstruction, setSystemInstruction] = useState<string>(INITIAL_SYSTEM_PROMPT);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSendMessage = useCallback(async (prompt: string) => {
        if (!prompt || isLoading) return;

        const newUserMessage: Message = { role: MessageRole.USER, text: prompt };
        setMessages(prev => [...prev, newUserMessage]);
        setIsLoading(true);
        setError(null);

        try {
            const responseText = await generateContent(systemInstruction, prompt);
            const newModelMessage: Message = { role: MessageRole.MODEL, text: responseText };
            setMessages(prev => [...prev, newModelMessage]);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
            setError(errorMessage);
            const errorModelMessage: Message = { role: MessageRole.MODEL, text: `Sorry, something went wrong: ${errorMessage}` };
            setMessages(prev => [...prev, errorModelMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, systemInstruction]);
    
    const handleSaveSettings = (newInstruction: string) => {
        setSystemInstruction(newInstruction);
        setMessages([]); // Clear chat history when personality changes
    };

    return (
        <div className="h-screen w-screen bg-slate-100 flex flex-col">
            <Header botId={USER_BOT_ID} tokenSnippet={USER_BOT_TOKEN_SNIPPET} />
            <div className="flex-1 flex overflow-hidden">
                <main className="flex-1 flex flex-col bg-white shadow-inner">
                    <ChatWindow messages={messages} isLoading={isLoading} />
                    {error && <div className="p-4 text-center text-red-500 bg-red-50">{error}</div>}
                    <PromptForm onSendMessage={handleSendMessage} isLoading={isLoading} />
                </main>
                <aside className="hidden md:flex">
                    <Settings systemInstruction={systemInstruction} onSave={handleSaveSettings} />
                </aside>
            </div>
        </div>
    );
};

export default App;