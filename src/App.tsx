/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  CheckCircle2, 
  History, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Trophy, 
  Piano, 
  Calendar as CalendarIcon, 
  Coins, 
  LogOut,
  User as UserIcon,
  Loader2
} from 'lucide-react';
import { Course, Session } from './types';
import { useFirebase } from './contexts/FirebaseContext';
import Login from './components/Login';
import { auth } from './lib/firebase';

// Helper to format date as YYYY-MM-DD
const formatDateKey = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function App() {
  const { user, loading: authLoading, state, createInitialUser, updateCourse, completeCourse } = useFirebase();

  // Calendar State
  const [viewDate, setViewDate] = useState(new Date(2026, 4, 1)); // Default to May 2026
  const [showCelebration, setShowCelebration] = useState(false);

  // Initialize new user profile if missing
  useEffect(() => {
    if (user && !state.profile && !state.isLoading) {
      createInitialUser(user);
    }
  }, [user, state.profile, state.isLoading, createInitialUser]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const daysInMonth = useMemo(() => new Date(viewYear, viewMonth + 1, 0).getDate(), [viewYear, viewMonth]);
  const firstDayOfMonth = useMemo(() => new Date(viewYear, viewMonth, 1).getDay(), [viewYear, viewMonth]);

  const monthName = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(viewDate);

  const toggleDate = async (day: number) => {
    if (!state.currentCourse) return;

    const dateStr = formatDateKey(new Date(viewYear, viewMonth, day));
    const isAlreadyCompleted = state.currentCourse.sessions.some(s => s.date === dateStr);
    
    let updatedSessions: Session[];
    
    if (isAlreadyCompleted) {
      updatedSessions = state.currentCourse.sessions.filter(s => s.date !== dateStr);
    } else {
      if (state.currentCourse.sessions.length >= 8) {
        alert('Bạn đã chọn đủ 8 buổi cho khóa học này rồi!');
        return;
      }
      updatedSessions = [...state.currentCourse.sessions, { date: dateStr }];
    }

    if (updatedSessions.length === 8) {
      setShowCelebration(true);
      const nextCourseId = crypto.randomUUID();
      setTimeout(async () => {
        await completeCourse({ ...state.currentCourse!, sessions: updatedSessions }, nextCourseId);
        setShowCelebration(false);
      }, 3000);
    } else {
      await updateCourse({ ...state.currentCourse, sessions: updatedSessions });
    }
  };

  const nextMonth = () => setViewDate(new Date(viewYear, viewMonth + 1, 1));
  const prevMonth = () => setViewDate(new Date(viewYear, viewMonth - 1, 1));

  const handleUpdateCourseFee = async (courseId: string, feeStr: string) => {
    const fee = parseInt(feeStr.replace(/\D/g, '')) || 0;
    
    if (state.currentCourse?.id === courseId) {
      await updateCourse({ ...state.currentCourse, fee });
    } else {
      const historyCourse = state.courseHistory.find(c => c.id === courseId);
      if (historyCourse) {
        const updatedCourse = { ...historyCourse, fee };
        await updateCourse(updatedCourse);
      }
    }
  };

  const totalFees = useMemo(() => {
    const historyTotal = state.courseHistory.reduce((sum, course) => sum + (course.fee || 0), 0);
    const currentTotal = state.currentCourse?.fee || 0;
    return historyTotal + currentTotal;
  }, [state.courseHistory, state.currentCourse?.fee]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getDayStatus = (day: number) => {
    const dateStr = formatDateKey(new Date(viewYear, viewMonth, day));
    const isInCurrent = state.currentCourse?.sessions.some(s => s.date === dateStr);
    if (isInCurrent) return 'current';
    
    const isInHistory = state.courseHistory.some(c => c.sessions.some(s => s.date === dateStr));
    if (isInHistory) return 'history';
    
    return 'none';
  };

  const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  if (authLoading || (user && state.isLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-brand-soft text-brand-hot">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold uppercase tracking-widest text-xs">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!state.currentCourse) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-brand-soft text-brand-hot">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold uppercase tracking-widest text-xs">Bé đợi chút nhé...</p>
      </div>
    );
  }

  const completedSessionsCount = state.currentCourse.sessions.length;

  return (
    <div className="min-h-screen pb-12 px-4 flex flex-col items-center">
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -20 }}
              animate={{ scale: [1, 1.2, 1], rotate: 0 }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <Trophy className="w-24 h-24 text-yellow-400 mb-4" />
            </motion.div>
            <h1 className="text-3xl font-bold text-brand-hot mb-2">Tuyệt vời! 🎉</h1>
            <p className="text-lg text-gray-600">Bạn đã hoàn thành khóa học số {state.currentCourse.courseNumber}!</p>
            <p className="text-pink-400 mt-4 font-medium italic">Gấu con đã sẵn sàng cho khóa học mới 🐻🎹</p>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="py-8 text-center max-w-md w-full">
        <div className="flex justify-between items-center mb-4 px-2">
          <div className="flex items-center gap-2 bg-white/60 p-2 rounded-2xl border border-pink-50">
            <div className="w-8 h-8 rounded-full bg-brand-pink flex items-center justify-center overflow-hidden">
              {user.photoURL ? <img src={user.photoURL} alt="User" referrerPolicy="no-referrer" /> : <UserIcon size={16} className="text-brand-hot" />}
            </div>
            <span className="text-[10px] font-black text-gray-600 truncate max-w-[100px]">{user.displayName || user.email}</span>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => auth.signOut()}
            className="p-2 bg-white/60 rounded-xl border border-pink-50 text-gray-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
          </motion.button>
        </div>

        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-3xl p-6 shadow-sm border-b-4 border-brand-pink relative overflow-hidden"
        >
          <div className="absolute top-[-10px] right-[-10px] opacity-10">
            <Piano size={100} className="text-brand-hot" />
          </div>
          <div className="flex justify-center mb-2">
            <div className="bg-brand-pink p-3 rounded-full hover:rotate-12 transition-transform cursor-pointer">
              <span className="text-4xl" role="img" aria-label="bear">🐻</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Gấu Piano Tracker</h1>
          <p className="text-brand-hot font-medium">Lịch học đàn của bé chăm chỉ</p>
        </motion.div>
      </header>

      <main className="max-w-md w-full space-y-6">
        {/* Statistics Card */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-pink-100 flex flex-col items-center text-center">
            <div className="bg-pink-50 p-3 rounded-2xl mb-3">
              <Trophy size={24} className="text-brand-hot" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Thống kê khóa học</p>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-gray-800">{(state.courseHistory.length + 1)}</span>
              <span className="text-[10px] text-gray-400 font-medium leading-none">Khóa đã & đang học</span>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-pink-100 flex flex-col items-center text-center">
            <div className="bg-yellow-50 p-3 rounded-2xl mb-3">
              <Coins size={24} className="text-yellow-500" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tổng học phí</p>
            <p className="text-lg font-black text-gray-800 truncate w-full px-1">{formatCurrency(totalFees)}</p>
          </div>
        </section>

        {/* Progress Summary */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Tiến độ khóa {state.currentCourse.courseNumber}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Music size={18} className="text-brand-hot" />
                <span className="text-2xl font-black text-gray-800">{completedSessionsCount} <span className="text-gray-300">/ 8</span></span>
              </div>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-3 h-3 rounded-full transition-all duration-500 ${
                    i < completedSessionsCount ? 'bg-brand-hot scale-110 shadow-sm' : 'bg-gray-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Calendar Header */}
          <div className="flex items-center justify-between mt-6 mb-4 bg-brand-soft p-3 rounded-2xl">
            <button onClick={prevMonth} className="p-2 hover:bg-white rounded-xl transition-colors text-brand-hot">
              <ChevronLeft size={20} />
            </button>
            <h3 className="font-bold text-gray-700 capitalize">{monthName}</h3>
            <button onClick={nextMonth} className="p-2 hover:bg-white rounded-xl transition-colors text-brand-hot">
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdays.map(d => (
              <div key={d} className="text-[10px] font-bold text-gray-400 py-2">{d}</div>
            ))}
            {/* Empty days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const status = getDayStatus(day);
              return (
                <motion.button
                  key={day}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleDate(day)}
                  className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all relative ${
                    status === 'current' 
                      ? 'bg-brand-hot text-white shadow-md' 
                      : status === 'history'
                      ? 'bg-brand-pink/40 text-brand-hot/60'
                      : 'bg-gray-50 text-gray-700 hover:bg-pink-50'
                  }`}
                >
                  {day}
                  {status === 'current' && (
                    <motion.div 
                      layoutId="check"
                      className="absolute -top-1 -right-1 bg-white rounded-full shadow-sm"
                    >
                      <CheckCircle2 size={12} className="text-brand-hot" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>

          <div className="mt-6 flex justify-center gap-6 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-md bg-brand-hot" />
              <span>Đã học</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-md bg-brand-pink/40" />
              <span>Khóa cũ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-md bg-gray-50 border border-gray-200" />
              <span>Trống</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-pink-50 flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Học phí khóa này:</span>
              <Coins size={14} className="text-brand-hot opacity-40" />
            </div>
            <div className="flex items-center gap-2 bg-pink-50/50 p-2 rounded-xl border border-pink-100/50 focus-within:border-brand-hot/30 transition-colors">
              <input 
                type="text"
                placeholder="Nhập học phí khóa này..."
                value={state.currentCourse.fee ? state.currentCourse.fee.toLocaleString('vi-VN') : ''}
                onChange={(e) => handleUpdateCourseFee(state.currentCourse!.id, e.target.value)}
                className="w-full bg-transparent border-none p-0 text-sm font-black text-gray-700 placeholder:text-gray-300 focus:ring-0 focus:outline-none"
              />
              <span className="text-[10px] font-bold text-gray-400">VNĐ</span>
            </div>
          </div>
        </section>

        {/* Info Card */}
        <div className="bg-pink-50 rounded-2xl p-4 flex items-start gap-3 border border-pink-100">
          <div className="bg-white p-2 rounded-xl shadow-sm">
            <CalendarIcon size={20} className="text-brand-hot" />
          </div>
          <div>
            <h3 className="font-bold text-brand-hot text-sm">Ghi chú cho gấu</h3>
            <p className="text-pink-600/70 text-xs leading-relaxed">
              Tích chọn ngày gấu đi học đàn nhé. Dữ liệu sẽ được lưu vào tài khoản Google của bạn để có thể xem trên mọi thiết bị!
            </p>
          </div>
        </div>

        {/* History Section */}
        {state.courseHistory.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <History size={18} className="text-gray-400" />
                <h2 className="text-gray-600 font-bold uppercase text-xs tracking-widest">Lịch sử khóa học</h2>
              </div>
            </div>
            
            <div className="space-y-3">
              {state.courseHistory.map((course) => (
                <div 
                  key={course.id}
                  className="bg-white/60 rounded-2xl p-4 flex flex-col gap-4 border border-pink-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-full shadow-sm border border-pink-100 text-brand-hot">
                        <Music size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-700 text-sm">Khóa học #{course.courseNumber}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Hoàn thành: {new Date(course.completionDate || course.startDate).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-green-500 font-bold text-xs bg-green-50 px-2 py-1 rounded-full">
                      <CheckCircle2 size={12} />
                      <span>8/8</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-pink-50/50">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Học phí khóa này:</span>
                      {course.fee !== undefined && course.fee > 0 && (
                        <span className="text-[10px] font-bold text-brand-hot">Đã thanh toán</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 bg-pink-50/50 p-2 rounded-xl border border-pink-100/50 focus-within:border-brand-hot/30 transition-colors">
                      <Coins size={16} className="text-brand-hot/60" />
                      <div className="flex-1 relative">
                        <input 
                          type="text"
                          placeholder="Nhập số tiền..."
                          value={course.fee ? course.fee.toLocaleString('vi-VN') : ''}
                          onChange={(e) => handleUpdateCourseFee(course.id, e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-sm font-black text-gray-700 placeholder:text-gray-300 focus:ring-0 focus:outline-none"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">VNĐ</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="mt-auto pt-12 text-center">
        <p className="text-gray-400 text-[10px] font-medium tracking-wide">
          HỌC ĐÀN THẬT VUI CÙNG GẤU PIANO • 2026
        </p>
      </footer>
    </div>
  );
}
