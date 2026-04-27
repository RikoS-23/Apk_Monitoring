
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ship, 
  User, 
  Settings, 
  MapPin, 
  Clock, 
  CloudSun, 
  AlertCircle, 
  Anchor,
  Bell,
  CheckCircle2,
  ChevronRight,
  Navigation,
  Play,
  XCircle,
  AlertTriangle,
  UserPlus,
  LogIn,
  Users,
  LogOut,
  Wind,
  Thermometer,
  CloudRain
} from 'lucide-react';
import { 
  ShipStatus, 
  WeatherStatus, 
  LoadStatus, 
  TripPhase,
  UserRole, 
  AppState,
  ActivityLog,
  UserProfile,
  PassengerRecord
} from './types';
import { 
  CHECKPOINTS, 
  ROUTE_SEGMENTS, 
  INITIAL_APP_STATE,
  CANCELLATION_REASONS,
  WEATHER_CONFIG
} from './constants';
import { fetchWeatherData } from './services/weatherService';
import { 
  db, 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  handleFirestoreError, 
  OperationType 
} from './services/firebase';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// --- Shared Components ---

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-[80px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-10 rounded-[3rem] shadow-2xl space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-500/20 mb-4">
              <Ship className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter font-display uppercase">LAONTI-KENDARI</h1>
            <p className="text-blue-200/60 text-sm font-bold uppercase tracking-widest">Live Marine Tracker</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-blue-50 text-slate-900 font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              {loading ? "MENGHUBUNGKAN..." : "MASUK DENGAN GOOGLE"}
            </button>
            <p className="text-[10px] text-white/50 text-center font-bold uppercase tracking-wide px-4">
              Akses khusus untuk manifes penumpang dan panel kontrol lapangan
            </p>
          </div>

          <p className="text-[10px] text-white/30 text-center font-bold uppercase tracking-tighter pt-4">
            © 2026 Dinas Perhubungan Kab. Konawe Selatan
          </p>
        </div>
      </motion.div>
    </div>
  );
};


const RunningText: React.FC<{ text: string; appState: AppState }> = ({ text, appState }) => {
  const displayMessage = useMemo(() => {
    let msg = text;
    if (appState.weatherWarning?.isDangerous) {
      msg = `!! PERINGATAN CUACA: ${appState.weatherWarning.message} !! • ${msg}`;
    }
    if (appState.currentStatus === ShipStatus.CANCELLED) {
      return `PENTING: Keberangkatan hari ini DIBATALKAN karena ${appState.cancellationReason}. ${appState.cancellationDetails}`;
    }
    return msg;
  }, [text, appState.currentStatus, appState.cancellationReason, appState.cancellationDetails, appState.weatherWarning]);

  const bgColor = useMemo(() => {
    if (appState.currentStatus === ShipStatus.CANCELLED) return 'bg-black';
    if (appState.weatherWarning?.isDangerous) return 'bg-red-600';
    return 'bg-blue-600';
  }, [appState.currentStatus, appState.weatherWarning?.isDangerous]);

  return (
    <div className={`text-white py-2 overflow-hidden whitespace-nowrap sticky top-0 z-50 shadow-lg border-b border-white/10 transition-colors duration-700 ${bgColor}`}>
      <div className="inline-block animate-scroll font-bold uppercase tracking-[0.1em] text-[10px] sm:text-xs">
        {displayMessage} • {displayMessage} • {displayMessage}
      </div>
    </div>
  );
};

