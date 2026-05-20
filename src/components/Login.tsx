/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Piano, Music, LogIn } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

export default function Login() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-brand-soft">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-8 rounded-[40px] shadow-xl border-b-8 border-brand-pink text-center max-w-sm w-full relative overflow-hidden"
      >
        <div className="absolute top-[-20px] right-[-20px] opacity-10">
          <Piano size={120} className="text-brand-hot" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-brand-pink p-4 rounded-full mb-6">
            <span className="text-5xl" role="img" aria-label="bear">🐻</span>
          </div>
          
          <h1 className="text-3xl font-black text-gray-800 mb-2">Gấu Piano</h1>
          <p className="text-pink-400 font-bold mb-8">Lưu lại hành trình học đàn của bé</p>
          
          <button 
            onClick={() => signInWithGoogle()}
            className="w-full bg-brand-hot text-white py-4 rounded-3xl font-black shadow-lg shadow-pink-200 hover:bg-pink-600 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <LogIn size={20} />
            ĐĂNG NHẬP VỚI GOOGLE
          </button>
          
          <p className="mt-8 text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
            <Music size={12} />
            ĐỂ ĐỒNG BỘ DỮ LIỆU MUÔN NƠI
          </p>
        </div>
      </motion.div>
    </div>
  );
}
