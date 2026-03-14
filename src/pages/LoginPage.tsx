import React, { useState, useEffect, useRef, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { API_URL } from "../config/api";
import { useMousePosition } from "../hooks/useMousePosition";

interface PupilProps {
    size?: number;
    maxDistance?: number;
    pupilColor?: string;
    forceLookX?: number;
    forceLookY?: number;
}

/** Ponto (pupila) que segue o cursor do mouse dentro de um olho. */
const Pupil = ({
    size = 12,
    maxDistance = 5,
    pupilColor = "black",
    forceLookX,
    forceLookY
}: PupilProps) => {
    const mouse = useMousePosition();
    const pupilRef = useRef<HTMLDivElement>(null);

    /**
     * Calcula o deslocamento da pupila em relação ao centro do olho,
     * limitado por `maxDistance`. Se `forceLook` estiver definido, usa esse valor.
     */
    const calculatePupilPosition = () => {
        if (!pupilRef.current) return { x: 0, y: 0 };
        if (forceLookX !== undefined && forceLookY !== undefined) {
            return { x: forceLookX, y: forceLookY };
        }
        const pupil = pupilRef.current.getBoundingClientRect();
        const pupilCenterX = pupil.left + pupil.width / 2;
        const pupilCenterY = pupil.top + pupil.height / 2;
        const deltaX = mouse.x - pupilCenterX;
        const deltaY = mouse.y - pupilCenterY;
        const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
        const angle = Math.atan2(deltaY, deltaX);
        return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
    };

    const pupilPosition = calculatePupilPosition();

    return (
        <div
            ref={pupilRef}
            className="rounded-full"
            style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: pupilColor,
                transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
                transition: 'transform 0.1s ease-out',
            }}
        />
    );
};

interface EyeBallProps {
    size?: number;
    pupilSize?: number;
    maxDistance?: number;
    eyeColor?: string;
    pupilColor?: string;
    isBlinking?: boolean;
    forceLookX?: number;
    forceLookY?: number;
}

/** Globo ocular completo com pupila que acompanha o cursor e suporte a piscada. */
const EyeBall = ({
    size = 48,
    pupilSize = 16,
    maxDistance = 10,
    eyeColor = "white",
    pupilColor = "black",
    isBlinking = false,
    forceLookX,
    forceLookY
}: EyeBallProps) => {
    const mouse = useMousePosition();
    const eyeRef = useRef<HTMLDivElement>(null);

    /**
     * Calcula o deslocamento da pupila em relação ao centro do olho,
     * limitado por `maxDistance`. Se `forceLook` estiver definido, usa esse valor.
     */
    const calculatePupilPosition = () => {
        if (!eyeRef.current) return { x: 0, y: 0 };
        if (forceLookX !== undefined && forceLookY !== undefined) {
            return { x: forceLookX, y: forceLookY };
        }
        const eye = eyeRef.current.getBoundingClientRect();
        const eyeCenterX = eye.left + eye.width / 2;
        const eyeCenterY = eye.top + eye.height / 2;
        const deltaX = mouse.x - eyeCenterX;
        const deltaY = mouse.y - eyeCenterY;
        const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
        const angle = Math.atan2(deltaY, deltaX);
        return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
    };

    const pupilPosition = calculatePupilPosition();

    return (
        <div
            ref={eyeRef}
            className="rounded-full flex items-center justify-center transition-all duration-150"
            style={{
                width: `${size}px`,
                height: isBlinking ? '2px' : `${size}px`,
                backgroundColor: eyeColor,
                overflow: 'hidden',
            }}
        >
            {!isBlinking && (
                <div
                    className="rounded-full"
                    style={{
                        width: `${pupilSize}px`,
                        height: `${pupilSize}px`,
                        backgroundColor: pupilColor,
                        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
                        transition: 'transform 0.1s ease-out',
                    }}
                />
            )}
        </div>
    );
};

