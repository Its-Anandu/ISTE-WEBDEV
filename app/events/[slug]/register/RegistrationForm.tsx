'use client';

/**
 * GOOGLE SHEETS APPS SCRIPT BACKEND REFERENCE CODE:
 * =================================================
 * 1. Create a Google Sheet named "Novatos Registrations" with headers:
 *    Timestamp | Full Name | Email | Phone | College / Department | Year of Study | ISTE Membership ID | Reference ID
 * 2. In Extensions -> Apps Script, add the following code:
 * 
 * function doPost(e) {
 *   try {
 *     var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
 *     var data = JSON.parse(e.postData.contents);
 *     if (sheet.getLastRow() === 0) {
 *       sheet.appendRow(["Timestamp", "Full Name", "Email", "Phone", "College / Department", "Year of Study", "ISTE Membership ID", "Reference ID"]);
 *     }
 *     var refId = data.reference_id || ("NV-" + Math.random().toString(36).substring(2, 10).toUpperCase());
 *     sheet.appendRow([new Date().toISOString(), data.full_name, data.email, data.phone, data.college_department, data.year_of_study, data.iste_membership_id || "", refId]);
 *     return ContentService.createTextOutput(JSON.stringify({ ok: true, reference_id: refId })).setMimeType(ContentService.MimeType.JSON);
 *   } catch (err) {
 *     return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
 *   }
 * }
 * 
 * function doGet(e) {
 *   try {
 *     var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
 *     var email = (e.parameter.email || "").toLowerCase().trim();
 *     var rows = sheet.getDataRange().getValues();
 *     for (var i = 1; i < rows.length; i++) {
 *       if (String(rows[i][2]).toLowerCase().trim() === email) {
 *         return ContentService.createTextOutput(JSON.stringify({
 *           registered: true,
 *           full_name: rows[i][1],
 *           year_of_study: rows[i][5],
 *           reference_id: rows[i][7]
 *         })).setMimeType(ContentService.MimeType.JSON);
 *       }
 *     }
 *     return ContentService.createTextOutput(JSON.stringify({ registered: false })).setMimeType(ContentService.MimeType.JSON);
 *   } catch (err) {
 *     return ContentService.createTextOutput(JSON.stringify({ registered: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
 *   }
 * }
 */

import React, { useState, useMemo } from 'react';
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
  WifiOff,
  X,
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

// CGP Input & Design Standards
const inputCls =
  "h-[56px] w-full rounded-[12px] border border-[#2B261F] bg-[#EAE3D2] px-5 text-base text-[#1A1814] placeholder:text-[#9E9385] transition-colors duration-200 focus:border-[#1A1814] focus:bg-[#F2ECE0] focus:outline-none focus:ring-2 focus:ring-[#1A1814]/15 sm:h-[64px] sm:text-lg";
const errorCls = "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20";

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
          className="text-xs font-bold uppercase tracking-[0.16em] text-[#3B352D]"
        >
          {label}
          {required && (
            <span className="ml-1 text-[#B91C1C]" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {meta && (
          <span className="text-xs font-medium text-[#7D7365]">
            {meta}
          </span>
        )}
      </div>
      {children}
      {error && (
        <p role="alert" className="mt-2 px-1 text-xs font-semibold text-[#B91C1C]">
          {error}
        </p>
      )}
    </div>
  );
}

