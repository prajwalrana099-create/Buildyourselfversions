/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Upload, 
  User, 
  Briefcase, 
  Stethoscope, 
  Scale, 
  FlaskConical, 
  Calculator, 
  Shield, 
  Clapperboard, 
  GraduationCap, 
  HardHat, 
  Plane,
  Sparkles,
  RefreshCw,
  Download,
  Image as ImageIcon,
  Github
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PROFESSIONS = [
  { id: 'doctor', label: 'Doctor', icon: Stethoscope, description: 'White coat, stethoscope, clinical setting' },
  { id: 'lawyer', label: 'Lawyer', icon: Scale, description: 'Formal suit, courtroom or law library' },
  { id: 'scientist', label: 'Scientist', icon: FlaskConical, description: 'Lab coat, high-tech laboratory' },
  { id: 'accountant', label: 'Accountant', icon: Calculator, description: 'Business casual, office with financial tools' },
  { id: 'politician', label: 'Politician', icon: User, description: 'Formal suit, podium or flags background' },
  { id: 'businessman', label: 'Entrepreneur', icon: Briefcase, description: 'Modern suit, corporate office' },
  { id: 'army', label: 'Army Officer', icon: Shield, description: 'Military uniform, tactical base' },
  { id: 'actor', label: 'Actor', icon: Clapperboard, description: 'Red carpet or film studio' },
  { id: 'teacher', label: 'Teacher', icon: GraduationCap, description: 'Classroom, chalkboard background' },
  { id: 'engineer', label: 'Engineer', icon: HardHat, description: 'Safety vest, hard hat, construction site' },
  { id: 'pilot', label: 'Pilot', icon: Plane, description: 'Pilot uniform, cockpit or hangar' },
];

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [githubUser, setGithubUser] = useState<{ name: string, avatarUrl: string } | null>(null);
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        const { avatarUrl, name } = event.data;
        setGithubUser({ name, avatarUrl });
        setSelectedImage(avatarUrl); // Use GitHub avatar as the source image
        setResultImage(null);
        setError(null);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleGithubConnect = async () => {
    try {
      const response = await fetch('/api/auth/github/url');
      const { url } = await response.json();
      window.open(url, 'github_oauth', 'width=600,height=700');
    } catch (err) {
      setError("Failed to initiate GitHub connection.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResultImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTransform = async () => {
    if (!selectedImage || !selectedProfession) return;

    setIsTransforming(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const profession = PROFESSIONS.find(p => p.id === selectedProfession);
      
      const base64Data = selectedImage.split(',')[1];
      const mimeType = selectedImage.split(';')[0].split(':')[1];

      const prompt = `Transform the person in this image into a ${profession?.label}. 
      CRITICAL: Preserve the person's exact face, identity, and key facial features. 
      The person should now be wearing ${profession?.description}. 
      The background should be a professional ${profession?.label} environment. 
      Style: Photorealistic, professional lighting, high resolution, cinematic composition, natural facial expression. 
      Do not distort the face or body. Ensure it looks like the SAME person in this new role.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setResultImage(`data:image/png;base64,${part.inlineData.data}`);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        throw new Error("The AI didn't return an image. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during transformation.");
    } finally {
      setIsTransforming(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setSelectedProfession(null);
    setResultImage(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] font-sans selection:bg-black selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">PersonaMorph AI</h1>
          </div>
          {selectedImage && (
            <button 
              onClick={reset}
              className="text-sm font-medium text-black/60 hover:text-black transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-5 space-y-8">
            <section className="space-y-4">
              <div className="flex justify-between items-end">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-black/40">Step 1: Upload Photo</h2>
                <button 
                  onClick={handleGithubConnect}
                  className="flex items-center gap-2 text-xs font-semibold bg-white border border-black/5 px-3 py-1.5 rounded-full hover:bg-black hover:text-white transition-all shadow-sm"
                >
                  <Github className="w-3.5 h-3.5" />
                  {githubUser ? `Connected as ${githubUser.name}` : 'Connect GitHub'}
                </button>
              </div>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative aspect-square rounded-3xl border-2 border-dashed transition-all cursor-pointer overflow-hidden group
                  ${selectedImage ? 'border-transparent' : 'border-black/10 hover:border-black/20 bg-white'}`}
              >
                {selectedImage ? (
                  <img 
                    src={selectedImage} 
                    alt="Original" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-black/40" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium">Click to upload</p>
                      <p className="text-sm text-black/40">JPG, PNG or WebP</p>
                    </div>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-black/40">Step 2: Choose Persona</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {PROFESSIONS.map((prof) => (
                  <button
                    key={prof.id}
                    onClick={() => setSelectedProfession(prof.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all gap-2
                      ${selectedProfession === prof.id 
                        ? 'bg-black border-black text-white shadow-lg shadow-black/20' 
                        : 'bg-white border-black/5 hover:border-black/10 text-black/60 hover:text-black'}`}
                  >
                    <prof.icon className="w-6 h-6" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-center leading-tight">
                      {prof.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <button
              disabled={!selectedImage || !selectedProfession || isTransforming}
              onClick={handleTransform}
              className={`w-full py-5 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-3
                ${!selectedImage || !selectedProfession || isTransforming
                  ? 'bg-black/5 text-black/20 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-black/90 active:scale-[0.98] shadow-xl shadow-black/10'}`}
            >
              {isTransforming ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  Transforming...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Generate Persona
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Result */}
          <div className="lg:col-span-7">
            <div className="sticky top-28 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-black/40">Result</h2>
              <div className="aspect-[4/5] bg-white rounded-[32px] border border-black/5 shadow-2xl shadow-black/5 overflow-hidden relative">
                <AnimatePresence mode="wait">
                  {resultImage ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      className="w-full h-full group"
                    >
                      <img 
                        src={resultImage} 
                        alt="Transformed" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                          href={resultImage} 
                          download={`persona-${selectedProfession}.png`}
                          className="bg-white/90 backdrop-blur-sm p-4 rounded-full shadow-xl hover:bg-white transition-colors flex items-center gap-2"
                        >
                          <Download className="w-5 h-5" />
                          <span className="font-medium text-sm">Download</span>
                        </a>
                      </div>
                    </motion.div>
                  ) : isTransforming ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-12 text-center"
                    >
                      <div className="relative">
                        <div className="w-24 h-24 border-4 border-black/5 rounded-full" />
                        <div className="w-24 h-24 border-4 border-black border-t-transparent rounded-full animate-spin absolute inset-0" />
                        <Sparkles className="w-8 h-8 absolute inset-0 m-auto text-black animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xl font-medium">Reimagining your persona...</p>
                        <p className="text-black/40 max-w-xs mx-auto">
                          Our AI is carefully preserving your features while crafting your new professional look.
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-black/20"
                    >
                      <ImageIcon className="w-20 h-20" />
                      <p className="font-medium">Your transformation will appear here</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {resultImage && (
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-black/5">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-black/5">
                    <img src={selectedImage!} alt="Original thumb" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-black/40">Original Identity</p>
                    <p className="text-sm font-medium">Preserved & Transformed</p>
                  </div>
                  <div className="h-8 w-[1px] bg-black/5" />
                  <div className="flex-1 text-right">
                    <p className="text-xs font-semibold uppercase tracking-wider text-black/40">New Role</p>
                    <p className="text-sm font-medium capitalize">{selectedProfession}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto p-6 mt-12 border-t border-black/5 text-center text-black/40 text-sm">
        <p>© 2026 PersonaMorph AI • Powered by Gemini 2.5 Flash</p>
      </footer>
    </div>
  );
}
