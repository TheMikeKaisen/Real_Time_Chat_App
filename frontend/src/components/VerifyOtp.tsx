"use client";
import axios from 'axios';
import { ArrowRight, ChevronLeft, Loader2, Lock } from 'lucide-react';
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react'
import Cookies from "js-cookie";
import { useAppData, user_service } from '@/context/AppContext';
import Loading from './Loading';

const VerifyOtp = () => {
    
    // importing from context 
    const {isAuth, setIsAuth, setUser, loading: userLoading} = useAppData();

    const [loading, setLoading] = useState<boolean>(false)

    // to take 6 digit otp in 6 boxes
    const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""])
    const [error, setError] = useState<string>("")
    const [resendLoading, setResendLoading] = useState<boolean>(false)
    const [timer, setTimer] = useState(60)

    // to refer to each box of otp
    const inputRefs = useRef<Array<HTMLInputElement | null>>([])
    const router = useRouter();


    const searchParams = useSearchParams()
    const email = searchParams.get("email") || "";

    // so that you can resend the otp only after 60 seconds
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000)
            return () => clearInterval(interval);
        }
    }, [timer])

    // to track changes in otp input boxes
    const handleInputChange = (index: number, value: string): void => {
        if (value.length > 1) return;
        const newOtp = [...otp]
        newOtp[index] = value;
        setOtp(newOtp);
        setError("");
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLElement>): void => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    // without this, pasting the otp will not work
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text");
        const digits = pastedData.replace(/\D/g, "").slice(0, 6);
        if (digits.length === 6) {
            const newOtp = digits.split("");
            setOtp(newOtp);
            inputRefs.current[5]?.focus();
        }
    }

    // to send mail by hitting user service api
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const otpString = otp.join("");
        if(otpString.length !== 6){
            setError("Please Enter all 6 digits");
            return;
        }

        setError("");
        setLoading(true);
        try {
            const {data} = await axios.post(`${user_service}/api/v1/verify`, {
                email,
                otp:otpString
            })
            alert(data.message);
            Cookies.set("token", data.token, {
                expires: 15,
                secure: false, // aws hosting will provide http NOT https
                path: "/"
            })
            setOtp(["", "", "","", "", ""]);
            inputRefs.current[0]?.focus();
            setUser(data.user);
            setIsAuth(true);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            setError(err.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    // after 60 seconds, you will be able to resend the otp to the mail
    const handleResendOtp = async() => {
        setResendLoading(true);
        setError("");
        try {
            const {data} = await axios.post(`${user_service}/api/v1/login`, {
                email,
            })
            alert(data.message);
            setTimer(60);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            setError(err.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    }
    if(userLoading) return <Loading />;
    if(isAuth) redirect("/chat");
    return (
        <div className='min-h-screen bg-gray-900 flex items-center justify-center p-4'>
            <div className='max-w-md w-full'>
                <div className='bg-gray-800 border border-gray-700 rounded-lg p-8'>
                    <div className="text-center mb-8 relative">
                        <button className="absolute top-0 left-0 p-2 text-gray-300 hover:text-white"
                            onClick={() => router.push("/login")}>
                            <ChevronLeft className='w-6 h-6'
                            
                            />
                        </button>
                        <div className="mx-auto w-20 h-20 bg-blue-600 rounded-lg flex items-center
                                    justify-center mb-6">
                            <Lock size={40} className='text-white' />
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-3">
                            Verify you email
                        </h1>
                        <p className="text-gray-300 text-lg ">We have sent a 6 digit code to </p>
                        <p className="text-blue-600 font-medium">{email}</p>
                    </div>

                    <form className="space-y-6 " onSubmit={handleSubmit}>
                        <div>
                            <label className='block text-sm font-medium text-gray-300 mb-4 text-center'>Enter your 6 digit otp</label>
                            <div className="flex justify-center in-checked: space-x-3">
                                {
                                    otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el: HTMLInputElement | null) => {
                                                inputRefs.current[index] = el;
                                            }}
                                            type="text"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleInputChange(index, e.target.value)}
                                            onKeyDown={e => handleKeyDown(index, e)}
                                            onPaste={index === 0 ? handlePaste : undefined}
                                            className='w-12 h-12 text-center text-xl font-bold border-2 border-gray-600 rounded-lg bg-gray-700 text-white'
                                        />
                                    ))
                                }
                            </div>

                        </div>

                        {
                            error && <div className="bg-red-900 border border-red-700 rounded-lg p-3">
                                <p className="text-red-300 text-sm text-center">{error}</p>
                            </div>
                        }
                        <button type='submit' className='w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                            disabled={loading}
                        >
                            {
                                loading ?
                                    <div className='flex items-center justify-center gap-2'>
                                        <Loader2 className='w-5 h-5' />
                                        Verifying...
                                    </div>
                                    :
                                    <div className='flex items-center justify-center gap-2'>
                                        <span>Verify</span>
                                        <ArrowRight className='w-5 h-5' />
                                    </div>
                            }

                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className='text-gray-400 text-sm mb-4'>Did not receive the code?</p>
                    
                    {
                        timer > 0 ? 
                        <p className="text-gray-400 text-sm">Resend code in {timer} seconds</p>
                        :
                        <button
                            disabled={resendLoading}
                            onClick={handleResendOtp}
                            className="text-blue-400 hover:text-blue-300 font-medium text-sm disabled:opacity-50">
                            {resendLoading ? "Sending..." : "Resend Code"}
                        </button>
                    }
                    </div>

            </div>

        </div>
        </div >
    )
}

export default VerifyOtp