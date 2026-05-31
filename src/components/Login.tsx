/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Piano, Music, LogIn, AlertCircle } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    try {
      setError(null);
      setIsLoggingIn(true);
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Cửa sổ đăng nhập đã bị đóng. Bạn hãy thử nhấn lại và đừng đóng cửa sổ nhé!');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Trình duyệt đã chặn cửa sổ Popup. Hãy bật "Cho phép Popup" trong cài đặt trình duyệt để đăng nhập nhé!');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Đăng nhập Google chưa được bật trong Firebase Console.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Tên miền này chưa được thêm vào "Authorized Domains" trong Firebase Console.');
      } else {
        setError(`Lỗi: ${err.message || 'Không thể kết nối với Google. Hãy thử lại sau.'}`);
      }
      console.error('Login error detail:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

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

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-4 bg-red-50 p-3 rounded-2xl text-red-500 text-xs font-bold flex items-center gap-2 overflow-hidden"
              >
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full bg-brand-hot text-white py-4 rounded-3xl font-black shadow-lg shadow-pink-200 hover:bg-pink-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:scale-100"
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <LogIn size={20} />
            )}
            {isLoggingIn ? 'ĐANG KẾT NỐI...' : 'ĐĂNG NHẬP VỚI GOOGLE'}
          </button>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 p-4 bg-gray-50 rounded-2xl text-[10px] text-gray-500 text-left leading-relaxed"
          >
            <p className="font-black text-gray-400 mb-1 uppercase">💡 Mẹo cho điện thoại:</p>
            <ul className="list-disc pl-3 space-y-1">
              <li>Nếu không thấy cửa sổ hiện lên, hãy kiểm tra xem trình duyệt có đang <b>chặn Popup</b> không nhé.</li>
              <li>Nếu dùng Vercel, hãy đảm bảo đã thêm tên miền vào <b>Authorized Domains</b> trong Firebase Console.</li>
            </ul>
          </motion.div>
          
          <p className="mt-8 text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
            <Music size={12} />
            ĐỂ ĐỒNG BỘ DỮ LIỆU MUÔN NƠI
          </p>
        </div>
      </motion.div>
    </div>
  );
}
