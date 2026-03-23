import React, { useState, useEffect, Component } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Map as MapIcon, 
  Calendar, 
  Briefcase, 
  Plus, 
  ChevronRight, 
  Search, 
  Cloud, 
  DollarSign, 
  Share2, 
  Trash2,
  ArrowLeft,
  Wind,
  Sun,
  Umbrella,
  Thermometer,
  CheckCircle2,
  Circle,
  Menu,
  X,
  User as UserIcon,
  Plane,
  Train,
  Hotel,
  ExternalLink,
  MapPin,
  Info,
  Lock,
  Mail,
  Image as ImageIcon,
  BookOpen,
  Camera,
  PenTool
} from 'lucide-react';
import { cn, formatCurrency } from './lib/utils';
import { generateItinerary, getSearchSuggestions, getDestinationImages } from './lib/gemini';
import { Trip, DayPlan, PackingItem, Blog, UserProfile } from './types';
import { format, addDays } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { 
  auth, 
  db, 
  googleProvider, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  getDoc,
  orderBy
} from 'firebase/firestore';

// --- Error Boundary ---

class ErrorBoundary extends Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false };
  }

  static getDerivedStateFromError(_: any) {
    return { hasError: true };
  }

  render() {
    if ((this as any).state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-red-50">
          <div className="glass-panel p-8 rounded-3xl max-w-md text-center border-red-100">
            <h2 className="text-2xl font-serif text-red-600 mb-4">Application Error</h2>
            <p className="text-sm text-gray-600 mb-6">Something went wrong.</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-8 py-3 rounded-full font-medium"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

// --- Components ---

const Header = () => (
  <header className="relative h-[40vh] flex flex-col items-center justify-center overflow-hidden himalayan-gradient px-6">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="text-center z-10"
    >
      <h1 className="font-serif text-5xl md:text-7xl font-light tracking-tight text-[#1A1A1A] mb-4">
        Aether
      </h1>
      <p className="text-sm uppercase tracking-[0.3em] text-[#666] font-light">
        Quietly planning your next escape
      </p>
    </motion.div>
    
    {/* Subtle Mountain Silhouette */}
    <div className="absolute bottom-0 left-0 w-full h-32 opacity-10 pointer-events-none">
      <svg viewBox="0 0 1440 320" className="w-full h-full preserve-aspect-ratio">
        <path fill="#1A1A1A" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,256C960,245,1056,203,1152,186.7C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>
    </div>
  </header>
);

const MoodCard = ({ title, vibe, image, onClick }: { title: string, vibe: string, image: string, onClick: () => void }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="relative group cursor-pointer overflow-hidden rounded-2xl aspect-[4/5] glow-card border border-transparent"
  >
    <img 
      src={image} 
      alt={title} 
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      referrerPolicy="no-referrer"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A] via-transparent to-transparent opacity-80" />
    <div className="absolute bottom-0 left-0 p-6 w-full">
      <span className="text-[10px] uppercase tracking-widest text-[#00F2FF] font-semibold mb-2 block">
        {vibe}
      </span>
      <h3 className="text-white text-2xl font-serif">{title}</h3>
    </div>
  </motion.div>
);

const BottomNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => (
  <nav className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-gray-100 px-6 py-4 flex items-center justify-around z-50 md:hidden">
    {[
      { id: 'home', icon: Compass, label: 'Explore' },
      { id: 'plan', icon: Plus, label: 'Plan' },
      { id: 'memories', icon: Camera, label: 'Memories' },
      { id: 'profile', icon: UserIcon, label: 'Profile' }
    ].map((item) => (
      <button 
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        className={cn(
          "flex flex-col items-center gap-1 transition-colors",
          activeTab === item.id ? "text-[#1A1A1A]" : "text-gray-400"
        )}
      >
        <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} />
        <span className="text-[10px] font-medium uppercase tracking-tighter">{item.label}</span>
      </button>
    ))}
  </nav>
);

