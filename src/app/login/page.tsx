'use client';

import { useState, useEffect, useRef } from 'react';
import { useRequestOtp, useVerifyOtp } from '@/hooks/useAuth';
import styles from './login.module.css';

type Step = 'email' | 'otp';

const RESEND_COOLDOWN = 60;

export default function LoginPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  function handleEmailSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    requestOtp.mutate(email, {
      onSuccess: () => {
        setStep('otp');
        startCooldown();
      },
    });
  }

  function handleOtpSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    verifyOtp.mutate({ email, otp });
  }

  function handleResend() {
    if (cooldown > 0) return;
    requestOtp.mutate(email, {
      onSuccess: () => startCooldown(),
    });
  }

  function handleChangeEmail() {
    setStep('email');
    setOtp('');
    requestOtp.reset();
    verifyOtp.reset();
  }

  const is429 = (verifyOtp.error as { response?: { status?: number } } | null)
    ?.response?.status === 429;

  if (step === 'otp') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.brand}>
            <span className={styles.brandMark}>SJ</span>
            <span className={styles.brandName}>SocialJet Client Portal</span>
          </div>

          <div className={styles.otpIconWrap}>
            <span className={styles.otpIcon}>✉</span>
          </div>

          <h1 className={styles.title}>Check your inbox</h1>
          <p className={styles.subtitle}>
            We sent a 6-digit code to <strong>{email}</strong>
          </p>

          <form onSubmit={handleOtpSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="otp" className={styles.label}>
                Enter 6-digit code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                required
                className={styles.otpInput}
                autoComplete="one-time-code"
                autoFocus
              />
            </div>

            {verifyOtp.isError && (
              <p className={styles.errorMsg}>
                {is429
                  ? 'Too many attempts. Please wait a few minutes.'
                  : 'Invalid or expired code. Please try again.'}
              </p>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={verifyOtp.isPending || otp.length !== 6}
            >
              {verifyOtp.isPending ? 'Verifying…' : 'Verify code'}
            </button>
          </form>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.resendBtn}
              onClick={handleResend}
              disabled={cooldown > 0 || requestOtp.isPending}
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </button>
            <span className={styles.dot}>·</span>
            <button type="button" className={styles.changeEmailBtn} onClick={handleChangeEmail}>
              Change email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>SJ</span>
          <span className={styles.brandName}>SocialJet Client Portal</span>
        </div>

        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.subtitle}>
          Enter your email and we'll send you a login code.
        </p>

        <form onSubmit={handleEmailSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@brand.com"
              required
              className={styles.input}
              autoComplete="email"
            />
          </div>

          {requestOtp.isError && (
            <p className={styles.errorMsg}>
              Something went wrong. Please try again.
            </p>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={requestOtp.isPending || !email}
          >
            {requestOtp.isPending ? 'Sending…' : 'Send code'}
          </button>
        </form>
      </div>
    </div>
  );
}
