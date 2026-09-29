'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  ArrowRight,
  AlertCircle,
  Copy,
  Check,
  Search,
  RotateCcw,
  Sun,
  Moon,
  X,
  Upload,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RegistrationFormProps {
  slug: string;
}

export interface FormState {
  fullName: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  yearOfStudy: string;
  classGroup: string;
  isteId: string;
}

export interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  college?: string;
  department?: string;
  yearOfStudy?: string;
  classGroup?: string;
}

// Input styling helper matching editorial theme
const inputCls =
  "h-[56px] w-full rounded-[14px] border border-[#2B261F] dark:border-[#4A4338] bg-transparent text-[#1A1814] dark:text-[#F6F2EA] px-5 text-base placeholder:text-[#9E9385] dark:placeholder:text-[#7D7365] transition-colors duration-200 focus:border-[#1A1814] dark:focus:border-[#F6F2EA] focus:bg-[#F2ECE0]/50 dark:focus:bg-[#25201A] focus:outline-none focus:ring-2 focus:ring-[#1A1814]/15 dark:focus:ring-white/15 sm:h-[64px] sm:text-lg font-sans";
const errorCls = "border-[#DC2626] dark:border-[#EF4444] focus:border-[#DC2626] focus:ring-[#DC2626]/20";

function FieldRow({
  id,
  label,
  hint,
  required = false,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const meta = hint ?? (required ? null : 'Optional');
  return (
    <div className={cn('w-full', className)}>
      <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
        <label
          htmlFor={id}
          className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#2A2622] dark:text-[#D5CCB8] font-sans"
        >
          {label}
          {required && (
            <span className="ml-1 text-[#C1121F] dark:text-[#EF4444]" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {meta && (
          <span className="text-xs font-medium text-[#7D7365] dark:text-[#A39887] font-sans">
            {meta}
          </span>
        )}
      </div>
      {children}
      {error && (
        <p role="alert" className="mt-2 px-1 text-xs font-semibold text-[#C1121F] dark:text-[#EF4444]">
          {error}
        </p>
      )}
    </div>
  );
}

export default function RegistrationForm({ slug }: RegistrationFormProps) {
  // Theme state ('light' | 'dark')
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('novatos-theme') as 'light' | 'dark' | null;
      if (saved) {
        setTheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch {}
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('novatos-theme', nextTheme);
    } catch {}
  };

  const [formData, setFormData] = useState<FormState>({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    department: '',
    yearOfStudy: '',
    classGroup: '',
    isteId: '',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Flow step management ('form' | 'payment' | 'lookup')
  const [step, setStep] = useState<'form' | 'payment' | 'lookup'>('form');
  const [referenceId, setReferenceId] = useState<string>('');
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Payment proof state
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentFileError, setPaymentFileError] = useState<string | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  // Lookup state
  const [lookupEmail, setLookupEmail] = useState<string>('');
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [lookupResult, setLookupResult] = useState<{
    found: boolean;
    referenceId?: string;
    fullName?: string;
    yearOfStudy?: string;
    paymentStatus?: string;
    message?: string;
  } | null>(null);

  // Formatted Event Title
  const formattedEventTitle = useMemo(() => {
    if (slug.toLowerCase() === 'novatos') return 'Novatos';
    return slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [slug]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Client-side validation logic (all 5 Section B fields required except isteId)
  const errors = useMemo<FormErrors>(() => {
    const errs: FormErrors = {};

    if (!formData.fullName.trim()) {
      errs.fullName = 'Please enter your full name.';
    } else if (formData.fullName.trim().length < 2) {
      errs.fullName = 'Please enter your full name.';
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!formData.email.trim()) {
      errs.email = 'Please enter a valid email address.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      errs.phone = 'Enter the 10-digit mobile number.';
    } else if (phoneDigits.length !== 10) {
      errs.phone = 'Enter the 10-digit mobile number.';
    }

    if (!formData.college.trim()) {
      errs.college = 'Please enter your college.';
    }

    if (!formData.department) {
      errs.department = 'Select your department.';
    }

    if (!formData.yearOfStudy) {
      errs.yearOfStudy = 'Select your year of study.';
    }

    if (!formData.classGroup) {
      errs.classGroup = 'Select your class.';
    }

    return errs;
  }, [formData]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let nextVal = value;
    if (name === 'phone') {
      nextVal = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormData((prev) => ({ ...prev, [name]: nextVal }));
    if (apiError) setApiError(null);
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const generateReferenceId = () => {
    const randomHex = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `NV-${randomHex}`;
  };

  // Handle Initial Form Submission -> Move to Payment Step
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      college: true,
      department: true,
      yearOfStudy: true,
      classGroup: true,
    });

    if (!isValid) {
      showToast('Please fill in all required fields before submitting.');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    const newRefId = generateReferenceId();

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
          registrationId: newRefId,
          referenceId: newRefId,
        }),
      });

      const result = await response.json();

      if (response.status === 409) {
        setTouched((prev) => ({ ...prev, email: true }));
        setApiError('This email is already registered for Novatos.');
        showToast('This email is already registered — check status with "Already registered?".');
        return;
      }

      if (!response.ok) {
        throw new Error(result.error || 'Submission failed — please try again.');
      }

      const assignedId = result.registrationId || result.reference_id || newRefId;
      setReferenceId(assignedId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setStep('payment');
      showToast('Form submitted! Now complete your compulsory payment screenshot upload.');
    } catch (err: any) {
      showToast(err.message || 'Submission failed — please try again in a moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Payment file selection & validation (Compulsory JPG/PNG <= 5MB)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPaymentFileError(null);
    setPaymentSuccessMsg(null);

    if (!file) {
      setPaymentFile(null);
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type.toLowerCase())) {
      setPaymentFileError('Only JPG or PNG images are allowed.');
      setPaymentFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPaymentFileError('File size must be 5 MB or less.');
      setPaymentFile(null);
      return;
    }

    setPaymentFile(file);
  };

  // Submit Payment Proof to backend -> Updates status to Completed
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentFile) {
      setPaymentFileError('Payment screenshot is required to complete registration.');
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentFileError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(paymentFile);
      reader.onload = async () => {
        try {
          const resultStr = reader.result as string;
          const base64Data = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;

          const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'payment',
              refId: referenceId,
              email: formData.email,
              mime: paymentFile.type,
              fileName: paymentFile.name,
              data: base64Data,
            }),
          });

          const data = await res.json();
          if (!res.ok || data.error || data.status === 'error') {
            throw new Error(data.error || data.message || 'Payment submission failed.');
          }

          setPaymentSuccessMsg('Registration complete! Payment proof received.');
          showToast('Registration complete! Payment proof received.');
        } catch (err: any) {
          setPaymentFileError(err.message || 'Failed to submit payment proof. Please try again.');
        } finally {
          setIsSubmittingPayment(false);
        }
      };
    } catch (err: any) {
      setPaymentFileError(err.message || 'Failed to process screenshot file.');
      setIsSubmittingPayment(false);
    }
  };

  // Lookup submit handler
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
      if (result.found) {
        setLookupResult({
          found: true,
          fullName: result.fullName,
          yearOfStudy: result.yearOfStudy || result.year || 'Student',
          referenceId: result.registrationId || result.reference_id,
          paymentStatus: result.paymentStatus || 'Incomplete',
        });

        if (result.paymentStatus === 'Incomplete') {
          setReferenceId(result.registrationId || result.reference_id || '');
          setFormData((prev) => ({ ...prev, email: lookupEmail.trim(), fullName: result.fullName || prev.fullName }));
        }
      } else {
        setLookupResult({
          found: false,
          message: `No registration found for ${lookupEmail.trim()} yet — register below.`,
        });
      }
    } catch (err: any) {
      setLookupResult({
        found: false,
        message: 'Network error looking up registration. Please try again.',
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div
      className={cn(
        "min-h-svh py-12 sm:py-20 px-4 sm:px-8 relative transition-colors duration-300 font-sans",
        theme === 'dark' ? "bg-[#17130E] text-[#F6F2EA]" : "bg-[#EAE3D2] text-[#1A1814]"
      )}
    >
      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-40">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-full border border-[#2B261F] dark:border-[#4A4338] bg-transparent text-[#1A1814] dark:text-[#F6F2EA] hover:bg-[#DFD6C2] dark:hover:bg-[#25201A] transition-all flex items-center justify-center"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
        </button>
      </div>

      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-20 z-50 bg-[#1A1814] dark:bg-[#FAF5E9] text-[#FAF5E9] dark:text-[#1A1814] border border-[#2B261F] px-5 py-3.5 rounded-[12px] text-xs font-semibold shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm font-sans">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <header className="flex flex-col items-center text-center">
          {/* Eyebrow Badge */}
          <div
            data-testid="event-eyebrow"
            className="inline-flex items-center gap-2 rounded-full border border-[#C9BD9F] dark:border-[#4A4338] bg-[#DFD6C2] dark:bg-[#25201A] px-4 py-1.5 text-[0.8rem] font-bold uppercase tracking-[0.2em] text-[#423C35] dark:text-[#D1C7B2] font-sans"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            OFFICIAL EVENT REGISTRATION
          </div>

          {/* Title */}
          <h1 className="mt-6 font-serif text-[clamp(3.5rem,9vw,6rem)] font-black tracking-[-0.02em] leading-none text-[#1A1814] dark:text-[#F6F2EA]">
            {formattedEventTitle}
          </h1>

          {/* Subtitle row - ONLY "Already registered?" */}
          <div className="mt-4 flex items-center justify-center text-sm font-sans">
            <button
              type="button"
              data-testid="lookup-open-button"
              onClick={() => setStep('lookup')}
              className="inline-flex items-center gap-1.5 font-bold text-[#1A1814] dark:text-[#F6F2EA] border-b-2 border-[#C9BD9F] dark:border-[#4A4338] pb-0.5 transition-colors hover:border-[#1A1814] dark:hover:border-[#F6F2EA]"
            >
              <Search className="size-4" aria-hidden="true" />
              Already registered?
            </button>
          </div>
        </header>

        {/* LOOKUP DIALOG VIEW */}
        {step === 'lookup' && (
          <div className="mt-12 bg-[#F5EFE0] dark:bg-[#1F1A14] border border-[#D5CCB8] dark:border-[#3C362D] rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-[#D1C7B2] dark:border-[#3C362D] pb-5">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-[#1A1814] dark:text-[#F6F2EA]">
                Already Registered?
              </h2>
              <button
                onClick={() => setStep('form')}
                className="p-1.5 rounded-full hover:bg-[#EAE3D2] dark:hover:bg-[#2A241D] transition-colors text-[#5C5346] dark:text-[#D1C7B2]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#5C5346] dark:text-[#A39887] font-sans">
              Enter your registered email address to check your registration & payment status for <strong className="text-[#1A1814] dark:text-[#F6F2EA]">{formattedEventTitle}</strong>.
            </p>

            <form onSubmit={handleLookupSubmit} className="space-y-4 font-sans">
              <FieldRow id="lookup-email" label="Registered Email Address" required>
                <input
                  id="lookup-email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={lookupEmail}
                  onChange={(e) => setLookupEmail(e.target.value)}
                  className={inputCls}
                />
              </FieldRow>

              <button
                type="submit"
                disabled={isLookingUp || !lookupEmail.trim()}
                className="w-full h-14 rounded-[14px] font-bold text-sm uppercase tracking-[0.2em] bg-[#1A1814] dark:bg-[#FAF5E9] text-white dark:text-[#1A1814] hover:bg-[#2F2B24] dark:hover:bg-[#EAE3D2] shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-sans"
              >
                {isLookingUp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> CHECKING…
                  </>
                ) : (
                  <>
                    CHECK STATUS <Search className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {lookupResult && (
              <div className="mt-4 font-sans">
                {lookupResult.found ? (
                  <div className="p-5 rounded-2xl bg-[#E2EBD8] dark:bg-[#1A3320] border border-[#BED2AC] dark:border-[#2D5A38] text-[#144820] dark:text-[#A8E4B7] text-xs space-y-3 animate-in fade-in">
                    <p className="font-bold text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#144820] dark:text-[#A8E4B7]" /> Registered — {lookupResult.fullName} ({lookupResult.yearOfStudy})
                    </p>
                    <p>
                      Reference: <code className="font-mono font-bold bg-[#BED2AC]/40 dark:bg-[#2D5A38]/50 px-2 py-0.5 rounded select-all">{lookupResult.referenceId}</code>
                    </p>
                    <p className="font-semibold">
                      Payment Status:{' '}
                      <span className={cn(
                        "font-bold uppercase px-2 py-0.5 rounded text-[11px]",
                        lookupResult.paymentStatus === 'Completed' || lookupResult.paymentStatus === 'Confirmed'
                          ? "bg-emerald-200 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300"
                          : "bg-red-200 dark:bg-red-950 text-red-900 dark:text-red-300"
                      )}>
                        {lookupResult.paymentStatus}
                      </span>
                    </p>

                    {lookupResult.paymentStatus === 'Incomplete' && (
                      <button
                        onClick={() => setStep('payment')}
                        className="w-full mt-2 py-2.5 bg-[#144820] dark:bg-[#2D5A38] text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2"
                      >
                        COMPLETE PAYMENT UPLOAD →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-[#F5EFE0] dark:bg-[#28221B] border border-[#D5CCB8] dark:border-[#4A4338] text-[#5C5346] dark:text-[#A39887] text-xs animate-in fade-in">
                    <p>{lookupResult.message}</p>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setStep('form')}
              className="w-full py-2 text-xs font-bold text-[#5C5346] dark:text-[#A39887] hover:text-[#1A1814] dark:hover:text-[#F6F2EA] transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wider font-sans"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Return to Form
            </button>
          </div>
        )}

        {/* PAYMENT & COMPULSORY SCREENSHOT STEP (Step 2 after submit) */}
        {step === 'payment' && (
          <div className="mt-12 bg-[#F5EFE0] dark:bg-[#1F1A14] border border-[#D5CCB8] dark:border-[#3C362D] rounded-3xl p-8 sm:p-12 shadow-2xl space-y-8 animate-in fade-in duration-300 font-sans">
            {/* Success Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-[#E2EBD8] dark:bg-[#1A3320] border border-[#BED2AC] dark:border-[#2D5A38] rounded-full flex items-center justify-center mx-auto text-[#144820] dark:text-[#A8E4B7]">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1814] dark:text-[#F6F2EA]">
                Details Saved
              </h2>
              <p className="text-xs text-[#5C5346] dark:text-[#A39887] max-w-md mx-auto">
                Your registration is saved with status <strong className="text-red-600 dark:text-red-400 font-bold">Incomplete</strong> until payment screenshot is uploaded below.
              </p>
            </div>

            {/* Reference ID Box */}
            <div className="p-5 bg-[#EAE3D2] dark:bg-[#221D17] border border-dashed border-[#2B261F] dark:border-[#4A4338] rounded-2xl text-center max-w-md mx-auto space-y-2">
              <span className="text-[11px] uppercase font-bold tracking-[0.16em] text-[#5C5346] dark:text-[#A39887] block">
                YOUR REFERENCE ID
              </span>
              <div className="flex items-center justify-center gap-3">
                <code className="text-2xl font-mono font-black tracking-wider text-[#1A1814] dark:text-[#F6F2EA] select-all">
                  {referenceId}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(referenceId)}
                  className="p-2 bg-[#DFD6C2] dark:bg-[#2F2A23] hover:bg-[#D1C7B2] dark:hover:bg-[#3D372E] rounded-xl transition-all text-[#1A1814] dark:text-[#F6F2EA]"
                  title="Copy Reference ID"
                >
                  {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* SECTION C: Payment & Screenshot */}
            <section aria-labelledby="section-payment" className="pt-4 border-t border-[#D1C7B2] dark:border-[#3C362D]">
              <h2
                id="section-payment"
                className="font-serif text-2xl sm:text-3xl font-bold tracking-[-0.01em] text-[#1A1814] dark:text-[#F6F2EA]"
              >
                C. Payment
              </h2>
              <div aria-hidden="true" className="mt-3 h-px w-full bg-black/15 dark:bg-white/15" />

              <div className="mt-6 space-y-6">
                <p className="text-sm text-[#5C5346] dark:text-[#A39887] leading-relaxed">
                  Scan the QR code below, pay the registration fee, and upload a clear screenshot of the payment receipt. Upload is compulsory to complete your registration.
                </p>

                {/* QR Code Card */}
                <div className="p-6 bg-[#EAE3D2] dark:bg-[#221D17] border border-[#2B261F] dark:border-[#4A4338] rounded-2xl text-center space-y-4 max-w-sm mx-auto">
                  <img
                    src="/qr.jpg"
                    alt="Payment QR Code"
                    className="w-48 h-48 mx-auto rounded-xl border border-[#2B261F] dark:border-[#4A4338] object-cover bg-white p-2"
                  />
                  <div className="space-y-1 text-xs font-semibold text-[#1A1814] dark:text-[#F6F2EA]">
                    <p className="font-mono text-sm tracking-wide">UPI ID: YOUR_UPI_ID_HERE</p>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Amount: Rs. YOUR_AMOUNT_HERE</p>
                  </div>
                </div>

                {/* Compulsory Payment Screenshot Upload Form */}
                {paymentSuccessMsg ? (
                  <div className="p-6 rounded-2xl bg-[#E2EBD8] dark:bg-[#1A3320] border border-[#BED2AC] dark:border-[#2D5A38] text-center space-y-3 animate-in fade-in">
                    <CheckCircle2 className="w-10 h-10 text-[#144820] dark:text-[#A8E4B7] mx-auto" />
                    <p className="font-bold text-base text-[#144820] dark:text-[#A8E4B7]">
                      Registration Complete!
                    </p>
                    <p className="text-xs text-[#144820]/80 dark:text-[#A8E4B7]/80">
                      Your payment proof has been submitted successfully and will be verified by an admin shortly. Thank you for registering!
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handlePaymentSubmit} className="space-y-6">
                    <FieldRow
                      id="payment-screenshot"
                      label="PAYMENT SCREENSHOT"
                      required
                      hint="JPG/PNG, max 5MB (Compulsory)"
                      error={paymentFileError || undefined}
                    >
                      <input
                        id="payment-screenshot"
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        required
                        onChange={handleFileChange}
                        className={cn(
                          inputCls,
                          "file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#1A1814] file:text-white dark:file:bg-[#FAF5E9] dark:file:text-[#1A1814] cursor-pointer py-3"
                        )}
                      />
                    </FieldRow>

                    <button
                      type="submit"
                      disabled={isSubmittingPayment || !paymentFile}
                      className="w-full h-16 rounded-[14px] font-bold text-sm uppercase tracking-[0.2em] bg-[#1A1814] dark:bg-[#FAF5E9] text-white dark:text-[#1A1814] hover:bg-[#2F2B24] dark:hover:bg-[#EAE3D2] shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 font-sans"
                    >
                      {isSubmittingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> UPLOADING PROOF…
                        </>
                      ) : (
                        <>
                          SUBMIT PAYMENT PROOF <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </section>

            {/* Reset option */}
            <div className="pt-4 text-center border-t border-[#D1C7B2] dark:border-[#3C362D]">
              <button
                onClick={() => {
                  setStep('form');
                  setReferenceId('');
                  setPaymentFile(null);
                  setPaymentSuccessMsg(null);
                  setFormData({
                    fullName: '',
                    email: '',
                    phone: '',
                    college: '',
                    department: '',
                    yearOfStudy: '',
                    classGroup: '',
                    isteId: '',
                  });
                  setTouched({});
                }}
                className="text-xs font-bold uppercase tracking-wider text-[#5C5346] dark:text-[#A39887] hover:text-[#1A1814] dark:hover:text-[#F6F2EA] transition-colors"
              >
                ← Register Another Person
              </button>
            </div>
          </div>
        )}

        {/* REGISTRATION FORM VIEW */}
        {step === 'form' && (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-12 space-y-12 sm:mt-16 sm:space-y-14 font-sans"
          >
            {/* SECTION A: Personal & Contact Details */}
            <section aria-labelledby="section-personal">
              <h2
                id="section-personal"
                className="font-serif text-2xl sm:text-3xl font-bold tracking-[-0.01em] text-[#1A1814] dark:text-[#F6F2EA]"
              >
                A. Personal & Contact Details
              </h2>
              <div
                aria-hidden="true"
                className="mt-3 h-px w-full bg-black/15 dark:bg-white/15"
              />

              <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-8">
                {/* Full Name */}
                <FieldRow
                  id="full-name"
                  label="FULL NAME"
                  required
                  error={touched.fullName ? errors.fullName : undefined}
                  className="col-span-full"
                >
                  <input
                    id="full-name"
                    data-testid="input-full-name"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('fullName')}
                    placeholder="e.g. Anandu M"
                    autoComplete="name"
                    aria-invalid={!!(touched.fullName && errors.fullName)}
                    className={cn(
                      inputCls,
                      touched.fullName && errors.fullName && errorCls
                    )}
                  />
                </FieldRow>

                {/* Email Address */}
                <FieldRow
                  id="email"
                  label="EMAIL ADDRESS"
                  required
                  error={(touched.email && errors.email) || apiError || undefined}
                >
                  <input
                    id="email"
                    data-testid="input-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur('email')}
                    placeholder="name@example.com"
                    autoComplete="email"
                    aria-invalid={!!((touched.email && errors.email) || apiError)}
                    className={cn(
                      inputCls,
                      ((touched.email && errors.email) || apiError) && errorCls
                    )}
                  />
                </FieldRow>

                {/* Phone Number */}
                <FieldRow
                  id="phone"
                  label="PHONE NUMBER"
                  required
                  hint="10 digits"
                  error={touched.phone ? errors.phone : undefined}
                >
                  <input
                    id="phone"
                    data-testid="input-phone"
                    type="tel"
                    inputMode="numeric"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={() => handleBlur('phone')}
                    placeholder="98xxxxxxxx (10 digits)"
                    autoComplete="tel"
                    aria-invalid={!!(touched.phone && errors.phone)}
                    className={cn(
                      inputCls,
                      touched.phone && errors.phone && errorCls
                    )}
                  />
                </FieldRow>
              </div>
            </section>

            {/* SECTION B: Academic & Chapter Info (5 Fields) */}
            <section aria-labelledby="section-academic">
              <h2
                id="section-academic"
                className="font-serif text-2xl sm:text-3xl font-bold tracking-[-0.01em] text-[#1A1814] dark:text-[#F6F2EA]"
              >
                B. Academic & Chapter Info
              </h2>
              <div
                aria-hidden="true"
                className="mt-3 h-px w-full bg-black/15 dark:bg-white/15"
              />

              <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-8">
                {/* 1. College */}
                <FieldRow
                  id="college"
                  label="COLLEGE"
                  required
                  error={touched.college ? errors.college : undefined}
                >
                  <input
                    id="college"
                    data-testid="input-college"
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    onBlur={() => handleBlur('college')}
                    placeholder="e.g. MBCET"
                    autoComplete="organization"
                    aria-invalid={!!(touched.college && errors.college)}
                    className={cn(
                      inputCls,
                      touched.college && errors.college && errorCls
                    )}
                  />
                </FieldRow>

                {/* 2. Department Dropdown */}
                <FieldRow
                  id="department"
                  label="DEPARTMENT"
                  required
                  error={touched.department ? errors.department : undefined}
                >
                  <select
                    id="department"
                    data-testid="select-department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    onBlur={() => handleBlur('department')}
                    aria-invalid={!!(touched.department && errors.department)}
                    className={cn(
                      inputCls,
                      'cursor-pointer',
                      !formData.department && 'text-[#9E9385] dark:text-[#7D7365]',
                      touched.department && errors.department && errorCls
                    )}
                  >
                    <option value="" disabled hidden>
                      Select your department
                    </option>
                    <option value="Mechanical Engineering" className="bg-[#EAE3D2] dark:bg-[#221D17]">Mechanical Engineering</option>
                    <option value="Civil Engineering" className="bg-[#EAE3D2] dark:bg-[#221D17]">Civil Engineering</option>
                    <option value="Electrical and Electronics Engineering" className="bg-[#EAE3D2] dark:bg-[#221D17]">Electrical and Electronics Engineering</option>
                    <option value="Electronics and Communication Engineering" className="bg-[#EAE3D2] dark:bg-[#221D17]">Electronics and Communication Engineering</option>
                    <option value="Computer Science Engineering" className="bg-[#EAE3D2] dark:bg-[#221D17]">Computer Science Engineering</option>
                    <option value="Computer Science Engineering (Artificial Intelligence)" className="bg-[#EAE3D2] dark:bg-[#221D17]">Computer Science Engineering (Artificial Intelligence)</option>
                    <option value="Computer Science and Business Systems" className="bg-[#EAE3D2] dark:bg-[#221D17]">Computer Science and Business Systems</option>
                  </select>
                </FieldRow>

                {/* 3. Year of Study Dropdown */}
                <FieldRow
                  id="year-of-study"
                  label="YEAR OF STUDY"
                  required
                  error={touched.yearOfStudy ? errors.yearOfStudy : undefined}
                >
                  <select
                    id="year-of-study"
                    data-testid="select-year-of-study"
                    name="yearOfStudy"
                    value={formData.yearOfStudy}
                    onChange={handleChange}
                    onBlur={() => handleBlur('yearOfStudy')}
                    aria-invalid={!!(touched.yearOfStudy && errors.yearOfStudy)}
                    className={cn(
                      inputCls,
                      'cursor-pointer',
                      !formData.yearOfStudy && 'text-[#9E9385] dark:text-[#7D7365]',
                      touched.yearOfStudy && errors.yearOfStudy && errorCls
                    )}
                  >
                    <option value="" disabled hidden>
                      Select your year of study
                    </option>
                    <option value="1st Year" className="bg-[#EAE3D2] dark:bg-[#221D17]">1st Year</option>
                    <option value="2nd Year" className="bg-[#EAE3D2] dark:bg-[#221D17]">2nd Year</option>
                    <option value="3rd Year" className="bg-[#EAE3D2] dark:bg-[#221D17]">3rd Year</option>
                    <option value="4th Year" className="bg-[#EAE3D2] dark:bg-[#221D17]">4th Year</option>
                    <option value="Postgraduate / Alumni" className="bg-[#EAE3D2] dark:bg-[#221D17]">Postgraduate / Alumni</option>
                  </select>
                </FieldRow>

                {/* 4. Class Dropdown (NEW) */}
                <FieldRow
                  id="class-group"
                  label="CLASS"
                  required
                  error={touched.classGroup ? errors.classGroup : undefined}
                >
                  <select
                    id="class-group"
                    data-testid="select-class-group"
                    name="classGroup"
                    value={formData.classGroup}
                    onChange={handleChange}
                    onBlur={() => handleBlur('classGroup')}
                    aria-invalid={!!(touched.classGroup && errors.classGroup)}
                    className={cn(
                      inputCls,
                      'cursor-pointer',
                      !formData.classGroup && 'text-[#9E9385] dark:text-[#7D7365]',
                      touched.classGroup && errors.classGroup && errorCls
                    )}
                  >
                    <option value="" disabled hidden>
                      Select your class
                    </option>
                    <option value="Class 1" className="bg-[#EAE3D2] dark:bg-[#221D17]">Class 1</option>
                    <option value="Class 2" className="bg-[#EAE3D2] dark:bg-[#221D17]">Class 2</option>
                  </select>
                </FieldRow>

                {/* 5. ISTE Membership ID */}
                <FieldRow
                  id="iste-membership-id"
                  label="ISTE MEMBERSHIP ID"
                  hint="Optional"
                  className="col-span-full"
                >
                  <input
                    id="iste-membership-id"
                    data-testid="input-iste-membership-id"
                    type="text"
                    name="isteId"
                    value={formData.isteId}
                    onChange={handleChange}
                    placeholder="e.g. ISTE-12345"
                    className={inputCls}
                  />
                </FieldRow>
              </div>
            </section>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                data-testid="submit-registration-button"
                disabled={isSubmitting}
                className={cn(
                  'h-16 w-full rounded-[14px] bg-[#1A1814] dark:bg-[#FAF5E9] text-white dark:text-[#1A1814] hover:bg-[#2F2B24] dark:hover:bg-[#EAE3D2] active:scale-[0.99] text-sm font-bold uppercase tracking-[0.2em] transition-all duration-200 sm:h-[72px] sm:text-base flex items-center justify-center gap-2.5 shadow-xl font-sans',
                  isSubmitting && 'opacity-80 cursor-not-allowed'
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    SUBMITTING…
                  </>
                ) : (
                  <>
                    SUBMIT REGISTRATION
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </>
                )}
              </button>
              <p className="mt-5 text-center text-sm text-[#7D7365] dark:text-[#A39887] font-sans">
                A confirmation with your reference ID appears the moment you submit.
              </p>
            </div>
          </form>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-xs tracking-wide text-[#7D7365] dark:text-[#A39887] font-sans">
          Novatos · Hosted by the ISTE Student Chapter
        </footer>
      </main>
    </div>
  );
}
