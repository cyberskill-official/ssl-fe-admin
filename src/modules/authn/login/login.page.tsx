import { useMutation } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import gsap from 'gsap';
import { ArrowLeft, Mail } from 'lucide-react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import type { sendOTPEmailForAdminMutation, sendOTPEmailForAdminMutationVariables } from '#shared/graphql';

import { Button, Checkbox, Input } from '#shared/component';
import { ROUTES } from '#shared/constant';
import { E_LoginType, sendOTPEmailForAdminDocument } from '#shared/graphql';

import { useAuth } from '../auth.hook';

const OTP_SANITIZE_RE = /[^a-z0-9]/gi;

function isValidEmail(email: string) {
    const atIndex = email.indexOf('@');
    const dotIndex = email.lastIndexOf('.');
    return atIndex > 0 && dotIndex > atIndex + 1 && dotIndex < email.length - 1 && !email.includes(' ');
}

enum LoginStep {
    EMAIL = 'email',
    PASSWORD = 'password',
}

function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState<LoginStep>(LoginStep.EMAIL);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoadingOTP, setIsLoadingOTP] = useState(false);
    const [otpCooldown, setOtpCooldown] = useState(0);
    const box1Ref = useRef<HTMLDivElement>(null);
    const box2Ref = useRef<HTMLDivElement>(null);
    const box3Ref = useRef<HTMLDivElement>(null);

    const [sendOTPEmail] = useMutation<sendOTPEmailForAdminMutation, sendOTPEmailForAdminMutationVariables>(
        sendOTPEmailForAdminDocument,
    );

    useEffect(() => {
        const elements = [box1Ref.current, box2Ref.current, box3Ref.current].filter(el => el !== null);
        gsap.to(elements, {
            y: 70,
            duration: 4,
            repeat: -1,
            yoyo: true,
        });
    }, []);

    useEffect(() => {
        if (otpCooldown <= 0)
            return;
        const timer = setTimeout(() => setOtpCooldown(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [otpCooldown]);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otpCooldown > 0)
            return;
        if (!email || !isValidEmail(email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        setIsLoadingOTP(true);
        try {
            const result = await sendOTPEmail({
                variables: { email },
            });

            if (result.data?.sendOTPEmailForAdmin.success) {
                toast.success('OTP has been sent to your email');
                setStep(LoginStep.PASSWORD);
                setOtpCooldown(60);
            }
            else {
                toast.error(result.data?.sendOTPEmailForAdmin.message || 'Failed to send OTP');
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
            toast.error(errorMessage);
        }
        finally {
            setIsLoadingOTP(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (step === LoginStep.EMAIL) {
            handleSendOTP(e);
            return;
        }

        if (!password) {
            toast.error('Please enter your password');
            return;
        }

        if (!otp || otp.length !== 6) {
            toast.error('Please enter a valid 6-character OTP');
            return;
        }

        login({
            identity: email,
            password,
            loginType: E_LoginType.ADMIN,
            rememberMe,
            tempOtp: otp.toUpperCase(),
        }, () => {
            navigate(ROUTES.ADMIN.BASE);
        });
    };

    const handleBack = () => {
        setStep(LoginStep.EMAIL);
        setPassword('');
        setOtp('');
    };

    return (
        <div className="w-full h-screen flex justify-center items-center overflow-hidden relative login-wow-bg">
            {/* Floating Orbs */}
            <div className="login-wow-orb" style={{ width: '180px', height: '180px', left: '8%', top: '10%', background: 'radial-gradient(circle, #bf4ad4 60%, transparent 100%)', animationDelay: '0s' }} />
            <div className="login-wow-orb" style={{ width: '120px', height: '120px', right: '12%', top: '20%', background: 'radial-gradient(circle, #2b67f3 60%, transparent 100%)', animationDelay: '2s' }} />
            <div className="login-wow-orb" style={{ width: '140px', height: '140px', left: '20%', bottom: '12%', background: 'radial-gradient(circle, #ffa500 60%, transparent 100%)', animationDelay: '1s' }} />

            {/* Existing blurred backgrounds and animated boxes remain */}
            <div
                className="absolute top-8 w-[30rem] h-60 blur-[150px]"
                style={{ background: '#bf4ad4' }}
            />
            <div
                className="absolute left-48 bottom-8 w-[30rem] h-80 blur-[150px]"
                style={{ background: '#ffa500' }}
            />
            <div
                className="absolute right-40 bottom-8 w-[30rem] h-80 blur-[150px]"
                style={{ background: '#2b67f3' }}
            />

            <div
                ref={box1Ref}
                className="w-28 h-28 absolute left-1/4 bottom-[30%] z-[2] rounded-lg border border-white/50 shadow-[0_25px_45px_rgba(0,0,0,0.1)]"
                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            />
            <div
                ref={box2Ref}
                className="w-28 h-28 absolute left-[35%] top-[15%] z-[2] rounded-lg border border-white/50 shadow-[0_25px_45px_rgba(0,0,0,0.1)]"
                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            />
            <div
                ref={box3Ref}
                className="w-28 h-28 absolute right-[35%] bottom-[15%] z-[3] rounded-lg border border-white/50 shadow-[0_25px_45px_rgba(0,0,0,0.1)]"
                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            />

            <div
                className="w-[25rem] h-[25rem] rounded-lg border border-white/50 p-8 pt-4 flex flex-col items-start relative z-[2] shadow-[0_25px_45px_rgba(0,0,0,0.1)] login-wow-card login-wow-fadein"
                style={{
                    backdropFilter: 'blur(5px)',
                    background: 'rgb(0 0 0 / 22%)',
                }}
            >
                <div className="flex justify-between items-center w-full">
                    <h1 className="text-2xl font-semibold text-white px-4 py-2 flex items-center gap-2">
                        {step === LoginStep.PASSWORD && (
                            <button
                                onClick={handleBack}
                                className="hover:bg-white/10 rounded-full p-1 transition-all"
                                type="button"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        Login Admin
                    </h1>
                    <img src="/icons/Logo_secretswingerlust_white.png" alt="" className="w-[5rem] animate-fade-in-up" />
                </div>

                <form onSubmit={handleSubmit} className="p-4 pt-8 w-full h-full flex items-center flex-col gap-4">
                    {step === LoginStep.EMAIL
                        ? (
                                <>
                                    <div className="w-full mb-2">
                                        <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
                                            <Mail size={16} />
                                            <span>Enter your email to receive OTP</span>
                                        </div>
                                    </div>
                                    <Input
                                        type="email"
                                        placeholder="Email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        autoComplete="off"
                                        className="w-full px-4 py-3 text-base text-white rounded-full outline-none border border-white/50 shadow-[0_5px_15px_rgba(0,0,0,0.1)] placeholder-white/70 login-wow-input-focus"
                                        style={{ background: 'rgb(0 0 0 / 24%)' }}
                                        disabled={isLoadingOTP}
                                    />

                                    <Button
                                        type="submit"
                                        variant="ghost"
                                        disabled={isLoadingOTP || otpCooldown > 0}
                                        className="w-full text-lg font-semibold text-gray-700 rounded-2xl bg-white border-none transition-transform duration-500 hover:scale-105 login-wow-btn-glow disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {otpCooldown > 0 ? `Resend OTP (${otpCooldown}s)` : isLoadingOTP ? 'Sending OTP...' : 'Send OTP'}
                                    </Button>
                                </>
                            )
                        : (
                                <>
                                    <div className="w-full mb-2">
                                        <div className="text-white/80 text-sm mb-2">
                                            <span className="font-medium">Email:</span>
                                            {' '}
                                            {email}
                                        </div>
                                        <div className="text-white/60 text-xs">
                                            Check your email for the 6-character OTP code
                                        </div>
                                    </div>

                                    <Input
                                        type="text"
                                        placeholder="OTP Code (6 characters)"
                                        value={otp}
                                        onChange={e => setOtp(e.target.value.replace(OTP_SANITIZE_RE, '').slice(0, 6).toUpperCase())}
                                        required
                                        autoComplete="off"
                                        maxLength={6}
                                        className="w-full px-4 py-3 text-base text-white rounded-full outline-none border border-white/50 shadow-[0_5px_15px_rgba(0,0,0,0.1)] placeholder-white/70 login-wow-input-focus text-center tracking-widest"
                                        style={{ background: 'rgb(0 0 0 / 24%)' }}
                                    />

                                    <Input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        autoComplete="off"
                                        className="w-full px-4 py-3 text-base text-white rounded-full outline-none border border-white/50 shadow-[0_5px_15px_rgba(0,0,0,0.1)] placeholder-white/70 login-wow-input-focus"
                                        style={{ background: 'rgb(0 0 0 / 24%)' }}
                                    />

                                    <div className="flex items-center w-full">
                                        <Checkbox
                                            id="rememberMe"
                                            checked={rememberMe}
                                            onCheckedChange={checked => setRememberMe(checked as boolean)}
                                            className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-gray-700"
                                        />
                                        <label
                                            htmlFor="rememberMe"
                                            className="ml-2 text-sm text-white cursor-pointer"
                                        >
                                            Remember me
                                        </label>
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="ghost"
                                        className="w-full text-lg font-semibold text-gray-700 rounded-2xl bg-white border-none transition-transform duration-500 hover:scale-105 login-wow-btn-glow"
                                    >
                                        Login
                                    </Button>

                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        className="w-full cursor-pointer mt-2 text-center text-white/70 text-sm hover:text-white transition-colors"
                                    >
                                        Back to email
                                    </button>
                                </>
                            )}
                </form>
            </div>
        </div>
    );
}

export default LoginPage;
