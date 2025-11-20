import React, { useState, useRef, useEffect } from 'react';
import { Upload, Wand2, ShoppingBag, Sparkles, Loader2, Copy, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';

const App = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [enhancedImage, setEnhancedImage] = useState(null);
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('idle'); // idle, processing, complete, error
  const [errorMsg, setErrorMsg] = useState('');
  const [logs, setLogs] = useState([]);

  const fileInputRef = useRef(null);

  const apiKey = ""; // API Key provided by execution environment

  const addLog = (message) => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message }]);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(URL.createObjectURL(file));
        // Remove data URL prefix for API calls
        const base64String = reader.result.split(',')[1];
        setImageBase64(base64String);
        setEnhancedImage(null);
        setGeneratedTitle('');
        setStep('idle');
        setLogs([]);
        setErrorMsg('');
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!imageBase64) return;

    setLoading(true);
    setStep('processing');
    setLogs([]);
    setErrorMsg('');
    addLog("Initializing AI Agents...");

    try {
      // ---------------------------------------------------------
      // AGENT 1: COPYWRITER (Text Generation)
      // ---------------------------------------------------------
      addLog("Agent 1 (Copywriter): Analyzing visual features...");
      
      const titlePrompt = "Look at this product image carefully. Generate a single, high-converting, SEO-friendly e-commerce product title. It should be catchy, mention key features (color, material, type) if visible, and be under 100 characters. Do not include quotes.";
      
      const titleResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [
                { text: titlePrompt },
                { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
              ]
            }]
          })
        }
      );

      if (!titleResponse.ok) throw new Error("Copywriter Agent failed to respond");
      const titleData = await titleResponse.json();
      const title = titleData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      
      if (title) {
        setGeneratedTitle(title);
        addLog("Agent 1: Title generated successfully.");
      } else {
        throw new Error("Agent 1 returned empty result");
      }

      // ---------------------------------------------------------
      // AGENT 2: STUDIO PHOTOGRAPHER (Image Enhancement)
      // ---------------------------------------------------------
      addLog("Agent 2 (Studio): Setting up lighting and composition...");
      
      const enhancePrompt = "Turn this into a professional e-commerce product shot. Keep the product exactly as it is, but improve the lighting to be soft studio lighting, remove clutter, and place it on a clean, neutral, high-end background. High resolution, photorealistic.";
      
      const enhanceResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: enhancePrompt },
                { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
              ]
            }],
            generationConfig: {
              responseModalities: ['IMAGE']
            }
          })
        }
      );

      if (!enhanceResponse.ok) throw new Error("Studio Agent failed to render");
      
      const enhanceData = await enhanceResponse.json();
      const enhancedBase64 = enhanceData.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

      if (enhancedBase64) {
        setEnhancedImage(`data:image/jpeg;base64,${enhancedBase64}`);
        addLog("Agent 2: Rendering complete.");
      } else {
        throw new Error("Agent 2 could not generate image");
      }

      setStep('complete');

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred.");
      setStep('error');
      addLog(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">Product<span className="text-blue-600">AI</span>gent</span>
          </div>
          <div className="text-sm font-medium text-slate-500">
            v2.5-flash
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        
          {/* Hero / Upload Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
            Transform Snapshots into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Sales</span>
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Upload a raw product photo. Our AI agents will write the copy and restage the photo for maximum conversion.
          </p>

          <div 
            onClick={() => fileInputRef.current.click()}
            className={`
              relative group cursor-pointer 
              border-2 border-dashed rounded-2xl p-10 
              transition-all duration-300 ease-in-out
              ${selectedImage ? 'border-blue-300 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400 hover:bg-white bg-slate-100/50'}
            `}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept="image/*" 
              className="hidden" 
            />
            
            {!selectedImage ? (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">Click to upload product image</h3>
                <p className="text-slate-500 text-sm mt-1">Supports JPG, PNG</p>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                <div className="relative">
                   <div className="absolute -top-3 -left-3 bg-white px-2 py-1 rounded shadow text-xs font-bold text-slate-500">ORIGINAL</div>
                   <img src={selectedImage} alt="Preview" className="max-h-64 rounded-lg shadow-md object-contain bg-white" />
                </div>
                
                {step === 'idle' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); processImage(); }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-1"
                  >
                    <Wand2 className="w-5 h-5" />
                    Activate Agents
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Processing Status / Logs */}
        {(step === 'processing' || (step === 'complete' && logs.length > 0)) && (
           <div className="mb-8 bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-sm overflow-hidden">
             <div className="flex items-center gap-2 mb-3 text-slate-100 border-b border-slate-700 pb-2">
               <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
               <span className="font-bold">Agent Activity Log</span>
             </div>
             <div className="space-y-1 max-h-40 overflow-y-auto">
               {logs.map((log, idx) => (
                 <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-left-2">
                   <span className="text-slate-500">[{log.time}]</span>
                   <span>{log.message}</span>
                 </div>
               ))}
               {step === 'processing' && (
                  <div className="flex gap-3 animate-pulse">
                    <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>
                    <span className="text-blue-400">Processing...</span>
                  </div>
               )}
             </div>
           </div>
        )}

        {/* Error Display */}
        {step === 'error' && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold">Agent Error</p>
              <p className="text-sm">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {step === 'complete' && (
          <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Result 1: Title */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <ShoppingBag className="w-5 h-5 text-violet-600" />
                   <h3 className="font-bold text-slate-700">Agent 1: Copywriter</h3>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Complete
                </span>
              </div>
              <div className="p-8 flex-1 flex flex-col justify-center">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Generated Title</label>
                <p className="text-xl md:text-2xl font-medium text-slate-800 leading-relaxed">
                  {generatedTitle}
                </p>
                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={() => copyToClipboard(generatedTitle)}
                    className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" /> Copy Title
                  </button>
                </div>
              </div>
            </div>

            {/* Result 2: Image */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <ImageIcon className="w-5 h-5 text-indigo-600" />
                   <h3 className="font-bold text-slate-700">Agent 2: Studio</h3>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Complete
                </span>
              </div>
              <div className="p-4 flex-1 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50 flex items-center justify-center min-h-[300px]">
                {enhancedImage ? (
                  <img 
                    src={enhancedImage} 
                    alt="Enhanced Product" 
                    className="w-full h-full object-cover rounded-lg shadow-lg transition-transform duration-700 hover:scale-[1.02]" 
                  />
                ) : (
                  <div className="text-slate-400 flex flex-col items-center">
                     <Loader2 className="w-8 h-8 animate-spin mb-2" />
                     <span>Rendering...</span>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
                 <span className="text-xs text-slate-500">Enhanced using Generative AI</span>
                 <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = enhancedImage;
                      link.download = 'enhanced-product.jpg';
                      link.click();
                    }}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Download Image
                 </button>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};

export default App;
