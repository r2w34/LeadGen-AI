
import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, Video, Wand2, Upload, 
  Download, Play, ImagePlus, MonitorPlay, Loader2, AlertCircle, Sparkles
} from 'lucide-react';
import { editImage, generateHighQualityImage, generateVeoVideo } from '../services/gemini';

const MediaStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'editor' | 'generator' | 'video'>('editor');
  
  // Editor State
  const [editorImage, setEditorImage] = useState<string | null>(null);
  const [editorMimeType, setEditorMimeType] = useState<string>('');
  const [editorPrompt, setEditorPrompt] = useState('');
  const [editorResult, setEditorResult] = useState<string | null>(null);
  
  // Generator State
  const [genPrompt, setGenPrompt] = useState('');
  const [genSize, setGenSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [genResult, setGenResult] = useState<string | null>(null);

  // Video State
  const [videoImage, setVideoImage] = useState<string | null>(null);
  const [videoMimeType, setVideoMimeType] = useState<string>('');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoResult, setVideoResult] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // --- Helpers ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setImg: (s: string) => void, setMime: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Extract raw base64 and mime
        const mime = base64String.split(';')[0].split(':')[1];
        const data = base64String.split(',')[1];
        
        setImg(data);
        setMime(mime);
      };
      reader.readAsDataURL(file);
    }
  };

  const checkApiKey = async () => {
    try {
       // Type assertion to avoid conflict with global types
       const win = window as any;
       if (win.aistudio && win.aistudio.hasSelectedApiKey) {
          const hasKey = await win.aistudio.hasSelectedApiKey();
          if (!hasKey) {
             await win.aistudio.openSelectKey();
             return await win.aistudio.hasSelectedApiKey();
          }
          return true;
       }
       return true; // Fallback if not in environment requiring selection
    } catch (e) {
       console.error("API Key Check Failed", e);
       return false;
    }
  };

  // --- Actions ---

  const handleEditImage = async () => {
    if (!editorImage || !editorPrompt) return;
    setLoading(true);
    setError(null);
    try {
       const result = await editImage(editorImage, editorMimeType, editorPrompt);
       if (result) {
         setEditorResult(`data:${editorMimeType};base64,${result}`);
       } else {
         setError("Failed to generate image edit.");
       }
    } catch (e) {
       setError("Error editing image. Please try again.");
    } finally {
       setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!genPrompt) return;
    setLoading(true);
    setError(null);
    try {
       const hasKey = await checkApiKey();
       if (!hasKey) {
          setError("API Key selection is required for high-quality image generation.");
          setLoading(false);
          return;
       }

       const result = await generateHighQualityImage(genPrompt, genSize);
       if (result) {
          setGenResult(`data:image/png;base64,${result}`);
       } else {
          setError("Failed to generate image.");
       }
    } catch (e) {
       setError("Error generating image. Ensure you have a valid paid API key selected.");
    } finally {
       setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoImage) return;
    setLoading(true);
    setError(null);
    try {
       const hasKey = await checkApiKey();
       if (!hasKey) {
          setError("API Key selection is required for Veo video generation.");
          setLoading(false);
          return;
       }

       const result = await generateVeoVideo(videoImage, videoMimeType, videoAspectRatio);
       if (result) {
          setVideoResult(result);
       } else {
          setError("Failed to generate video.");
       }
    } catch (e) {
       setError("Error generating video. Veo requires a paid API key.");
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white overflow-hidden">
       {/* Header */}
       <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-zinc-950">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-white" />
             </div>
             <h1 className="text-lg font-semibold text-white">Creative Studio</h1>
          </div>
          <div className="flex gap-2 bg-zinc-900 p-1 rounded-lg">
             {[
                { id: 'editor', label: 'Magic Editor', icon: ImagePlus },
                { id: 'generator', label: 'Image Gen', icon: ImageIcon },
                { id: 'video', label: 'Motion Lab', icon: Video },
             ].map(tab => (
                <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)}
                   className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                   <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
             ))}
          </div>
       </div>

       {/* Content */}
       <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
             
             {/* Error Message */}
             {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 flex items-center gap-3 text-rose-400">
                   <AlertCircle className="w-5 h-5" />
                   <p className="text-sm">{error}</p>
                </div>
             )}

             {/* === EDITOR === */}
             {activeTab === 'editor' && (
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                         <h3 className="text-sm font-semibold text-zinc-300 mb-4">Input Image</h3>
                         <div 
                           onClick={() => fileInputRef.current?.click()}
                           className="aspect-square border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-zinc-900 transition-all overflow-hidden"
                         >
                            {editorImage ? (
                               <img src={`data:${editorMimeType};base64,${editorImage}`} className="w-full h-full object-cover" alt="Input" />
                            ) : (
                               <>
                                  <Upload className="w-8 h-8 text-zinc-600 mb-2" />
                                  <span className="text-xs text-zinc-500">Click to upload</span>
                               </>
                            )}
                         </div>
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, setEditorImage, setEditorMimeType)} />
                      </div>

                      <div className="space-y-2">
                         <label className="text-xs font-medium text-zinc-400">Magic Prompt</label>
                         <textarea 
                            rows={3}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none resize-none"
                            placeholder="e.g. Add a retro filter, remove background..."
                            value={editorPrompt}
                            onChange={(e) => setEditorPrompt(e.target.value)}
                         />
                      </div>

                      <button 
                         onClick={handleEditImage}
                         disabled={loading || !editorImage || !editorPrompt}
                         className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                         {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                         Generate Edit
                      </button>
                   </div>

                   <div className="bg-black border border-zinc-800 rounded-xl flex items-center justify-center relative overflow-hidden">
                      {editorResult ? (
                         <img src={editorResult} className="w-full h-full object-contain" alt="Result" />
                      ) : (
                         <div className="text-center text-zinc-600">
                            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Result will appear here</p>
                         </div>
                      )}
                      {editorResult && (
                         <a href={editorResult} download="edited_image.png" className="absolute bottom-4 right-4 p-2 bg-black/50 backdrop-blur rounded-lg text-white hover:bg-black/70 transition-colors">
                            <Download className="w-4 h-4" />
                         </a>
                      )}
                   </div>
                </div>
             )}

             {/* === GENERATOR === */}
             {activeTab === 'generator' && (
                <div className="space-y-6">
                   <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                      <div className="flex gap-4 mb-4">
                         <div className="flex-1">
                            <label className="text-xs font-medium text-zinc-400 block mb-2">Prompt</label>
                            <input 
                               type="text"
                               className="w-full bg-zinc-900 border border-white/10 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none"
                               placeholder="e.g. A futuristic city made of crystal..."
                               value={genPrompt}
                               onChange={(e) => setGenPrompt(e.target.value)}
                            />
                         </div>
                         <div className="w-32">
                            <label className="text-xs font-medium text-zinc-400 block mb-2">Quality</label>
                            <select 
                               value={genSize}
                               onChange={(e) => setGenSize(e.target.value as any)}
                               className="w-full bg-zinc-900 border border-white/10 rounded-lg p-3 text-sm text-white outline-none"
                            >
                               <option value="1K">1K</option>
                               <option value="2K">2K (Pro)</option>
                               <option value="4K">4K (Pro)</option>
                            </select>
                         </div>
                      </div>
                      
                      <div className="flex justify-end">
                         <button 
                            onClick={handleGenerateImage}
                            disabled={loading || !genPrompt}
                            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                         >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Generate Art
                         </button>
                      </div>
                   </div>

                   <div className="aspect-video bg-black border border-zinc-800 rounded-xl flex items-center justify-center relative overflow-hidden group">
                      {genResult ? (
                         <img src={genResult} className="w-full h-full object-contain" alt="Generated" />
                      ) : (
                         <div className="text-center text-zinc-600">
                            <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p className="text-sm">High-fidelity generation area</p>
                         </div>
                      )}
                      {genResult && (
                         <a href={genResult} download="generated_art.png" className="absolute bottom-6 right-6 p-3 bg-black/50 backdrop-blur rounded-xl text-white hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100">
                            <Download className="w-5 h-5" />
                         </a>
                      )}
                   </div>
                </div>
             )}

             {/* === VIDEO (VEO) === */}
             {activeTab === 'video' && (
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                         <h3 className="text-sm font-semibold text-zinc-300 mb-4">Source Image</h3>
                         <div 
                           onClick={() => videoFileInputRef.current?.click()}
                           className="aspect-video border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-zinc-900 transition-all overflow-hidden"
                         >
                            {videoImage ? (
                               <img src={`data:${videoMimeType};base64,${videoImage}`} className="w-full h-full object-cover" alt="Source" />
                            ) : (
                               <>
                                  <Upload className="w-8 h-8 text-zinc-600 mb-2" />
                                  <span className="text-xs text-zinc-500">Upload Frame</span>
                               </>
                            )}
                         </div>
                         <input type="file" ref={videoFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, setVideoImage, setVideoMimeType)} />
                      </div>

                      <div className="space-y-2">
                         <label className="text-xs font-medium text-zinc-400">Aspect Ratio</label>
                         <div className="grid grid-cols-2 gap-3">
                            {['16:9', '9:16'].map(ratio => (
                               <button 
                                  key={ratio}
                                  onClick={() => setVideoAspectRatio(ratio as any)}
                                  className={`py-2 text-sm rounded-lg border transition-all ${videoAspectRatio === ratio ? 'bg-purple-600 border-purple-600 text-white' : 'bg-zinc-900 border-white/10 text-zinc-400'}`}
                               >
                                  {ratio === '16:9' ? 'Landscape' : 'Portrait'} ({ratio})
                               </button>
                            ))}
                         </div>
                      </div>

                      <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-lg flex gap-3">
                         <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
                         <p className="text-xs text-blue-300 leading-relaxed">
                            Generating video with Veo takes approx. 1-2 minutes. Please be patient while the AI renders the frames.
                         </p>
                      </div>

                      <button 
                         onClick={handleGenerateVideo}
                         disabled={loading || !videoImage}
                         className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                         {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MonitorPlay className="w-4 h-4" />}
                         Animate with Veo
                      </button>
                   </div>

                   <div className="bg-black border border-zinc-800 rounded-xl flex items-center justify-center relative overflow-hidden group">
                      {videoResult ? (
                         <video controls className="w-full h-full object-contain" src={videoResult} />
                      ) : (
                         <div className="text-center text-zinc-600">
                            <Play className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p className="text-sm">Video output area</p>
                         </div>
                      )}
                   </div>
                </div>
             )}

          </div>
       </div>
    </div>
  );
};

export default MediaStudio;