// --- Main App ---

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    uid: 'guest',
    email: '',
    displayName: '',
    location: '',
    username: '',
    password: ''
  });
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [itineraryTab, setItineraryTab] = useState<'plan' | 'logistics' | 'hotels'>('plan');
  const [memoriesTab, setMemoriesTab] = useState<'trips' | 'images' | 'blogs'>('trips');
  const [blogForm, setBlogForm] = useState({ title: '', content: '', destination: '', imageUrl: '' });
  const [destinationImages, setDestinationImages] = useState<string[]>([]);
  const [searchingImages, setSearchingImages] = useState(false);
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [duration, setDuration] = useState(3);
  const [vibe, setVibe] = useState<'Chill' | 'Adventure' | 'Social' | 'Food' | 'Culture' | 'Relaxation'>('Chill');
  const [budget, setBudget] = useState<'Economic' | 'Standard' | 'Luxury'>('Standard');
  const [currency, setCurrency] = useState('USD');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (u) {
        const userRef = doc(db, 'users', u.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUserProfile(userSnap.data() as UserProfile);
        } else {
          const initialProfile: UserProfile = {
            uid: u.uid,
            email: u.email || '',
            displayName: u.displayName || '',
            photoURL: u.photoURL || '',
            location: '',
            username: '',
            password: '',
            createdAt: Date.now()
          };
          await setDoc(userRef, initialProfile);
          setUserProfile(initialProfile);
        }
      } else {
        // Load from localStorage if guest
        const savedProfile = localStorage.getItem('guestProfile');
        if (savedProfile) {
          setUserProfile(JSON.parse(savedProfile));
        } else {
          setUserProfile({
            uid: 'guest',
            email: '',
            displayName: '',
            location: '',
            username: '',
            password: ''
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setTrips([]);
      setBlogs([]);
      return;
    }

    const qTrips = query(
      collection(db, 'trips'), 
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeTrips = onSnapshot(qTrips, (snapshot) => {
      const tripData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Trip));
      setTrips(tripData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'trips');
    });

    const qBlogs = query(
      collection(db, 'blogs'), 
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeBlogs = onSnapshot(qBlogs, (snapshot) => {
      const blogData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setBlogs(blogData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'blogs');
    });

    return () => {
      unsubscribeTrips();
      unsubscribeBlogs();
    };
  }, [isAuthReady, user]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setActiveTab('home');
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleSearch = async (val: string) => {
    setDestination(val);
    if (val.length > 2) {
      const res = await getSearchSuggestions(val);
      setSuggestions(res);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handlePlanTrip = async () => {
    setLoading(true);
    try {
      const result = await generateItinerary(
        destination, 
        startDate, 
        duration, 
        vibe, 
        budget, 
        currency,
        userProfile?.location
      );
      const tripData = {
        destination,
        startDate,
        duration,
        vibe,
        budget,
        currency,
        ...result,
        uid: user?.uid || 'guest',
        createdAt: Date.now()
      };
      
      let newTrip: Trip;
      if (user) {
        const docRef = await addDoc(collection(db, 'trips'), tripData);
        newTrip = { ...tripData, id: docRef.id } as Trip;
      } else {
        newTrip = { ...tripData, id: `temp-${Date.now()}` } as Trip;
      }
      
      setCurrentTrip(newTrip);
      setIsPlanning(false);
      setActiveTab('itinerary');
    } catch (error) {
      if (user) {
        handleFirestoreError(error, OperationType.CREATE, 'trips');
      } else {
        console.error("Error generating itinerary:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteTrip = async (id: string) => {
    if (id.startsWith('temp-')) {
      if (currentTrip?.id === id) setCurrentTrip(null);
      return;
    }
    try {
      await deleteDoc(doc(db, 'trips', id));
      if (currentTrip?.id === id) setCurrentTrip(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `trips/${id}`);
    }
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const blogData = {
        ...blogForm,
        uid: user.uid,
        createdAt: Date.now()
      };
      await addDoc(collection(db, 'blogs'), blogData);
      setBlogForm({ title: '', content: '', destination: '', imageUrl: '' });
      alert('Blog post saved!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'blogs');
    }
  };

  const handleSearchImages = async () => {
    if (!imageSearchQuery) return;
    setSearchingImages(true);
    try {
      const images = await getDestinationImages(imageSearchQuery);
      setDestinationImages(images);
    } catch (error) {
      console.error("Image search error:", error);
    } finally {
      setSearchingImages(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, userProfile, { merge: true });
        alert('Profile updated successfully!');
      } else {
        localStorage.setItem('guestProfile', JSON.stringify(userProfile));
        alert('Guest profile saved locally!');
      }
    } catch (error) {
      if (user) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      } else {
        console.error("Error saving guest profile:", error);
      }
    }
  };

  const shareTrip = () => {
    if (!currentTrip) return;
    const text = `Check out my trip to ${currentTrip.destination}! Planned with Aether.`;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: 'Aether Trip', text, url });
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className={cn(
      "min-h-screen pb-24 md:pb-0 transition-all duration-300",
      sidebarOpen ? "md:pl-20" : "md:pl-0"
    )}>
      <AnimatePresence mode="wait">
        {activeTab === 'home' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <Header />
            
            <main className="max-w-7xl mx-auto px-6 -mt-12 relative z-20">
              <div className="glass-panel rounded-3xl p-8 mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-3xl font-serif mb-2">Where to next?</h2>
                    <p className="text-gray-500 font-light">Explore destinations by mood and vibe.</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('plan')}
                    className="bg-[#1A1A1A] text-white px-8 py-4 rounded-full font-medium tracking-wide flex items-center gap-2 shadow-xl shadow-black/10 pulse-animation"
                  >
                    <Plus size={20} />
                    Plan My Trip
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MoodCard 
                    title="Misty Peaks" 
                    vibe="Chill" 
                    image="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80"
                    onClick={() => { setDestination('Himalayas'); setVibe('Chill'); setActiveTab('plan'); }}
                  />
                  <MoodCard 
                    title="Neon Nights" 
                    vibe="Social" 
                    image="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80"
                    onClick={() => { setDestination('Tokyo'); setVibe('Social'); setActiveTab('plan'); }}
                  />
                  <MoodCard 
                    title="Azure Shores" 
                    vibe="Relaxation" 
                    image="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
                    onClick={() => { setDestination('Maldives'); setVibe('Relaxation'); setActiveTab('plan'); }}
                  />
                  <MoodCard 
                    title="Ancient Echoes" 
                    vibe="Culture" 
                    image="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80"
                    onClick={() => { setDestination('Rome'); setVibe('Culture'); setActiveTab('plan'); }}
                  />
                </div>
              </div>

              {trips.length > 0 && (
                <section className="mb-12">
                  <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
                    <MapIcon size={20} className="text-gray-400" />
                    Your Past Escapes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trips.map(trip => (
                      <div 
                        key={trip.id}
                        onClick={() => { setCurrentTrip(trip); setActiveTab('itinerary'); }}
                        className="glass-panel p-6 rounded-2xl cursor-pointer hover:shadow-md transition-shadow group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-medium">{trip.destination}</h4>
                            <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">
                              {format(new Date(trip.startDate), 'MMM d, yyyy')} • {trip.duration} Days
                            </p>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteTrip(trip.id); }}
                            className="text-gray-300 hover:text-red-400 transition-colors p-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-semibold uppercase text-gray-500">
                            {trip.vibe}
                          </span>
                          <span className="text-xs text-gray-500 ml-auto group-hover:translate-x-1 transition-transform">
                            View Itinerary →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </main>
          </motion.div>
        )}

        {activeTab === 'plan' && (
          <motion.div 
            key="plan"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl mx-auto px-6 py-12"
          >
            <button onClick={() => setActiveTab('home')} className="mb-8 flex items-center gap-2 text-gray-500 hover:text-black transition-colors">
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            
            <h2 className="text-4xl font-serif mb-2">Plan your escape</h2>
            <p className="text-gray-500 font-light mb-12">Tell us where your heart wants to go.</p>

            <div className="space-y-8">
              <div className="relative">
                <label className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2 block">Destination</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    value={destination}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="e.g. Kyoto, Japan"
                    className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-lg"
                  />
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-100 rounded-2xl mt-2 shadow-2xl z-50 overflow-hidden">
                    {suggestions.map((s, i) => (
                      <button 
                        key={i}
                        onClick={() => { setDestination(s.name); setShowSuggestions(false); }}
                        className="w-full text-left p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <div className="font-medium">{s.name}, {s.country}</div>
                        <div className="text-xs text-gray-400 font-light">{s.description}</div>
                        {s.correctedSpelling && (
                          <div className="text-[10px] text-blue-500 mt-1 italic">Did you mean: {s.correctedSpelling}?</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2 block">Starting Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2 block">Duration (Days)</label>
                  <div className="relative">
                    <Wind className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="number" 
                      min="1"
                      max="30"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-4 block">Select Vibe</label>
                <div className="flex flex-wrap gap-3">
                  {['Chill', 'Adventure', 'Social', 'Food', 'Culture', 'Relaxation'].map((v) => (
                    <button 
                      key={v}
                      onClick={() => setVibe(v as any)}
                      className={cn(
                        "px-6 py-3 rounded-full text-sm font-medium transition-all border",
                        vibe === v 
                          ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" 
                          : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2 block">Budget Tier</label>
                  <div className="flex gap-2">
                    {['Economic', 'Standard', 'Luxury'].map((tier) => (
                      <button 
                        key={tier}
                        onClick={() => setBudget(tier as any)}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-xs font-medium transition-all border",
                          budget === tier 
                            ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" 
                            : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
                        )}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2 block">Currency</label>
                  <select 
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-white border border-gray-100 rounded-2xl py-4 px-4 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all appearance-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePlanTrip}
                disabled={loading || !destination}
                className="w-full bg-[#1A1A1A] text-white py-5 rounded-3xl font-semibold tracking-wide shadow-2xl shadow-black/10 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    <span>Your plan is on the way</span>
                  </>
                ) : (
                  <>
                    <Compass size={20} />
                    <span>Generate Itinerary</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}

        {activeTab === 'itinerary' && currentTrip && (
          <motion.div 
            key="itinerary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-5xl mx-auto px-6 py-12"
          >
            <div className="flex items-center justify-between mb-12">
              <button onClick={() => setActiveTab('home')} className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors">
                <ArrowLeft size={20} />
                <span>All Trips</span>
              </button>
              <div className="flex items-center gap-4">
                <button onClick={shareTrip} className="p-3 bg-white border border-gray-100 rounded-full text-gray-500 hover:text-black transition-colors">
                  <Share2 size={20} />
                </button>
                <button onClick={() => deleteTrip(currentTrip.id)} className="p-3 bg-white border border-gray-100 rounded-full text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-[#00F2FF]/10 text-[#00F2FF] text-[10px] font-bold uppercase tracking-widest rounded-full">
                  {currentTrip.vibe}
                </span>
                <span className="text-gray-400 text-xs uppercase tracking-widest">
                  {format(new Date(currentTrip.startDate), 'MMMM yyyy')}
                </span>
              </div>
              <h2 className="text-5xl font-serif mb-6">{currentTrip.destination}</h2>
              
              {!user && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <Info size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">This trip is not saved.</p>
                      <p className="text-xs text-blue-700">Sign in to save this itinerary to your account.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Sign In to Save
                  </button>
                </motion.div>
              )}
              
              <div className="flex gap-4 mb-8 overflow-x-auto pb-2 no-scrollbar">
                {[
                  { id: 'plan', label: 'Itinerary', icon: Compass },
                  { id: 'logistics', label: 'Logistics', icon: Plane },
                  { id: 'hotels', label: 'Hotels', icon: Hotel }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setItineraryTab(tab.id as any)}
                    className={cn(
                      "px-6 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 border",
                      itineraryTab === tab.id 
                        ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-lg shadow-black/5" 
                        : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
                    )}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                    <Cloud size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Weather</p>
                    <p className="font-medium">{currentTrip.weather.temp} • {currentTrip.weather.condition}</p>
                  </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Budget Tier</p>
                    <p className="font-medium">{currentTrip.budget}</p>
                  </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-500">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Duration</p>
                    <p className="font-medium">{currentTrip.duration} Days</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-12">
                {itineraryTab === 'plan' && currentTrip.itinerary.map((day, idx) => (
                  <section key={idx}>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 bg-[#1A1A1A] text-white rounded-full flex items-center justify-center font-serif text-lg">
                        {day.day}
                      </div>
                      <div>
                        <h3 className="text-xl font-medium">Day {day.day}</h3>
                        <p className="text-sm text-gray-400">{format(addDays(new Date(currentTrip.startDate), day.day - 1), 'EEEE, MMMM d')}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-6 ml-5 pl-9 border-l border-gray-100">
                      {day.activities.map((act, aIdx) => (
                        <motion.div 
                          key={act.id || aIdx}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          className="relative group"
                        >
                          <div className="absolute -left-[45px] top-2 w-3 h-3 bg-white border-2 border-[#1A1A1A] rounded-full z-10" />
                          <div className="glass-panel p-6 rounded-2xl hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-mono text-gray-400">{act.time}</span>
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter",
                                act.type === 'Food' ? "bg-orange-50 text-orange-500" :
                                act.type === 'Activity' ? "bg-blue-50 text-blue-500" :
                                act.type === 'Sightseeing' ? "bg-purple-50 text-purple-500" :
                                "bg-green-50 text-green-500"
                              )}>
                                {act.type}
                              </span>
                            </div>
                            <h4 className="font-medium text-lg mb-1">{act.title}</h4>
                            <p className="text-sm text-gray-500 font-light mb-3 leading-relaxed">{act.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <MapIcon size={12} />
                                <span>{act.location}</span>
                              </div>
                              {act.cost && (
                                <span className="text-xs font-medium text-gray-600">
                                  {formatCurrency(act.cost, currentTrip.currency)}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                ))}

                {itineraryTab === 'logistics' && (
                  <div className="space-y-12">
                    <section>
                      <h3 className="text-2xl font-serif mb-6 flex items-center gap-3">
                        <Plane size={24} className="text-blue-500" />
                        Airports & Flights
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {currentTrip.transportation.airports.map((airport, i) => (
                          <div key={i} className="glass-panel p-6 rounded-2xl border-l-4 border-blue-500">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium">{airport.name}</h4>
                              <span className="text-xs font-mono bg-blue-50 text-blue-600 px-2 py-1 rounded uppercase">{airport.code}</span>
                            </div>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <MapPin size={12} />
                              {airport.distance} from city center
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Flight Options</h4>
                        {currentTrip.transportation.flights.map((flight, i) => (
                          <a 
                            key={i} 
                            href={flight.googleSearchUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between glass-panel p-4 rounded-2xl hover:bg-gray-50 transition-colors group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                                <Plane size={18} />
                              </div>
                              <div>
                                <p className="font-medium">{flight.airline}</p>
                                <p className="text-xs text-gray-400">Estimated: {formatCurrency(flight.estimatedPrice, currentTrip.currency)}</p>
                              </div>
                            </div>
                            <ExternalLink size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                          </a>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-2xl font-serif mb-6 flex items-center gap-3">
                        <Train size={24} className="text-green-500" />
                        Train Stations & Rail
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {currentTrip.transportation.trainStations.map((station, i) => (
                          <div key={i} className="glass-panel p-6 rounded-2xl border-l-4 border-green-500">
                            <h4 className="font-medium mb-2">{station.name}</h4>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <MapPin size={12} />
                              {station.distance} from city center
                            </p>
                          </div>
                        ))}
                      </div>
                      {currentTrip.transportation.trains.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Train Options</h4>
                          {currentTrip.transportation.trains.map((train, i) => (
                            <a 
                              key={i} 
                              href={train.googleSearchUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center justify-between glass-panel p-4 rounded-2xl hover:bg-gray-50 transition-colors group"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                                  <Train size={18} />
                                </div>
                                <div>
                                  <p className="font-medium">{train.name}</p>
                                  <p className="text-xs text-gray-400">Estimated: {formatCurrency(train.estimatedPrice, currentTrip.currency)}</p>
                                </div>
                              </div>
                              <ExternalLink size={16} className="text-gray-300 group-hover:text-green-500 transition-colors" />
                            </a>
                          ))}
                        </div>
                      )}
                    </section>

                    <section className="glass-panel p-8 rounded-3xl bg-gray-50/50">
                      <h3 className="text-xl font-serif mb-4 flex items-center gap-2">
                        <Info size={20} className="text-gray-400" />
                        How to Reach
                      </h3>
                      <p className="text-gray-600 leading-relaxed font-light">{currentTrip.transportation.howToReach}</p>
                    </section>
                  </div>
                )}

                {itineraryTab === 'hotels' && (
                  <div className="space-y-8">
                    <h3 className="text-2xl font-serif mb-6 flex items-center gap-3">
                      <Hotel size={24} className="text-purple-500" />
                      Recommended Stays
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      {currentTrip.hotels.map((hotel, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="glass-panel p-8 rounded-3xl hover:shadow-lg transition-all group"
                        >
                          <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-2xl font-serif">{hotel.name}</h4>
                                <span className="px-2 py-1 bg-yellow-50 text-yellow-600 text-[10px] font-bold rounded uppercase tracking-widest">
                                  {hotel.rating}
                                </span>
                              </div>
                              <p className="text-gray-500 font-light mb-4 leading-relaxed">{hotel.description}</p>
                              <div className="flex items-center gap-6">
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Per Night</p>
                                  <p className="text-xl font-medium">{formatCurrency(hotel.estimatedPricePerNight, currentTrip.currency)}</p>
                                </div>
                                <a 
                                  href={hotel.googleSearchUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="mt-auto flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
                                >
                                  Book on Google <ExternalLink size={14} />
                                </a>
                              </div>
                            </div>
                            <div className="w-full md:w-48 h-32 bg-gray-100 rounded-2xl overflow-hidden">
                              <img 
                                src={`https://picsum.photos/seed/${hotel.name}/400/300`} 
                                alt={hotel.name} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <aside className="space-y-8">
                <div className="glass-panel p-8 rounded-3xl">
                  <h3 className="text-lg font-serif mb-6 flex items-center gap-2">
                    <Briefcase size={18} className="text-gray-400" />
                    Packing Essentials
                  </h3>
                  <div className="space-y-4">
                    {currentTrip.packingList.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 group cursor-pointer">
                        <Circle size={18} className="text-gray-200 group-hover:text-gray-400 transition-colors" />
                        <span className="text-sm text-gray-600 font-light">{item.item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel p-8 rounded-3xl">
                  <h3 className="text-lg font-serif mb-6 flex items-center gap-2">
                    <Compass size={18} className="text-gray-400" />
                    Local Tips
                  </h3>
                  <div className="space-y-6">
                    {currentTrip.tips.map((tip, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="text-[10px] font-mono text-gray-300 mt-1">0{i+1}</div>
                        <p className="text-sm text-gray-600 font-light leading-relaxed italic">"{tip}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel p-8 rounded-3xl">
                  <h3 className="text-lg font-serif mb-6 flex items-center gap-2">
                    <DollarSign size={18} className="text-gray-400" />
                    Budget Insights
                  </h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={currentTrip.itinerary.map(d => ({ 
                        day: `D${d.day}`, 
                        cost: d.activities.reduce((sum, a) => sum + (a.cost || 0), 0) 
                      }))}>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} />
                        <Tooltip 
                          cursor={{ fill: 'transparent' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                          {currentTrip.itinerary.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#1A1A1A' : '#E5E5E5'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-xs text-gray-400">Estimated Total</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        currentTrip.itinerary.reduce((sum, d) => 
                          sum + d.activities.reduce((s, a) => s + (a.cost || 0), 0), 0
                        ), 
                        currentTrip.currency
                      )}
                    </span>
                  </div>
                </div>
              </aside>
            </div>
          </motion.div>
        )}
        {activeTab === 'memories' && (
          <motion.div 
            key="memories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto px-6 py-12"
          >
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-4xl font-serif">Memories & Blogs</h2>
              <div className="flex bg-gray-100 p-1 rounded-2xl">
                {[
                  { id: 'trips', label: 'Trips', icon: MapIcon },
                  { id: 'images', label: 'Images', icon: ImageIcon },
                  { id: 'blogs', label: 'Blogs', icon: BookOpen }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setMemoriesTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                      memoriesTab === tab.id ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {memoriesTab === 'trips' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {trips.length > 0 ? (
                  trips.map((trip) => (
                    <motion.div 
                      key={trip.id}
                      whileHover={{ y: -5 }}
                      onClick={() => {
                        setCurrentTrip(trip);
                        setActiveTab('itinerary');
                      }}
                      className="glass-panel overflow-hidden rounded-3xl group cursor-pointer"
                    >
                      <div className="h-48 overflow-hidden">
                        <img 
                          src={`https://picsum.photos/seed/${trip.destination}/800/600`} 
                          alt={trip.destination} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">
                          <MapPin size={10} /> {trip.vibe}
                        </div>
                        <h4 className="text-xl font-serif mb-3">{trip.destination}</h4>
                        <button className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
                          View Itinerary <ChevronRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <MapIcon size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium text-gray-600">No trips saved yet</h3>
                    <p className="text-gray-400 mt-2">Start planning your next adventure!</p>
                  </div>
                )}
              </div>
            )}

            {memoriesTab === 'images' && (
              <div className="space-y-8">
                <div className="glass-panel p-8 rounded-3xl">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input 
                        type="text"
                        value={imageSearchQuery}
                        onChange={(e) => setImageSearchQuery(e.target.value)}
                        placeholder="Search destination images..."
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchImages()}
                      />
                    </div>
                    <button 
                      onClick={handleSearchImages}
                      disabled={searchingImages}
                      className="bg-[#1A1A1A] text-white px-8 rounded-2xl font-medium hover:bg-black transition-colors disabled:opacity-50"
                    >
                      {searchingImages ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {destinationImages.map((url, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="aspect-square rounded-2xl overflow-hidden group relative"
                    >
                      <img src={url} alt="Destination" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => setBlogForm({ ...blogForm, imageUrl: url })}
                          className="bg-white/90 backdrop-blur-sm p-2 rounded-full text-black hover:bg-white transition-colors"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {memoriesTab === 'blogs' && (
              <div className="space-y-12">
                <div className="glass-panel p-8 rounded-3xl">
                  <h3 className="text-2xl font-serif mb-6 flex items-center gap-2">
                    <PenTool size={24} className="text-gray-400" />
                    Write a New Blog
                  </h3>
                  <form onSubmit={handleSaveBlog} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Title</label>
                        <input 
                          type="text"
                          value={blogForm.title}
                          onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/5"
                          placeholder="My Amazing Trip to..."
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Destination</label>
                        <input 
                          type="text"
                          value={blogForm.destination}
                          onChange={(e) => setBlogForm({ ...blogForm, destination: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/5"
                          placeholder="Paris, France"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Image URL</label>
                      <input 
                        type="text"
                        value={blogForm.imageUrl}
                        onChange={(e) => setBlogForm({ ...blogForm, imageUrl: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/5"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Content</label>
                      <textarea 
                        value={blogForm.content}
                        onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 h-32 focus:outline-none focus:ring-2 focus:ring-black/5"
                        placeholder="Share your experience..."
                        required
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl font-semibold tracking-wide shadow-xl shadow-black/10 hover:bg-black transition-colors"
                    >
                      Publish Blog Post
                    </button>
                  </form>
                </div>

                <div className="space-y-8">
                  <h3 className="text-2xl font-serif">Recent Blogs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {blogs.map((blog) => (
                      <motion.div 
                        key={blog.id}
                        className="glass-panel overflow-hidden rounded-3xl group cursor-pointer"
                        whileHover={{ y: -5 }}
                      >
                        {blog.imageUrl && (
                          <div className="h-48 overflow-hidden">
                            <img src={blog.imageUrl} alt={blog.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        <div className="p-6">
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">
                            <MapPin size={10} /> {blog.destination}
                          </div>
                          <h4 className="text-xl font-serif mb-3">{blog.title}</h4>
                          <p className="text-gray-500 font-light text-sm line-clamp-3 leading-relaxed">{blog.content}</p>
                          <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-xs text-gray-400">{format(blog.createdAt, 'MMM d, yyyy')}</span>
                            <button className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
                              Read More <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
        {activeTab === 'profile' && (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-2xl mx-auto px-6 py-12"
          >
            <h2 className="text-4xl font-serif mb-8">Your Profile</h2>
            <div className="glass-panel p-8 rounded-3xl">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="flex flex-col items-center mb-8">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4 bg-gray-100 flex items-center justify-center text-gray-400">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={48} />
                    )}
                  </div>
                  <h3 className="text-2xl font-medium">{userProfile.displayName || (user ? 'Traveler' : 'Guest Traveler')}</h3>
                  {user && <p className="text-gray-500 font-light">{user.email}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold flex items-center gap-2">
                      <UserIcon size={12} /> Full Name
                    </label>
                    <input 
                      type="text"
                      value={userProfile.displayName || ''}
                      onChange={(e) => setUserProfile({ ...userProfile, displayName: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      placeholder="Your Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold flex items-center gap-2">
                      <MapPin size={12} /> Home Location
                    </label>
                    <input 
                      type="text"
                      value={userProfile.location || ''}
                      onChange={(e) => setUserProfile({ ...userProfile, location: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      placeholder="City, Country"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold flex items-center gap-2">
                      <Mail size={12} /> Username
                    </label>
                    <input 
                      type="text"
                      value={userProfile.username || ''}
                      onChange={(e) => setUserProfile({ ...userProfile, username: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      placeholder="Username"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold flex items-center gap-2">
                      <Lock size={12} /> Password
                    </label>
                    <input 
                      type="password"
                      value={userProfile.password || ''}
                      onChange={(e) => setUserProfile({ ...userProfile, password: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  <button 
                    type="submit"
                    className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl font-semibold tracking-wide shadow-xl shadow-black/10 hover:bg-black transition-colors"
                  >
                    Save Profile
                  </button>
                  
                  {!user ? (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-center text-xs text-gray-400 mb-4 uppercase tracking-widest font-semibold">Or Connect Account</p>
                      <button 
                        type="button"
                        onClick={handleSignIn}
                        className="w-full bg-white border border-gray-100 text-gray-600 py-4 rounded-2xl font-semibold tracking-wide hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
                      >
                        <UserIcon size={20} />
                        <span>Sign in with Google</span>
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={handleSignOut}
                      className="w-full bg-white border border-gray-100 text-gray-600 py-4 rounded-2xl font-semibold tracking-wide hover:bg-gray-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Sidebar Toggle Button (Desktop) */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="hidden md:flex fixed left-4 top-4 z-[60] p-2 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Desktop Sidebar Nav */}
      <motion.nav 
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -100 }}
        className="hidden md:flex fixed left-0 top-0 h-full w-20 bg-white border-r border-gray-100 flex-col items-center py-12 gap-8 z-50"
      >
        <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-white font-serif text-xl mb-4">A</div>
        {[
          { id: 'home', icon: Compass },
          { id: 'plan', icon: Plus },
          { id: 'memories', icon: Camera },
          { id: 'profile', icon: UserIcon }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "p-3 rounded-2xl transition-all",
              activeTab === item.id ? "bg-gray-50 text-[#1A1A1A]" : "text-gray-300 hover:text-gray-500"
            )}
          >
            <item.icon size={24} />
          </button>
        ))}
      </motion.nav>
    </div>
  );
}