const Navbar: React.FC<{ 
  role: UserRole; 
  setRole: (role: UserRole) => void;
  user: UserProfile | null;
  onLogout: () => void;
}> = ({ role, setRole, user, onLogout }) => (
  <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 sm:top-[36px] z-40">
    <div className="flex items-center gap-3">
      <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-200">
        <Ship className="text-white w-5 h-5" />
      </div>
      <div>
        <span className="font-black text-slate-900 text-sm md:text-base block leading-none font-display tracking-tight uppercase">LAONTI-KENDARI</span>
        <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest">Live Status</span>
      </div>
    </div>
    <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
      <button 
        onClick={() => setRole('USER')}
        className={`p-2 rounded-xl transition-all duration-300 ${role === 'USER' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        title="Dashboard Utama"
      >
        <Users className="w-5 h-5" />
      </button>
      <button 
        onClick={() => setRole('CAPTAIN')}
        className={`p-2 rounded-xl transition-all duration-300 ${role === 'CAPTAIN' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        title="Panel Kapten"
      >
        <Anchor className="w-5 h-5" />
      </button>
      <button 
        onClick={() => setRole('ADMIN')}
        className={`p-2 rounded-xl transition-all duration-300 ${role === 'ADMIN' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        title="Admin"
      >
        <Settings className="w-5 h-5" />
      </button>
      {user && (
        <div className="w-[1px] h-6 bg-slate-200 my-auto mx-1" />
      )}
      {user && (
        <button 
          onClick={onLogout}
          className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
          title="Keluar"
        >
          <LogOut className="w-5 h-5" />
        </button>
      )}
    </div>
  </nav>
);

// --- User Dashboard (Merged Public & Passenger) ---

const UserDashboard: React.FC<{ 
  appState: AppState; 
  user: UserProfile; 
  onCheckIn: (villageId: string) => void;
  targetId: string;
  setTargetId: (id: string) => void;
}> = ({ appState, user, onCheckIn, targetId, setTargetId }) => {
  const [selectedVillage, setSelectedVillage] = useState(CHECKPOINTS[0].id);
  const myRecord = appState.registeredPassengers.find(p => p.id === user.id);
  const isFull = appState.registeredPassengers.length >= appState.maxPassengers;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-5 duration-700">
      
      {/* Welcome Message */}
      <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm flex items-center justify-between overflow-hidden relative group">
        <div className="absolute right-0 top-0 -mr-8 -mt-8 w-32 h-32 bg-blue-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
        <div className="relative z-10">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Selamat Datang Kembali</p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Halo, {user.name} 👋</h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border relative z-10">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-slate-500 uppercase">Sesi Aktif</span>
        </div>
      </div>
      
      {/* Cancellation Banner for Logged-in Passengers */}
      {appState.currentStatus === ShipStatus.CANCELLED && myRecord && (
        <div className="bg-red-600 text-white p-6 rounded-3xl shadow-2xl animate-bounce border-4 border-red-400">
          <div className="flex items-center gap-4 mb-2">
            <Bell className="w-8 h-8 fill-white" />
            <h2 className="text-xl font-black">INFO PEMBATALAN</h2>
          </div>
          <p className="font-bold text-lg">Halo {user?.name}, perjalanan Anda dari {CHECKPOINTS.find(c => c.id === myRecord.villageId)?.name} dibatalkan karena {appState.cancellationReason}.</p>
        </div>
      )}

      {/* 1. Status Utama */}
      <StatusIndicator appState={appState} />

      {/* 2. Pendaftaran Penumpang (Check-in) */}
      <div className="bg-white p-6 rounded-3xl border shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-800">Check-in Keberangkatan</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Lapor untuk mendapatkan manifes</p>
              </div>
            </div>
            {myRecord && <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black">SUDAH MELAPOR</span>}
            {!myRecord && isFull && <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black">MUATAN PENUH</span>}
          </div>

          {!myRecord ? (
            isFull ? (
              <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex flex-col items-center text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <h4 className="font-black text-red-800">Maaf, Kapasitas Penuh</h4>
                <p className="text-xs text-red-600 font-bold">Batas maksimum {appState.maxPassengers} penumpang telah tercapai untuk keberangkatan ini.</p>
              </div>
            ) : (
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <label className="block text-[10px] font-black text-emerald-700 uppercase mb-2">Saya Akan Naik dari Desa:</label>
                <div className="flex gap-2">
                  <select 
                    value={selectedVillage}
                    onChange={(e) => setSelectedVillage(e.target.value)}
                    className="flex-1 p-3 bg-white border border-emerald-200 rounded-xl font-bold text-sm outline-none"
                  >
                    {CHECKPOINTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button 
                    onClick={() => onCheckIn(selectedVillage)}
                    className="bg-emerald-600 text-white font-bold px-4 py-3 rounded-xl hover:bg-emerald-700 transition text-xs"
                  >
                    KONFIRMASI
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <p className="text-xs text-slate-600">Terdaftar naik dari <span className="font-bold">{CHECKPOINTS.find(c => c.id === myRecord.villageId)?.name}</span>. Kapten telah menerima data Anda.</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Info ETA & Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SmartETACard appState={appState} targetId={targetId} setTargetId={setTargetId} />
        
        <div className={`bg-white p-8 rounded-3xl border shadow-sm flex flex-col justify-center ${appState.currentStatus === ShipStatus.CANCELLED ? 'opacity-50 grayscale' : ''}`}>
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" /> Info Keberangkatan
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500 text-sm">Nama Kapal</span>
              <span className="font-bold text-slate-800 text-sm">{appState.shipName}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500 text-sm">Waktu Standar</span>
              <span className="font-bold text-slate-800 text-sm">{appState.departureTime}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500 text-sm">Muatan Saat Ini</span>
              <span className="font-bold text-slate-800 text-sm">{appState.currentLoad}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Timeline Perjalanan */}
      <RouteTimeline appState={appState} />
    </div>
  );
};

// --- Reusable Logic Components ---

const StatusIndicator: React.FC<{ appState: AppState }> = ({ appState }) => {
  const getColor = () => {
    if (appState.tripPhase === TripPhase.COMPLETED) return 'bg-slate-900';
    switch (appState.currentStatus) {
      case ShipStatus.OPERATING: return 'bg-blue-600';
      case ShipStatus.DELAYED: return 'bg-orange-500';
      case ShipStatus.CANCELLED: return 'bg-red-600';
    }
  };

  const getSubStatusText = () => {
    if (appState.currentStatus === ShipStatus.CANCELLED) return `ALASAN: ${appState.cancellationReason || 'Tidak disebutkan'}`;
    if (appState.tripPhase === TripPhase.NOT_STARTED) return "Menunggu Keberangkatan";
    if (appState.tripPhase === TripPhase.COMPLETED) return "Tiba di Kendari (Selesai)";
    const nextCp = CHECKPOINTS.find(c => c.id === appState.nextCheckpointId);
    if (appState.tripPhase === TripPhase.IN_TRANSIT) return `Menuju ${nextCp?.name || 'Tujuan'}...`;
    if (appState.tripPhase === TripPhase.DOCKING) return `Tiba di ${CHECKPOINTS.find(c => c.id === appState.currentCheckpointId)?.name || 'Checkpoint'}`;
    return appState.currentStatus;
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${getColor()} p-8 rounded-[2.5rem] shadow-2xl text-white mb-6 relative overflow-hidden group`}
    >
      {/* Decorative pulse background */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
      
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-2 font-display">Live Vessel Status</p>
          <h2 className="text-4xl md:text-5xl font-black mb-3 tracking-tighter uppercase">{appState.currentStatus}</h2>
          <motion.p 
            key={getSubStatusText()}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg font-bold opacity-90 flex items-center gap-2"
          >
            {appState.currentStatus === ShipStatus.CANCELLED ? <AlertTriangle className="w-5 h-5" /> : <Navigation className="w-5 h-5 animate-pulse" />}
            {getSubStatusText()}
          </motion.p>
        </div>
        <div className="bg-white/20 p-5 rounded-3xl backdrop-blur-xl border border-white/20 shadow-xl">
          {appState.currentStatus === ShipStatus.CANCELLED ? (
            <XCircle className="w-14 h-14" />
          ) : (
            <Ship className={`w-14 h-14 ${appState.tripPhase === TripPhase.IN_TRANSIT ? 'animate-bounce' : ''}`} />
          )}
        </div>
      </div>
    </motion.div>
  );
};

const SmartETACard: React.FC<{ 
  appState: AppState; 
  targetId: string; 
  setTargetId: (id: string) => void 
}> = ({ appState, targetId, setTargetId }) => {
  const targetCheckpoint = CHECKPOINTS.find(c => c.id === targetId);
  const currentIdx = CHECKPOINTS.findIndex(c => c.id === appState.currentCheckpointId);
  
  const calculateETA = () => {
    if (appState.currentStatus === ShipStatus.CANCELLED) return "BATAL";
    if (appState.tripPhase === TripPhase.NOT_STARTED) return "NANTI";
    if (appState.tripPhase === TripPhase.COMPLETED) return "TIBA";
    if (!targetCheckpoint) return "N/A";

    const targetIdx = targetCheckpoint.order;
    if (currentIdx >= targetIdx) return "TIBA";

    let totalMinutes = 0;
    for (let i = Math.max(0, currentIdx); i < targetIdx; i++) {
      const segment = ROUTE_SEGMENTS.find(s => s.fromId === CHECKPOINTS[i].id && s.toId === CHECKPOINTS[i+1].id);
      if (segment) totalMinutes += segment.standardTimeMinutes;
    }

    let weatherFactor = 1.0;
    if (appState.currentWeather === WeatherStatus.RAIN) weatherFactor = 1.2;
    if (appState.currentWeather === WeatherStatus.ROUGH_WAVES) weatherFactor = 1.5;
    totalMinutes = (totalMinutes * weatherFactor) + appState.delayMinutes;

    const now = new Date();
    now.setMinutes(now.getMinutes() + totalMinutes);
    return now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + " WITA";
  };

  return (
    <div className={`bg-white p-8 rounded-[2rem] border shadow-sm ${appState.currentStatus === ShipStatus.CANCELLED ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
          <Navigation className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-widest font-display">Estimasi Tiba (Smart ETA)</h3>
      </div>
      <div className="space-y-4">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-display">Ganti Tujuan:</label>
        <select 
          disabled={appState.currentStatus === ShipStatus.CANCELLED}
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
        >
          {CHECKPOINTS.map((cp) => (
            <option key={cp.id} value={cp.id} disabled={cp.order <= currentIdx}>
              {cp.name} {cp.order <= currentIdx ? '(Sudah Lewat)' : ''}
            </option>
          ))}
        </select>
        <div className="bg-slate-900 p-6 rounded-[1.5rem] text-white shadow-xl flex justify-between items-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase opacity-40 mb-1 tracking-widest font-display">Estimasi Tiba:</p>
            <p className="text-3xl font-black font-display tracking-tight leading-none">{calculateETA()}</p>
          </div>
          <div className="relative z-10 bg-white/10 p-3 rounded-full backdrop-blur-md">
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

const RouteTimeline: React.FC<{ appState: AppState }> = ({ appState }) => {
  const currentIdx = CHECKPOINTS.findIndex(c => c.id === appState.currentCheckpointId);
  const nextIdx = CHECKPOINTS.findIndex(c => c.id === appState.nextCheckpointId);

  return (
    <div className={`bg-white p-8 rounded-[2rem] border shadow-sm mb-6 overflow-hidden ${appState.currentStatus === ShipStatus.CANCELLED ? 'opacity-50 grayscale' : ''}`}>
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 font-display uppercase text-xs tracking-widest">Rute Pelayaran</h3>
        </div>
        <div className="text-[10px] bg-indigo-50 text-indigo-700 font-black px-3 py-1 rounded-full font-display">
          LIVE PROGRESS
        </div>
      </div>

      <div className="relative flex flex-col gap-14">
        <div className="absolute left-[20px] top-4 bottom-4 w-1 bg-slate-100 rounded-full"></div>
        <motion.div 
          initial={{ height: 0 }}
          animate={{ height: `${currentIdx >= 0 ? (currentIdx / (CHECKPOINTS.length - 1)) * 100 : 0}%` }}
          className="absolute left-[20px] top-4 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 origin-top"
        ></motion.div>

        {CHECKPOINTS.map((checkpoint, idx) => {
          const isPassed = idx <= currentIdx;
          const isHeadingTo = idx === nextIdx && appState.tripPhase === TripPhase.IN_TRANSIT;
          const isAt = idx === currentIdx && appState.tripPhase === TripPhase.DOCKING;

          return (
            <motion.div 
              key={checkpoint.id} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative z-10"
            >
              <div className="flex items-center gap-5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-4 transition-all duration-500 shadow-sm ${
                  isPassed ? 'bg-blue-600 border-blue-50 text-white' : 
                  isHeadingTo ? 'bg-white border-blue-400 text-blue-500 scale-110 shadow-lg ring-4 ring-blue-50' :
                  isAt ? 'bg-blue-600 border-blue-50 text-white animate-pulse' :
                  'bg-white border-slate-100 text-slate-300'
                }`}>
                  {isPassed ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                </div>
                <div>
                  <h4 className={`font-bold transition-all font-display ${isAt || isHeadingTo ? 'text-blue-600 text-lg' : isPassed ? 'text-slate-800' : 'text-slate-400'}`}>
                    {checkpoint.name}
                  </h4>
                  <AnimatePresence>
                    {isAt && (
                      <motion.span 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[10px] bg-blue-100 text-blue-700 font-black px-2 py-0.5 rounded-lg uppercase tracking-tighter block mt-1 w-fit"
                      >
                        Kapal Sedang Bersandar
                      </motion.span>
                    )}
                    {isHeadingTo && (
                      <motion.span 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[10px] bg-orange-100 text-orange-700 font-black px-2 py-0.5 rounded-lg uppercase tracking-tighter block mt-1 w-fit"
                      >
                        Kapal Menuju Sini
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// --- Captain Panel ---

const CaptainPanel: React.FC<{ 
  appState: AppState; 
  updateState: (partial: Partial<AppState>) => void;
  addLog: (action: string) => void;
}> = ({ appState, updateState, addLog }) => {
  const [showCancellationForm, setShowCancellationForm] = useState(false);
  const [tempReason, setTempReason] = useState(appState.cancellationReason);
  const [tempDetails, setTempDetails] = useState(appState.cancellationDetails);
  const [error, setError] = useState('');

  const handleStartTrip = () => {
    updateState({
      currentStatus: ShipStatus.OPERATING,
      tripPhase: TripPhase.IN_TRANSIT,
      currentCheckpointId: null,
      nextCheckpointId: 'v1',
      cancellationReason: '',
      cancellationDetails: ''
    });
    addLog('Kapten memulai keberangkatan: Broadcast status "BEROPERASI" terkirim.');
  };

  const handleArriveAtCheckpoint = (checkpointId: string) => {
    const cp = CHECKPOINTS.find(c => c.id === checkpointId);
    if (!cp) return;
    const isLast = cp.order === CHECKPOINTS.length - 1;
    const nextCp = CHECKPOINTS.find(c => c.order === cp.order + 1);

    if (isLast) {
      updateState({ tripPhase: TripPhase.COMPLETED, currentCheckpointId: checkpointId, nextCheckpointId: null });
      addLog(`Tiba di ${cp.name}: Trip Selesai.`);
    } else {
      updateState({ tripPhase: TripPhase.DOCKING, currentCheckpointId: checkpointId, nextCheckpointId: nextCp?.id || null });
      addLog(`Tiba di ${cp.name}.`);
    }
  };

  const confirmCancellation = () => {
    if (!tempReason) { setError('Wajib pilih alasan!'); return; }
    updateState({
      currentStatus: ShipStatus.CANCELLED,
      cancellationReason: tempReason,
      cancellationDetails: tempDetails,
      tripPhase: TripPhase.NOT_STARTED
    });
    addLog(`BROADCAST PEMBATALAN: Menginformasikan ${appState.registeredPassengers.length} penumpang.`);
    setShowCancellationForm(false);
  };

  return (
    <div className="p-4 max-w-lg mx-auto pb-24 space-y-6">
      <div className={`p-6 rounded-3xl text-white shadow-xl transition-colors ${appState.currentStatus === ShipStatus.CANCELLED ? 'bg-red-700' : 'bg-orange-600'}`}>
        <div className="flex items-center gap-3 mb-2">
          {appState.currentStatus === ShipStatus.CANCELLED ? <XCircle className="w-6 h-6" /> : <Anchor className="w-6 h-6" />}
          <h2 className="text-xl font-bold">Panel Kapten</h2>
        </div>
        <p className="opacity-80 text-sm">{appState.shipName} • Operator: Herman S.</p>
        <div className="mt-4 flex gap-2">
           <div className="bg-black/10 px-4 py-2 rounded-2xl border border-white/10 flex-1">
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Status:</p>
              <p className="text-sm font-black">{appState.tripPhase}</p>
           </div>
           <div className="bg-black/10 px-4 py-2 rounded-2xl border border-white/10">
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Cuaca:</p>
              <p className="text-sm font-black">{appState.weatherWarning?.windSpeed.toFixed(1)} m/s</p>
           </div>
        </div>
      </div>

      {appState.weatherWarning?.isDangerous && (
        <div className="bg-red-50 border-2 border-red-200 p-6 rounded-3xl animate-pulse">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="font-black">PERINGATAN OPERASIONAL</h3>
          </div>
          <p className="text-xs text-red-800 font-bold leading-relaxed">
            {appState.weatherWarning.message} Kecepatan angin terpantau tinggi ({appState.weatherWarning.windSpeed} m/s). 
            Kapten disarankan untuk meninjau kembali izin keberangkatan.
          </p>
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-slate-700 flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-blue-500" /> Monitor Cuaca Real-time
          </h3>
          <span className="text-[10px] font-black text-slate-400 uppercase">Live Perairan Laonti</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-slate-50 rounded-2xl border flex flex-col items-center gap-1">
            <Wind className={`w-5 h-5 ${appState.weatherWarning?.isDangerous ? 'text-red-500 animate-spin' : 'text-blue-500'}`} />
            <span className="text-xs font-bold text-slate-500">Angin</span>
            <span className="font-black text-lg">{appState.weatherWarning?.windSpeed.toFixed(1)} m/s</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border flex flex-col items-center gap-1">
            <Thermometer className="w-5 h-5 text-orange-500" />
            <span className="text-xs font-bold text-slate-500">Suhu</span>
            <span className="font-black text-lg">{appState.weatherWarning?.temperature.toFixed(1)}°C</span>
          </div>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
          <CloudRain className="w-6 h-6 text-blue-600" />
          <div>
            <p className="text-[10px] font-black text-blue-400 uppercase">Estimasi Kondisi:</p>
            <p className="text-xs font-bold text-blue-800">{appState.weatherWarning?.description.toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* MANIFES PENUMPANG (CHECK-IN) */}
      <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="font-black text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> Manifes Penumpang
          </h3>
          <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-lg">
            {appState.registeredPassengers.length} PAX
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {CHECKPOINTS.map(cp => {
            const count = appState.registeredPassengers.filter(p => p.villageId === cp.id).length;
            return (
              <div key={cp.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 truncate mr-1">{cp.name}</span>
                <span className={`text-xs font-black ${count > 0 ? 'text-blue-600' : 'text-slate-300'}`}>{count}</span>
              </div>
            );
          })}
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {appState.registeredPassengers.length === 0 ? (
            <p className="text-center py-8 text-xs font-bold text-slate-300 uppercase italic">Belum ada data penumpang</p>
          ) : (
            appState.registeredPassengers.map(p => (
              <div key={p.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                <div>
                  <p className="text-xs font-black text-slate-800">{p.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{CHECKPOINTS.find(c => c.id === p.villageId)?.name}</p>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-bold text-slate-300 uppercase">Lapor:</p>
                   <p className="text-[9px] font-black text-slate-500">{p.timestamp}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-black text-slate-700">Kapasitas Maksimum:</label>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              value={appState.maxPassengers} 
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                updateState({ maxPassengers: val });
              }}
              className="w-20 p-2 bg-slate-50 border rounded-xl font-black text-center text-blue-600"
            />
            <span className="text-[10px] font-bold text-slate-400 uppercase">PAX</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 italic">Sesuaikan kapasitas pada hari raya atau kondisi muatan tertentu.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
        <label className="block text-sm font-black text-slate-700">Kontrol Trip:</label>
        
        {appState.currentStatus !== ShipStatus.CANCELLED && (
          <>
            {appState.tripPhase === TripPhase.NOT_STARTED && (
              <button onClick={handleStartTrip} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-2xl flex flex-col items-center gap-2">
                <Play className="w-8 h-8 fill-current" />
                <span>MULAI BERANGKAT</span>
              </button>
            )}

            {appState.tripPhase === TripPhase.IN_TRANSIT && appState.nextCheckpointId && (
              <button onClick={() => handleArriveAtCheckpoint(appState.nextCheckpointId!)} className="w-full bg-green-600 text-white font-black py-6 rounded-2xl flex flex-col items-center gap-2">
                <MapPin className="w-8 h-8" />
                <span>TIBA DI {CHECKPOINTS.find(c => c.id === appState.nextCheckpointId)?.name.toUpperCase()}</span>
              </button>
            )}

            {appState.tripPhase === TripPhase.DOCKING && appState.nextCheckpointId && (
              <button onClick={() => updateState({ tripPhase: TripPhase.IN_TRANSIT })} className="w-full bg-blue-600 text-white font-black py-6 rounded-2xl flex flex-col items-center gap-2">
                <Navigation className="w-8 h-8" />
                <span>LANJUT KE {CHECKPOINTS.find(c => c.id === appState.nextCheckpointId)?.name.toUpperCase()}</span>
              </button>
            )}
          </>
        )}

        {appState.currentStatus === ShipStatus.CANCELLED && (
          <button onClick={() => updateState(INITIAL_APP_STATE)} className="w-full bg-slate-100 text-slate-600 font-black py-6 rounded-2xl">RESET TRIP BARU</button>
        )}

        <div className="flex gap-2 pt-4 border-t">
          {[ShipStatus.OPERATING, ShipStatus.DELAYED, ShipStatus.CANCELLED].map(st => (
            <button key={st} onClick={() => st === ShipStatus.CANCELLED ? setShowCancellationForm(true) : updateState({ currentStatus: st })} className={`flex-1 p-2 rounded-xl text-[10px] font-bold border-2 transition ${appState.currentStatus === st ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400'}`}>
              {st}
            </button>
          ))}
        </div>
      </div>

      {showCancellationForm && (
        <div className="bg-red-50 border-2 border-red-300 p-6 rounded-3xl space-y-4">
          <h3 className="font-black text-red-800 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Batalkan Perjalanan</h3>
          <select value={tempReason} onChange={(e) => setTempReason(e.target.value)} className="w-full p-3 rounded-xl border-red-200 text-sm">
            <option value="">-- Pilih Alasan --</option>
            {CANCELLATION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <textarea value={tempDetails} onChange={(e) => setTempDetails(e.target.value)} placeholder="Detail tambahan..." className="w-full p-3 rounded-xl border-red-200 text-sm h-20" />
          <div className="flex gap-2">
            <button onClick={confirmCancellation} className="flex-1 bg-red-600 text-white font-black py-3 rounded-xl">BROADCAST BATAL</button>
            <button onClick={() => setShowCancellationForm(false)} className="px-4 bg-slate-200 text-slate-600 font-bold rounded-xl">TUTUP</button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Admin Panel ---

const AdminPanel: React.FC<{ 
  appState: AppState; 
  updateState: (partial: Partial<AppState>) => void;
  logs: ActivityLog[];
}> = ({ appState, updateState, logs }) => (
  <div className="p-4 max-w-4xl mx-auto pb-24 space-y-6">
    <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-black mb-1">Pusat Kendali</h2>
        <p className="opacity-60 text-xs uppercase font-bold tracking-widest">Administrator System</p>
      </div>
      <Settings className="w-10 h-10 opacity-20" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-3xl border shadow-sm md:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold">Penumpang Hari Ini</h3>
          </div>
          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black">{appState.registeredPassengers.length} Orang</span>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {appState.registeredPassengers.map(p => (
            <div key={p.id} className="flex justify-between items-center p-3 border-b text-sm">
              <span className="font-bold text-slate-700">{p.name}</span>
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-[10px] font-black">{CHECKPOINTS.find(c => c.id === p.villageId)?.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border shadow-sm">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-indigo-600" /> Pengumuman</h3>
        <textarea value={appState.announcement} onChange={(e) => updateState({ announcement: e.target.value })} className="w-full h-32 bg-slate-50 p-3 rounded-xl text-sm" />
      </div>

      <div className="bg-white p-6 rounded-3xl border shadow-sm">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-slate-500" /> Activity Log</h3>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {logs.slice().reverse().map((log) => (
            <div key={log.id} className="text-[10px] border-b pb-1">
              <span className="font-black text-slate-700">{log.action}</span>
              <span className="text-slate-400 block">{log.timestamp} • {log.user}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// --- Main App ---

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>('USER');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [appState, setAppState] = useState<AppState>(INITIAL_APP_STATE);
  const [targetId, setTargetId] = useState<string>('v5');
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // 1. Auth Sync
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserProfile({
          id: user.uid,
          name: user.displayName || 'User',
          isLoggedIn: true
        });
        addLog(`User masuk: ${user.displayName || user.email}`);
      } else {
        setUserProfile(null);
      }
    });
  }, []);

  // 2. Data Sync (Status, Passengers, Logs)
  useEffect(() => {
    // Initial Vessel Status setup
    const initVessel = async () => {
      const docRef = doc(db, 'status', 'current');
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        const { registeredPassengers, ...initialData } = INITIAL_APP_STATE;
        await setDoc(docRef, initialData).catch(e => handleFirestoreError(e, OperationType.WRITE, 'status/current'));
      }
    };
    initVessel();

    // Listen to Status
    const unsubscribeStatus = onSnapshot(doc(db, 'status', 'current'), (snapshot) => {
      if (snapshot.exists()) {
        setAppState(prev => ({ ...prev, ...snapshot.data() }));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'status/current'));

    // Listen to Passengers
    const unsubscribePassengers = onSnapshot(collection(db, 'passengers'), (snapshot) => {
      const passengersList = snapshot.docs.map(doc => doc.data() as PassengerRecord);
      setAppState(prev => ({ ...prev, registeredPassengers: passengersList }));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'passengers'));

    // Listen to Logs
    const logsQuery = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const logsList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toLocaleTimeString('id-ID') : data.timestamp,
          action: data.action,
          user: data.user
        };
      });
      setLogs(logsList.reverse());
    }, (error) => handleFirestoreError(error, OperationType.GET, 'logs'));

    return () => {
      unsubscribeStatus();
      unsubscribePassengers();
      unsubscribeLogs();
    };
  }, []);

  // 3. Weather Sync
  useEffect(() => {
    const updateWeather = async () => {
      const weatherData = await fetchWeatherData();
      const statusRef = doc(db, 'status', 'current');
      
      // Update Firestore so everyone sees the same weather
      if (role === 'ADMIN' || role === 'CAPTAIN') {
        updateDoc(statusRef, { weatherWarning: weatherData }).catch(e => {
           // Silently fail if not admin/captain
        });
      }
    };

    updateWeather();
    const interval = setInterval(updateWeather, WEATHER_CONFIG.UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [role]);

  const updateState = async (partial: Partial<AppState>) => {
    const docRef = doc(db, 'status', 'current');
    const { registeredPassengers, ...dataToUpload } = partial;
    try {
      await updateDoc(docRef, dataToUpload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'status/current');
    }
  };

  const addLog = async (action: string) => {
    const userDisplay = role === 'CAPTAIN' ? 'Kapten' : userProfile?.name || 'Sistem';
    try {
      await addDoc(collection(db, 'logs'), {
        action,
        user: userDisplay,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      // Don't block UI for log failure
      console.error("Log failed", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleCheckIn = async (villageId: string) => {
    if (!userProfile) return;
    if (appState.registeredPassengers.length >= appState.maxPassengers) return;

    const record = { 
      id: userProfile.id, 
      name: userProfile.name, 
      villageId, 
      timestamp: new Date().toLocaleTimeString('id-ID'),
      userId: userProfile.id
    };

    try {
      await setDoc(doc(db, 'passengers', userProfile.id), record);
      
      // Update capacity status in vessel if full
      const newCount = appState.registeredPassengers.length + 1;
      if (newCount >= appState.maxPassengers) {
        updateState({ currentLoad: LoadStatus.FULL });
      }

      addLog(`${userProfile.name} daftar naik di ${CHECKPOINTS.find(c => c.id === villageId)?.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'passengers/' + userProfile.id);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!userProfile ? (
        <LoginPage key="login" />
      ) : (
        <motion.div 
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-slate-50"
        >
          <RunningText text={appState.announcement} appState={appState} />
          <Navbar role={role} setRole={setRole} user={userProfile} onLogout={handleLogout} />

          <main className="container mx-auto px-4 py-6">
            {role === 'USER' && (
              <UserDashboard 
                appState={appState} 
                user={userProfile} 
                onCheckIn={handleCheckIn} 
                targetId={targetId} 
                setTargetId={setTargetId} 
              />
            )}
            {role === 'CAPTAIN' && <CaptainPanel appState={appState} updateState={updateState} addLog={addLog} />}
            {role === 'ADMIN' && <AdminPanel appState={appState} updateState={updateState} logs={logs} />}
          </main>

          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur shadow-2xl border rounded-full px-6 py-2 z-50 flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Panel:</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${role === 'USER' ? 'bg-blue-100 text-blue-700' : role === 'CAPTAIN' ? 'bg-orange-100 text-orange-700' : 'bg-slate-800 text-white'}`}>
              {role}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default App;
