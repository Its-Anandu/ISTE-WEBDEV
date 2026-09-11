'use client';

import React, { useState, useMemo } from 'react';
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  IdCard,
  Sparkles,
  CheckCircle2,
  Loader2,
  ArrowRight,
  AlertCircle,
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  Search,
  RotateCcw,
  WifiOff,
} from 'lucide-react';

interface RegistrationFormProps {
  slug: string;
}

export interface FormState {
  fullName: string;
  email: string;
  phone: string;
  college: string;
  yearOfStudy: string;
  isteId: string;
}

export interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  college?: string;
  yearOfStudy?: string;
}

export default function RegistrationForm({ slug }: RegistrationFormProps) {
  const [formData, setFormData] = useState<FormState>({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    yearOfStudy: '1st',
    isteId: '',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isNetworkError, setIsNetworkError] = useState<boolean>(false);

  // Flow & State management
  // Steps: 'form' -> 'registered' -> 'payment' -> 'confirmed' (also 'duplicate' & 'lookup')
  const [step, setStep] = useState<'form' | 'registered' | 'payment' | 'confirmed' | 'duplicate' | 'lookup'>('form');
  const [registrationId, setRegistrationId] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [amount, setAmount] = useState<number>(100);
  const [duplicateStatus, setDuplicateStatus] = useState<string>('');

  // UTR submission state
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState<boolean>(false);
  const [utrError, setUtrError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Lookup state
  const [lookupEmail, setLookupEmail] = useState<string>('');
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [lookupResult, setLookupResult] = useState<{
    found: boolean;
    registrationId?: string;
    paymentStatus?: string;
    fullName?: string;
    message?: string;
  } | null>(null);

  // Formatting display title from slug
  const formattedEventTitle = useMemo(() => {
    return slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [slug]);

  // Client-side validation logic
  const errors = useMemo<FormErrors>(() => {
    const errs: FormErrors = {};

    if (!formData.fullName.trim()) {
      errs.fullName = 'Full Name is required';
    } else if (formData.fullName.trim().length < 2) {
      errs.fullName = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (phoneDigits.length !== 10) {
      errs.phone = 'Phone number must be exactly 10 digits';
    }

    if (!formData.college.trim()) {
      errs.college = 'College/Department is required';
    }

    if (!formData.yearOfStudy) {
      errs.yearOfStudy = 'Please select your year of study';
    }

    return errs;
  }, [formData]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (apiError) setApiError(null);
    if (isNetworkError) setIsNetworkError(false);
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    setApiError(null);
    setIsNetworkError(false);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          slug,
          eventId: slug,
        }),
      });

      const result = await response.json();

      if (response.status === 409) {
        setRegistrationId(result.existingRegistrationId || '');
        setDuplicateStatus(result.paymentStatus || 'Pending');
        setStep('duplicate');
        return;
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit registration');
      }

      setRegistrationId(result.registrationId || crypto.randomUUID());
      if (result.qrDataUrl) setQrDataUrl(result.qrDataUrl);
      if (result.amount) setAmount(result.amount);
      
      // Move to Part 2 Success Confirmation Screen
      setStep('registered');
    } catch (err: any) {
      if (err.name === 'TypeError' || err.message.includes('fetch')) {
        setIsNetworkError(true);
      } else {
        setApiError(err.message || 'Something went wrong, please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utrNumber.trim() || 'COMPLETED';

    setIsSubmittingUtr(true);
    setUtrError(null);

    try {
      const response = await fetch('/api/register/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId,
          utrNumber: cleanUtr,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit payment reference.');
      }

      setStep('confirmed');
    } catch (err: any) {
      setUtrError(err.message || 'Error updating payment status. Please check your connection.');
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupEmail.trim()) return;

    setIsLookingUp(true);
    setLookupResult(null);

    try {
      const response = await fetch('/api/register/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lookupEmail.trim(), eventId: slug }),
      });

      const result = await response.json();
      setLookupResult(result);
    } catch (err: any) {
      setLookupResult({ found: false, message: 'Network error looking up registration.' });
    } finally {
      setIsLookingUp(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // STEP: LOOKUP EXISTING REGISTRATION
  if (step === 'lookup') {
    return (
      <div className="w-full max-w-lg mx-auto bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-10 shadow-xl space-y-6 animate-in fade-in duration-300">
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 mb-1">
            <Search className="w-3.5 h-3.5" /> Registration Lookup
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Find My Registration
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Enter your registered email address to check status for <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formattedEventTitle}</span>.
          </p>
        </div>

        <form onSubmit={handleLookupSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-semibold tracking-wide uppercase text-zinc-700 dark:text-zinc-300">
              Registered Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="email"
                required
                placeholder="your-email@example.com"
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-zinc-900 dark:text-zinc-100 shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLookingUp || !lookupEmail.trim()}
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-amber-600 hover:bg-amber-500 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
          >
            {isLookingUp ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Looking up...
              </>
            ) : (
              <>
                Check Status <Search className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {lookupResult && (
          <div className="p-4 rounded-xl text-xs space-y-2 border animate-in fade-in duration-200 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700">
            {lookupResult.found ? (
              <>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Registration Found!
                </p>
                <p><strong className="text-zinc-700 dark:text-zinc-300">Name:</strong> {lookupResult.fullName}</p>
                <p><strong className="text-zinc-700 dark:text-zinc-300">Registration ID:</strong> <code className="font-mono text-amber-600 dark:text-amber-400">{lookupResult.registrationId}</code></p>
                <p><strong className="text-zinc-700 dark:text-zinc-300">Payment Status:</strong> <span className="font-semibold">{lookupResult.paymentStatus}</span></p>
              </>
            ) : (
              <p className="text-rose-500 font-medium">{lookupResult.message}</p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setStep('form')}
          className="w-full py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Return to Registration Form
        </button>
      </div>
    );
  }

  // STEP: DUPLICATE REGISTRATION SCREEN (409)
  if (step === 'duplicate') {
    return (
      <div className="w-full max-w-lg mx-auto bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-amber-200 dark:border-amber-900/60 p-8 md:p-10 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300 my-6">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 rounded-full flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Already Registered!
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            The email <span className="font-semibold text-zinc-900 dark:text-zinc-200">{formData.email}</span> has already submitted a registration for <span className="font-semibold text-zinc-900 dark:text-zinc-200">{formattedEventTitle}</span>.
          </p>
        </div>

        {registrationId && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-1 text-center">
            <span className="text-xs uppercase font-bold tracking-wider text-amber-800 dark:text-amber-400 block">Existing Registration ID</span>
            <code className="text-sm font-mono font-bold text-amber-900 dark:text-amber-200 select-all">{registrationId}</code>
            <p className="text-[11px] text-zinc-500 mt-1">Payment Status: <strong>{duplicateStatus}</strong></p>
          </div>
        )}

        <button
          onClick={() => {
            setStep('form');
            setRegistrationId('');
          }}
          className="w-full py-3.5 px-4 rounded-xl font-medium text-sm transition-all bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-md"
        >
          Back to Registration Form
        </button>
      </div>
    );
  }

  // PART 2: SUCCESS CONFIRMATION SCREEN
  if (step === 'registered') {
    return (
      <div className="w-full max-w-lg mx-auto bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-emerald-200 dark:border-emerald-900/60 p-8 md:p-10 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300 my-6">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            You're registered!
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Your registration for <span className="font-semibold text-zinc-900 dark:text-zinc-200">{formattedEventTitle}</span> has been logged successfully.
          </p>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-left text-xs space-y-2.5 border border-zinc-200/60 dark:border-zinc-700/60">
          <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-700/60 pb-2">
            <span className="text-zinc-500 dark:text-zinc-400">Event:</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formattedEventTitle}</span>
          </div>
          <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-700/60 pb-2">
            <span className="text-zinc-500 dark:text-zinc-400">Email:</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formData.email}</span>
          </div>
          <div className="flex justify-between items-center pt-0.5">
            <span className="text-zinc-500 dark:text-zinc-400">Registration ID:</span>
            <code className="font-mono text-amber-600 dark:text-amber-400 font-bold">{registrationId}</code>
          </div>
        </div>

        <button
          onClick={() => setStep('payment')}
          className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          Proceed to Payment
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // PART 3: PLACEHOLDER QR & PAYMENT STEP
  if (step === 'payment') {
    return (
      <div className="w-full max-w-lg mx-auto bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-10 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-300 my-6">
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 mb-1">
            <QrCode className="w-3.5 h-3.5" /> Step 2: Complete Payment
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Scan & Pay ₹{amount}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Scan the placeholder QR code using Google Pay, PhonePe, or Paytm to complete payment.
          </p>
        </div>

        {/* QR Code Display Card */}
        <div className="p-5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center space-y-4">
          <div className="p-3 bg-white rounded-xl shadow-inner border border-zinc-200">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="UPI Payment QR Code"
                className="w-56 h-56 object-contain rounded-lg"
              />
            ) : (
              /* SVG Placeholder QR fallback when data URL is generated */
              <div className="w-56 h-56 bg-zinc-100 flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 rounded-lg p-4 text-center">
                <QrCode className="w-16 h-16 text-zinc-400 mb-2" />
                <p className="text-[11px] font-mono text-zinc-600 font-semibold">TEST PLACEHOLDER QR</p>
                <p className="text-[10px] text-zinc-400 mt-1">ID: {registrationId.slice(0, 8)}</p>
              </div>
            )}
          </div>

          <div className="text-center space-y-1.5">
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Amount Due: <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">₹{amount} INR</span>
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
              <span>Registration ID:</span>
              <code className="font-mono bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-800 dark:text-zinc-200 select-all">
                {registrationId.slice(0, 13)}...
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(registrationId)}
                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-all text-zinc-600 dark:text-zinc-400"
                title="Copy Registration ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Payment Confirmation Form */}
        <form onSubmit={handleConfirmPayment} className="space-y-5 pt-2">
          {utrError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{utrError}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-semibold tracking-wide uppercase text-zinc-700 dark:text-zinc-300">
              UPI Transaction ID / UTR Number <span className="text-zinc-400 lowercase">(optional for test)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 423910842910 (12-digit UTR or leave blank for test)"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 font-mono shadow-sm"
            />
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Enter your 12-digit UPI UTR number or click below to complete test payment.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmittingUtr}
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white active:scale-[0.99] shadow-emerald-600/20"
          >
            {isSubmittingUtr ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating Google Sheet...
              </>
            ) : (
              <>
                I've completed payment
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  // STEP: FINAL PAYMENT CONFIRMED MESSAGE SCREEN
  if (step === 'confirmed') {
    return (
      <div className="w-full max-w-lg mx-auto bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 md:p-10 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300 my-6">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Payment reference submitted — thank you for registering!
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Your registration status for <span className="font-semibold text-zinc-900 dark:text-zinc-200">{formattedEventTitle}</span> has been updated to <strong className="text-amber-600 dark:text-amber-400">Awaiting Verification</strong>. An admin will verify your payment shortly.
          </p>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-left text-xs space-y-2.5 border border-zinc-200/60 dark:border-zinc-700/60">
          <p><strong className="text-zinc-700 dark:text-zinc-300">Registration ID:</strong> <code className="font-mono text-amber-600 dark:text-amber-400 font-bold">{registrationId}</code></p>
          <p><strong className="text-zinc-700 dark:text-zinc-300">Payment Status:</strong> <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold">Awaiting Verification</span></p>
        </div>

        <button
          onClick={() => {
            setStep('form');
            setRegistrationId('');
            setUtrNumber('');
            setFormData({
              fullName: '',
              email: '',
              phone: '',
              college: '',
              yearOfStudy: '1st',
              isteId: '',
            });
          }}
          className="w-full py-3.5 px-4 rounded-xl font-medium text-sm transition-all bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-md"
        >
          Register Another Candidate
        </button>
      </div>
    );
  }

  // PART 4: POLISHED INITIAL REGISTRATION FORM SCREEN
  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl mx-auto bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-10 shadow-xl space-y-6 my-6"
    >
      {/* Event Header Banner */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5 mb-2 flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Event Registration
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            {formattedEventTitle}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            Event Slug: <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300">{slug}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setStep('lookup')}
          className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 shrink-0 pt-2"
        >
          <Search className="w-3.5 h-3.5" /> Already registered?
        </button>
      </div>

      {/* Network Error Banner */}
      {isNetworkError && (
        <div className="p-4 bg-amber-950/60 border border-amber-900 rounded-xl text-amber-300 text-xs flex items-start gap-3">
          <WifiOff className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-200">Network Error</p>
            <p className="mt-0.5">Something went wrong contacting the server. Please check your connection and try again.</p>
          </div>
        </div>
      )}

      {/* API Error Banner */}
      {apiError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          <div>
            <p className="font-semibold">Submission Error</p>
            <p className="mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {/* Full Name */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold tracking-wide uppercase text-zinc-700 dark:text-zinc-300">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              name="fullName"
              placeholder="e.g. Anandu M"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={() => handleBlur('fullName')}
              className={`w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/80 border rounded-xl text-sm transition-all focus:outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 shadow-sm ${
                touched.fullName && errors.fullName
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-zinc-300 dark:border-zinc-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
              }`}
            />
          </div>
          {touched.fullName && errors.fullName && (
            <p className="text-xs text-rose-500 font-medium">{errors.fullName}</p>
          )}
        </div>

        {/* Email & Phone Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Email */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold tracking-wide uppercase text-zinc-700 dark:text-zinc-300">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="email"
                name="email"
                placeholder="anandu@example.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
                className={`w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/80 border rounded-xl text-sm transition-all focus:outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 shadow-sm ${
                  touched.email && errors.email
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-zinc-300 dark:border-zinc-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                }`}
              />
            </div>
            {touched.email && errors.email && (
              <p className="text-xs text-rose-500 font-medium">{errors.email}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold tracking-wide uppercase text-zinc-700 dark:text-zinc-300">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="tel"
                name="phone"
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={handleChange}
                onBlur={() => handleBlur('phone')}
                className={`w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/80 border rounded-xl text-sm transition-all focus:outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 shadow-sm ${
                  touched.phone && errors.phone
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-zinc-300 dark:border-zinc-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                }`}
              />
            </div>
            {touched.phone && errors.phone && (
              <p className="text-xs text-rose-500 font-medium">{errors.phone}</p>
            )}
          </div>
        </div>

        {/* College / Department */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold tracking-wide uppercase text-zinc-700 dark:text-zinc-300">
            College / Department <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              name="college"
              placeholder="e.g. MBCET - Computer Science"
              value={formData.college}
              onChange={handleChange}
              onBlur={() => handleBlur('college')}
              className={`w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/80 border rounded-xl text-sm transition-all focus:outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 shadow-sm ${
                touched.college && errors.college
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-zinc-300 dark:border-zinc-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
              }`}
            />
          </div>
          {touched.college && errors.college && (
            <p className="text-xs text-rose-500 font-medium">{errors.college}</p>
          )}
        </div>

        {/* Year of Study & ISTE Membership ID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Year of Study */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold tracking-wide uppercase text-zinc-700 dark:text-zinc-300">
              Year of Study <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <select
                name="yearOfStudy"
                value={formData.yearOfStudy}
                onChange={handleChange}
                onBlur={() => handleBlur('yearOfStudy')}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-zinc-900 dark:text-zinc-100 appearance-none shadow-sm"
              >
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="4th">4th Year</option>
              </select>
            </div>
            {touched.yearOfStudy && errors.yearOfStudy && (
              <p className="text-xs text-rose-500 font-medium">{errors.yearOfStudy}</p>
            )}
          </div>

          {/* ISTE Membership ID (Optional) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold tracking-wide uppercase text-zinc-700 dark:text-zinc-300">
              ISTE Membership ID <span className="text-zinc-400 font-normal lowercase">(optional)</span>
            </label>
            <div className="relative">
              <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                name="isteId"
                placeholder="e.g. ISTE-12345"
                value={formData.isteId}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
            !isValid || isSubmitting
              ? 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white active:scale-[0.99] shadow-amber-600/20'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting Registration...
            </>
          ) : (
            <>
              Submit Registration
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