export const LoginPage = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const [mouseX, setMouseX] = useState<number>(0);
    const [mouseY, setMouseY] = useState<number>(0);
    const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
    const [isBlackBlinking, setIsBlackBlinking] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
    const [isPurplePeeking, setIsPurplePeeking] = useState(false);

    const purpleRef = useRef<HTMLDivElement>(null);
    const blackRef = useRef<HTMLDivElement>(null);
    const yellowRef = useRef<HTMLDivElement>(null);
    const orangeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMouseX(e.clientX);
            setMouseY(e.clientY);
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    useEffect(() => {
        const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;
        const scheduleBlink = () => {
            const blinkTimeout = setTimeout(() => {
                setIsPurpleBlinking(true);
                setTimeout(() => {
                    setIsPurpleBlinking(false);
                    scheduleBlink();
                }, 150);
            }, getRandomBlinkInterval());
            return blinkTimeout;
        };
        const timeout = scheduleBlink();
        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;
        const scheduleBlink = () => {
            const blinkTimeout = setTimeout(() => {
                setIsBlackBlinking(true);
                setTimeout(() => {
                    setIsBlackBlinking(false);
                    scheduleBlink();
                }, 150);
            }, getRandomBlinkInterval());
            return blinkTimeout;
        };
        const timeout = scheduleBlink();
        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        if (isTyping) {
            setIsLookingAtEachOther(true);
            const timer = setTimeout(() => {
                setIsLookingAtEachOther(false);
            }, 800);
            return () => clearTimeout(timer);
        } else {
            setIsLookingAtEachOther(false);
        }
    }, [isTyping]);

    useEffect(() => {
        if (password.length > 0 && showPassword) {
            const schedulePeek = () => {
                const peekInterval = setTimeout(() => {
                    setIsPurplePeeking(true);
                    setTimeout(() => {
                        setIsPurplePeeking(false);
                    }, 800);
                }, Math.random() * 3000 + 2000);
                return peekInterval;
            };
            const firstPeek = schedulePeek();
            return () => clearTimeout(firstPeek);
        } else {
            setIsPurplePeeking(false);
        }
    }, [password, showPassword, isPurplePeeking]);

    const calculatePosition = (ref: React.RefObject<HTMLDivElement | null>) => {
        if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 3;
        const deltaX = mouseX - centerX;
        const deltaY = mouseY - centerY;
        const faceX = Math.max(-15, Math.min(15, deltaX / 20));
        const faceY = Math.max(-10, Math.min(10, deltaY / 30));
        const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));
        return { faceX, faceY, bodySkew };
    };

    const purplePos = calculatePosition(purpleRef);
    const blackPos = calculatePosition(blackRef);
    const yellowPos = calculatePosition(yellowRef);
    const orangePos = calculatePosition(orangeRef);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMsg(data.error || 'Erro ao fazer login.');
                return;
            }

            localStorage.setItem('reyb_token', data.token);
            localStorage.setItem('reyb_user', JSON.stringify(data.user));

            navigate('/dashboard');
        } catch {
            setErrorMsg('Não foi possível conectar ao servidor. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // Cores da paleta do projeto
    const projectColors = {
        purple: '#d946ef',
        cyan: '#22d3ee',
        blue: '#3b82f6',
        dark: '#0f172a'
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-[#020617] text-slate-100">
            {/* Left Content Section - Ajustado para centralizar e adaptar escala sem textos extras */}
            <div className="relative hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-cyan-950 via-[#0f172a] to-purple-950/80 p-8 pt-24 text-white overflow-hidden">
                <div className="relative z-20 flex items-center justify-center w-full">
                    {/* Cartoon Characters - Aplicado 'scale' para redimensionamento responsivo sem quebrar o viewBox dos bonecos absolutos */}
                    <div className="relative origin-bottom transform scale-[0.65] xl:scale-[0.85] 2xl:scale-100" style={{ width: '550px', height: '400px' }}>
                        {/* Purple tall rectangle character (Cor do projeto: purple) - Back layer */}
                        <div
                            ref={purpleRef}
                            className="absolute bottom-0 transition-all duration-700 ease-in-out"
                            style={{
                                left: '70px',
                                width: '180px',
                                height: (isTyping || (password.length > 0 && !showPassword)) ? '440px' : '400px',
                                backgroundColor: projectColors.purple,
                                borderRadius: '10px 10px 0 0',
                                zIndex: 1,
                                transform: (password.length > 0 && showPassword)
                                    ? `skewX(0deg)`
                                    : (isTyping || (password.length > 0 && !showPassword))
                                        ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)`
                                        : `skewX(${purplePos.bodySkew || 0}deg)`,
                                transformOrigin: 'bottom center',
                            }}
                        >
                            {/* Eyes */}
                            <div
                                className="absolute flex gap-8 transition-all duration-700 ease-in-out"
                                style={{
                                    left: (password.length > 0 && showPassword) ? `${20}px` : isLookingAtEachOther ? `${55}px` : `${45 + purplePos.faceX}px`,
                                    top: (password.length > 0 && showPassword) ? `${35}px` : isLookingAtEachOther ? `${65}px` : `${40 + purplePos.faceY}px`,
                                }}
                            >
                                <EyeBall
                                    size={18}
                                    pupilSize={7}
                                    maxDistance={5}
                                    eyeColor="#0f172a"
                                    pupilColor="white"
                                    isBlinking={isPurpleBlinking}
                                    forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                                    forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                                />
                                <EyeBall
                                    size={18}
                                    pupilSize={7}
                                    maxDistance={5}
                                    eyeColor="#0f172a"
                                    pupilColor="white"
                                    isBlinking={isPurpleBlinking}
                                    forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                                    forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                                />
                            </div>
                        </div>

                        {/* Black tall rectangle character (Cor do projeto: dark) - Middle layer */}
                        <div
                            ref={blackRef}
                            className="absolute bottom-0 transition-all duration-700 ease-in-out shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                            style={{
                                left: '240px',
                                width: '120px',
                                height: '310px',
                                backgroundColor: projectColors.dark,
                                borderRadius: '8px 8px 0 0',
                                zIndex: 2,
                                transform: (password.length > 0 && showPassword)
                                    ? `skewX(0deg)`
                                    : isLookingAtEachOther
                                        ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                                        : (isTyping || (password.length > 0 && !showPassword))
                                            ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)`
                                            : `skewX(${blackPos.bodySkew || 0}deg)`,
                                transformOrigin: 'bottom center',
                            }}
                        >
                            {/* Eyes */}
                            <div
                                className="absolute flex gap-6 transition-all duration-700 ease-in-out"
                                style={{
                                    left: (password.length > 0 && showPassword) ? `${10}px` : isLookingAtEachOther ? `${32}px` : `${26 + blackPos.faceX}px`,
                                    top: (password.length > 0 && showPassword) ? `${28}px` : isLookingAtEachOther ? `${12}px` : `${32 + blackPos.faceY}px`,
                                }}
                            >
                                <EyeBall
                                    size={16}
                                    pupilSize={6}
                                    maxDistance={4}
                                    eyeColor="white"
                                    pupilColor="#0f172a"
                                    isBlinking={isBlackBlinking}
                                    forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined}
                                    forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined}
                                />
                                <EyeBall
                                    size={16}
                                    pupilSize={6}
                                    maxDistance={4}
                                    eyeColor="white"
                                    pupilColor="#0f172a"
                                    isBlinking={isBlackBlinking}
                                    forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined}
                                    forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined}
                                />
                            </div>
                        </div>

                        {/* Orange (Now Cyan) semi-circle character - Front left */}
                        <div
                            ref={orangeRef}
                            className="absolute bottom-0 transition-all duration-700 ease-in-out"
                            style={{
                                left: '0px',
                                width: '240px',
                                height: '200px',
                                zIndex: 3,
                                backgroundColor: projectColors.cyan,
                                borderRadius: '120px 120px 0 0',
                                transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${orangePos.bodySkew || 0}deg)`,
                                transformOrigin: 'bottom center',
                            }}
                        >
                            {/* Eyes - just pupils, no white */}
                            <div
                                className="absolute flex gap-8 transition-all duration-200 ease-out"
                                style={{
                                    left: (password.length > 0 && showPassword) ? `${50}px` : `${82 + (orangePos.faceX || 0)}px`,
                                    top: (password.length > 0 && showPassword) ? `${85}px` : `${90 + (orangePos.faceY || 0)}px`,
                                }}
                            >
                                <Pupil size={12} maxDistance={5} pupilColor="#0f172a" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                                <Pupil size={12} maxDistance={5} pupilColor="#0f172a" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                            </div>
                        </div>

                        {/* Yellow (Now Blue) tall rectangle character - Front right */}
                        <div
                            ref={yellowRef}
                            className="absolute bottom-0 transition-all duration-700 ease-in-out"
                            style={{
                                left: '310px',
                                width: '140px',
                                height: '230px',
                                backgroundColor: projectColors.blue,
                                borderRadius: '70px 70px 0 0',
                                zIndex: 4,
                                transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${yellowPos.bodySkew || 0}deg)`,
                                transformOrigin: 'bottom center',
                            }}
                        >
                            {/* Eyes - just pupils, no white */}
                            <div
                                className="absolute flex gap-6 transition-all duration-200 ease-out"
                                style={{
                                    left: (password.length > 0 && showPassword) ? `${20}px` : `${52 + (yellowPos.faceX || 0)}px`,
                                    top: (password.length > 0 && showPassword) ? `${35}px` : `${40 + (yellowPos.faceY || 0)}px`,
                                }}
                            >
                                <Pupil size={12} maxDistance={5} pupilColor="#0f172a" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                                <Pupil size={12} maxDistance={5} pupilColor="#0f172a" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                            </div>
                            {/* Horizontal line for mouth */}
                            <div
                                className="absolute w-20 h-[4px] bg-[#0f172a] rounded-full transition-all duration-200 ease-out"
                                style={{
                                    left: (password.length > 0 && showPassword) ? `${10}px` : `${40 + (yellowPos.faceX || 0)}px`,
                                    top: (password.length > 0 && showPassword) ? `${88}px` : `${88 + (yellowPos.faceY || 0)}px`,
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute inset-0 bg-white/[0.02] bg-[size:30px_30px]" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)' }} />
                <div className="absolute top-1/4 right-1/4 size-64 bg-cyan-500/10 rounded-full blur-[80px]" />
                <div className="absolute bottom-1/4 left-1/4 size-96 bg-purple-500/5 rounded-full blur-[100px]" />
            </div>

            {/* Right Login Section */}
            <div className="flex items-center justify-center px-4 py-10 lg:p-8 pt-[120px] lg:pt-24 bg-[#020617] relative overflow-hidden">
                {/* Decorative ambient light for the right side */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-600/5 rounded-full pointer-events-none" style={{ filter: 'blur(80px)' }} />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full pointer-events-none" style={{ filter: 'blur(80px)' }} />

                <div className="w-full max-w-[420px] relative z-10 glow-card p-6 sm:p-10 rounded-3xl sm:rounded-[2rem] border-white/5 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-black tracking-tight mb-2 text-white">Bem-vindo de volta!</h1>
                        <p className="text-slate-400 text-sm">Insira seus dados para acessar</p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="identifier" className="text-sm font-medium text-slate-300">WhatsApp ou E-mail</Label>
                            <Input
                                id="identifier"
                                type="text"
                                placeholder="Seu WhatsApp ou e-mail"
                                value={identifier}
                                autoComplete="off"
                                onChange={(e) => setIdentifier(e.target.value)}
                                onFocus={() => setIsTyping(true)}
                                onBlur={() => setIsTyping(false)}
                                required
                                className="h-12 bg-white/5 border-white/10 focus:border-cyan-500 text-white placeholder:text-slate-500 transition-all rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium text-slate-300">Senha</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-12 pr-10 bg-white/5 border-white/10 focus:border-cyan-500 text-white placeholder:text-slate-500 transition-all rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="size-5" />
                                    ) : (
                                        <Eye className="size-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="remember" className="border-slate-600 bg-white/5 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500" />
                                <Label
                                    htmlFor="remember"
                                    className="text-sm font-normal cursor-pointer text-slate-400 hover:text-slate-300 transition-colors"
                                >
                                    Lembrar de mim
                                </Label>
                            </div>
                            <a
                                href="#"
                                className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline font-medium transition-colors"
                            >
                                Esqueceu a senha?
                            </a>
                        </div>

                        {errorMsg && (
                            <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <AlertCircle className="size-4 shrink-0" />
                                {errorMsg}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-black glow-button bg-cyan-500 hover:bg-cyan-600 text-slate-900 border-none rounded-xl mt-4"
                            size="lg"
                            disabled={loading}
                        >
                            {loading ? "Entrando..." : "Acessar Conta"}
                        </Button>
                    </form>

                    {/* Social Login REMOVED AS REQUESTED */}

                    {/* Sign Up Link */}
                    <div className="text-center text-sm text-slate-400 mt-8 pt-6 border-t border-white/5">
                        Ainda não tem uma conta?{" "}
                        <Link to="/register" className="text-cyan-400 font-bold hover:text-cyan-300 hover:underline transition-colors">
                            Cadastre-se
                        </Link>
                    </div>
                </div>
            </div>
        </div >
    );
};
