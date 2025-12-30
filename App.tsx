
import React, { useState, useRef } from 'react';
import { AppStatus, TranslationResult, FileData, TargetLanguage, OCRMode } from './types';
import { translateDocument } from './services/geminiService';
import { fileToBase64, downloadAsDoc, downloadAsTxt, downloadAsPdf } from './utils/pdfUtils';
import { Button } from './components/Button';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<number>(14);
  const [lineHeight, setLineHeight] = useState<number>(1.6);
  const [targetLang, setTargetLang] = useState<TargetLanguage>('Português');
  const [ocrMode, setOcrMode] = useState<OCRMode>('rápido');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError("Por favor, envie uma imagem (JPG, PNG) ou um arquivo PDF.");
      return;
    }

    try {
      setStatus(AppStatus.PROCESSING);
      setError(null);
      
      const base64 = await fileToBase64(file);
      setFileData({
        base64,
        mimeType: file.type,
        name: file.name
      });

      const translation = await translateDocument(base64, file.type, targetLang, ocrMode);
      setResult(translation);
      setStatus(AppStatus.SUCCESS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleReset = () => {
    setFileData(null);
    setResult(null);
    setError(null);
    setStatus(AppStatus.IDLE);
    setFontSize(14);
    setLineHeight(1.6);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const exportFormats = [
    { 
      label: 'PDF', 
      icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z', 
      action: (txt: string, name: string) => downloadAsPdf(txt, name, fontSize, lineHeight), 
      color: 'bg-red-600 hover:bg-red-700 shadow-red-200' 
    },
    { 
      label: 'Word (DOC)', 
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', 
      action: (txt: string, name: string) => downloadAsDoc(txt, name, fontSize, lineHeight), 
      color: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' 
    },
    { 
      label: 'Texto (TXT)', 
      icon: 'M4 6h16M4 12h16M4 18h7', 
      action: (txt: string, name: string) => downloadAsTxt(txt, name), 
      color: 'bg-slate-600 hover:bg-slate-700 shadow-slate-200' 
    },
  ];

  const languages: TargetLanguage[] = ['Português', 'Inglês', 'Espanhol'];

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4">
      <header className="max-w-4xl w-full text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-blue-100 p-3 rounded-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Tradutor AI de Documentos</h1>
        <p className="text-slate-500 text-lg">Traduza imagens e PDFs instantaneamente com precisão de IA.</p>
        
        {/* Selectors Bar */}
        {status === AppStatus.IDLE && (
          <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-slate-600 font-medium text-sm">Traduzir para:</span>
              <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setTargetLang(lang)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      targetLang === lang 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-600 font-medium text-sm">Qualidade OCR:</span>
              <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                {(['rápido', 'alta-precisão'] as OCRMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setOcrMode(mode)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                      ocrMode === mode 
                        ? 'bg-emerald-600 text-white shadow-md' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {mode.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-6xl w-full">
        {status === AppStatus.IDLE && (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center transition-all hover:border-blue-400 hover:bg-blue-50/30 group">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,application/pdf"
              className="hidden"
            />
            <div className="mb-6 flex justify-center">
              <div className="bg-slate-100 p-4 rounded-full group-hover:bg-blue-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Selecione seu arquivo</h3>
            <p className="text-slate-500 mb-8">Arraste e solte ou clique para navegar (Imagens ou PDF)</p>
            <Button onClick={() => fileInputRef.current?.click()}>
              Iniciar Tradução {ocrMode === 'alta-precisão' ? 'Premium' : ''}
            </Button>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400 italic">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {ocrMode === 'alta-precisão' 
                ? "O modo Alta Precisão usa raciocínio avançado para layouts complexos." 
                : "O modo Rápido é otimizado para documentos simples e velocidade."}
            </div>
          </div>
        )}

        {status === AppStatus.PROCESSING && (
          <div className="bg-white rounded-3xl p-12 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center">
            <div className="relative mb-8">
              <div className="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Processando com Inteligência Artificial</h2>
            <p className="text-slate-500 max-w-sm">Extraindo texto e traduzindo para o <strong>{targetLang.toLowerCase()}</strong> em modo <strong>{ocrMode.replace('-', ' ')}</strong>...</p>
          </div>
        )}

        {status === AppStatus.ERROR && (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center">
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-900 mb-2">Erro no Processamento</h2>
            <p className="text-red-700 mb-6">{error}</p>
            <Button variant="danger" onClick={handleReset}>Tentar Novamente</Button>
          </div>
        )}

        {status === AppStatus.SUCCESS && result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50">
              {/* Header Success Section */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-slate-100 pb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Tradução Concluída</h2>
                  <p className="text-slate-500">Idioma: <span className="text-blue-600 font-medium">{result.detectedLanguage}</span> → <span className="text-emerald-600 font-medium">{targetLang}</span> ({ocrMode})</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={handleReset} className="h-11 px-4 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Novo
                  </Button>
                  
                  <div className="h-11 w-px bg-slate-100 mx-1 hidden sm:block"></div>
                  
                  <div className="flex flex-wrap gap-2">
                    {exportFormats.map((fmt) => (
                      <Button 
                        key={fmt.label}
                        onClick={() => fmt.action(result.translatedText, fileData?.name || 'documento')}
                        className={`h-11 px-4 text-sm ${fmt.color} text-white transition-all`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={fmt.icon} />
                        </svg>
                        {fmt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Layout Content */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Formatting Controls Sidebar */}
                <div className="xl:col-span-3 space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Estilo de Exportação
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-slate-600">Fonte</label>
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">{fontSize}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="32" 
                        value={fontSize} 
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-slate-600">Linhas</label>
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">{lineHeight}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="3" 
                        step="0.1"
                        value={lineHeight} 
                        onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Document Previews */}
                <div className="xl:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {fileData && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Original
                      </h4>
                      <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center shadow-inner">
                        {fileData.mimeType.startsWith('image/') ? (
                          <img 
                            src={`data:${fileData.mimeType};base64,${fileData.base64}`} 
                            alt="Original" 
                            className="w-full h-full object-contain p-2"
                          />
                        ) : (
                          <div className="text-center p-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <p className="text-slate-500 font-semibold truncate max-w-[180px] mx-auto text-xs">{fileData.name}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-bold text-blue-800 uppercase text-xs tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                      Traduzido
                    </h4>
                    <div 
                      className="aspect-[3/4] rounded-2xl overflow-y-auto bg-blue-50/20 border border-blue-100 p-8 whitespace-pre-wrap text-slate-800 shadow-inner scrollbar-thin scrollbar-thumb-blue-200"
                      style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
                    >
                      {result.translatedText}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto pt-12 text-slate-400 text-[10px] text-center uppercase tracking-widest">
        <p className="mb-1">AI Document Translator • Gemini 3 Vision</p>
        <p>OCR de precisão milimétrica • Tradução Contextual</p>
      </footer>
    </div>
  );
};

export default App;