export default function RegistrationForm({ slug }: RegistrationFormProps) {
  const [formData, setFormData] = useState<FormState>({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    yearOfStudy: '',
    isteId: '',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Flow & State management ('form' | 'success' | 'lookup')
  const [step, setStep] = useState<'form' | 'success' | 'lookup'>('form');
  const [referenceId, setReferenceId] = useState<string>('');
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Lookup state
  const [lookupEmail, setLookupEmail] = useState<string>('');
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [lookupResult, setLookupResult] = useState<{
    found: boolean;
    referenceId?: string;
    fullName?: string;
    yearOfStudy?: string;
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

  // Client-side validation logic
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
      errs.college = 'Please enter your college and department.';
    }

    if (!formData.yearOfStudy) {
      errs.yearOfStudy = 'Select your year of study.';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      college: true,
      yearOfStudy: true,
    });

    if (!isValid) {
      showToast('Please fix the highlighted fields and submit again.');
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
        showToast('This email is already registered — check with the "Already registered?" button.');
        return;
      }

      if (!response.ok) {
        throw new Error(result.error || 'Submission failed — please try again in a moment.');
      }

      setReferenceId(result.registrationId || result.reference_id || newRefId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setStep('success');
      showToast('Registration confirmed — see you at Novatos.');
    } catch (err: any) {
      showToast(err.message || 'Submission failed — please try again in a moment.');
    } finally {
      setIsSubmitting(false);
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
      if (result.found) {
        setLookupResult({
          found: true,
          fullName: result.fullName,
          yearOfStudy: result.yearOfStudy || result.year || 'Student',
          referenceId: result.registrationId || result.reference_id,
        });
      } else {
        setLookupResult({
          found: false,
          message: `No registration found for ${lookupEmail.trim()} yet — close this and grab the spot.`,
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
    <div className="min-h-svh bg-[#EAE3D2] text-[#1A1814] py-12 sm:py-20 px-4 sm:px-8 relative font-jakarta">
      
      {/* Floating Toast Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#1A1814] text-[#FAF5E9] border border-[#2B261F] px-5 py-3.5 rounded-[12px] text-xs font-semibold shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-[#9E9385] hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Container (Centered, Max Width 672px) */}
      <main className="mx-auto w-full max-w-2xl">

        {/* Header */}
        <header className="flex flex-col items-center text-center">
          <div
            data-testid="event-eyebrow"
            className="inline-flex items-center gap-2 rounded-full border border-[#C9BD9F] bg-[#DFD6C2] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#423C35]"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            OFFICIAL EVENT REGISTRATION
          </div>

          <h1 className="mt-6 font-serif text-7xl sm:text-8xl md:text-9xl font-black tracking-tight text-[#1A1814] leading-none">
            {formattedEventTitle}
          </h1>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-[#5C5346]">
            <span>
              Event slug:{' '}
              <span className="font-mono font-semibold text-[#1A1814]">
                {slug}
              </span>
            </span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              data-testid="lookup-open-button"
              onClick={() => setStep('lookup')}
              className="inline-flex items-center gap-1.5 font-semibold text-[#1A1814] underline decoration-[#C9BD9F] decoration-2 underline-offset-4 transition-colors duration-200 hover:decoration-[#1A1814]"
            >
              <Search className="size-4" aria-hidden="true" />
              Already registered?
            </button>
          </div>
        </header>

        {/* LOOKUP DIALOG VIEW */}
        {step === 'lookup' && (
          <div className="mt-12 bg-[#F5EFE0] border border-[#D5CCB8] rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-[#D1C7B2] pb-5">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-[#1A1814]">
                Already Registered?
              </h2>
              <button
                onClick={() => setStep('form')}
                className="p-1.5 rounded-full hover:bg-[#EAE3D2] transition-colors text-[#5C5346]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#5C5346]">
              Enter your registered email address to verify your registration for <strong className="text-[#1A1814]">{formattedEventTitle}</strong>.
            </p>

            <form onSubmit={handleLookupSubmit} className="space-y-4">
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
                className="w-full h-14 rounded-[12px] font-bold text-sm uppercase tracking-[0.2em] bg-[#1A1814] hover:bg-[#2F2B24] text-white shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
              <div className="mt-4">
                {lookupResult.found ? (
                  <div className="p-5 rounded-2xl bg-[#E2EBD8] border border-[#BED2AC] text-[#144820] text-xs space-y-2 animate-in fade-in">
                    <p className="font-bold text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#144820]" /> Yes — {lookupResult.fullName} is registered ({lookupResult.yearOfStudy})
                    </p>
                    <p>
                      Reference: <code className="font-mono font-bold bg-[#BED2AC]/40 px-2 py-0.5 rounded text-[#144820] select-all">{lookupResult.referenceId}</code>
                    </p>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-[#F5EFE0] border border-[#D5CCB8] text-[#5C5346] text-xs animate-in fade-in">
                    <p>{lookupResult.message}</p>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setStep('form')}
              className="w-full py-2 text-xs font-bold text-[#5C5346] hover:text-[#1A1814] transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wider"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Return to Form
            </button>
          </div>
        )}

        {/* SUCCESS VIEW (Replaces Form Upon Successful Submit) */}
        {step === 'success' && (
          <div className="mt-12 bg-[#F5EFE0] border border-[#D5CCB8] rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-8 animate-in fade-in zoom-in-95 duration-300">
            {/* Centered Green Check */}
            <div className="w-20 h-20 bg-[#E2EBD8] border border-[#BED2AC] rounded-full flex items-center justify-center mx-auto text-[#144820]">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-4xl sm:text-5xl font-black tracking-tight text-[#1A1814]">
                You're in.
              </h2>
              <p className="text-sm text-[#5C5346] max-w-md mx-auto">
                Your Novatos registration is confirmed. Keep the reference ID below — quote it at the venue desk.
              </p>
            </div>

            {/* Reference ID in a Dashed 1px Ink Box */}
            <div className="p-6 bg-[#EAE3D2] border border-dashed border-[#2B261F] rounded-2xl space-y-2 text-center max-w-md mx-auto">
              <span className="text-xs uppercase font-bold tracking-[0.16em] text-[#5C5346] block">
                YOUR REFERENCE ID
              </span>
              <div className="flex items-center justify-center gap-3">
                <code className="text-2xl font-mono font-black tracking-wider text-[#1A1814] select-all">
                  {referenceId}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(referenceId)}
                  className="p-2 bg-[#DFD6C2] hover:bg-[#D1C7B2] rounded-xl transition-all text-[#1A1814]"
                  title="Copy Reference ID"
                >
                  {copiedId ? (
                    <Check className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Summary Card */}
            <div className="p-6 bg-[#EAE3D2]/60 rounded-2xl border border-[#D5CCB8] text-left text-xs space-y-3 max-w-md mx-auto">
              <div className="flex justify-between items-center border-b border-[#D1C7B2] pb-2">
                <span className="text-[#5C5346] font-medium">Full Name:</span>
                <span className="font-bold text-[#1A1814]">{formData.fullName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#D1C7B2] pb-2">
                <span className="text-[#5C5346] font-medium">Email Address:</span>
                <span className="font-bold text-[#1A1814]">{formData.email}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#D1C7B2] pb-2">
                <span className="text-[#5C5346] font-medium">Phone Number:</span>
                <span className="font-bold text-[#1A1814]">{formData.phone}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#D1C7B2] pb-2">
                <span className="text-[#5C5346] font-medium">College / Department:</span>
                <span className="font-bold text-[#1A1814]">{formData.college}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#D1C7B2] pb-2">
                <span className="text-[#5C5346] font-medium">Year of Study:</span>
                <span className="font-bold text-[#1A1814]">{formData.yearOfStudy}</span>
              </div>
              {formData.isteId && (
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-[#5C5346] font-medium">ISTE Membership ID:</span>
                  <span className="font-bold text-[#1A1814]">{formData.isteId}</span>
                </div>
              )}
            </div>

            {/* Reset / Register Another Person */}
            <button
              onClick={() => {
                setStep('form');
                setReferenceId('');
                setFormData({
                  fullName: '',
                  email: '',
                  phone: '',
                  college: '',
                  yearOfStudy: '',
                  isteId: '',
                });
                setTouched({});
              }}
              className="w-full h-14 rounded-[12px] font-bold text-sm uppercase tracking-[0.2em] transition-all bg-[#1A1814] text-white hover:bg-[#2F2B24] active:scale-[0.99] shadow-xl max-w-md mx-auto flex items-center justify-center gap-2"
            >
              REGISTER ANOTHER PERSON
            </button>
          </div>
        )}

        {/* REGISTRATION FORM VIEW */}
        {step === 'form' && (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-12 space-y-12 sm:mt-16 sm:space-y-14"
          >
            {/* SECTION A: Personal & Contact Details */}
            <section aria-labelledby="section-personal">
              <h2
                id="section-personal"
                className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1814]"
              >
                A. Personal & Contact Details
              </h2>
              <div
                aria-hidden="true"
                className="mt-3 h-px w-full bg-[#D1C7B2]"
              />

              <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-8">
                {/* Full Name */}
                <FieldRow
                  id="full-name"
                  label="Full Name"
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
                  label="Email Address"
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
                  label="Phone Number"
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

            {/* SECTION B: Academic & Chapter Info */}
            <section aria-labelledby="section-academic">
              <h2
                id="section-academic"
                className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1814]"
              >
                B. Academic & Chapter Info
              </h2>
              <div
                aria-hidden="true"
                className="mt-3 h-px w-full bg-[#D1C7B2]"
              />

              <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-8">
                {/* College / Department */}
                <FieldRow
                  id="college-department"
                  label="College / Department"
                  required
                  error={touched.college ? errors.college : undefined}
                >
                  <input
                    id="college-department"
                    data-testid="input-college-department"
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    onBlur={() => handleBlur('college')}
                    placeholder="e.g. MBCET - Computer Science"
                    autoComplete="organization"
                    aria-invalid={!!(touched.college && errors.college)}
                    className={cn(
                      inputCls,
                      touched.college && errors.college && errorCls
                    )}
                  />
                </FieldRow>

                {/* Year of Study */}
                <FieldRow
                  id="year-of-study"
                  label="Year of Study"
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
                      !formData.yearOfStudy && 'text-[#9E9385]',
                      touched.yearOfStudy && errors.yearOfStudy && errorCls
                    )}
                  >
                    <option value="" disabled hidden>
                      Select your year of study
                    </option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Postgraduate / Alumni">Postgraduate / Alumni</option>
                  </select>
                </FieldRow>

                {/* ISTE Membership ID */}
                <FieldRow
                  id="iste-membership-id"
                  label="ISTE Membership ID"
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
                  'h-16 w-full rounded-full bg-[#1A1814] text-white hover:bg-[#2F2B24] active:scale-[0.99] text-sm font-bold uppercase tracking-[0.2em] transition-all duration-200 sm:h-[72px] sm:text-base flex items-center justify-center gap-2.5 shadow-xl',
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
              <p className="mt-5 text-center text-sm text-[#7D7365]">
                A confirmation with your reference ID appears the moment you submit.
              </p>
            </div>
          </form>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-xs tracking-wide text-[#7D7365]">
          Novatos · Hosted by the IST Student Chapter
        </footer>
      </main>
    </div>
  );
}
