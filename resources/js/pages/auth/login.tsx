import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } =
        useForm<LoginForm>({
            email: '',
            password: '',
            remember: false,
        });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Sign In" />

            <div className="min-h-screen bg-[#101828] text-white selection:bg-brand-500 selection:text-white">
                <div className="grid min-h-screen lg:grid-cols-2">
                    <section className="flex min-h-screen flex-col bg-[#101828] px-6 py-8 sm:px-10 lg:px-16">
                        <div className="w-full max-w-md">
                            <Link
                                href="/"
                                className="inline-flex items-center text-sm font-medium text-gray-300 transition-colors hover:text-white"
                            >
                                <span className="mr-2 text-lg leading-none">‹</span>
                                Back to dashboard
                            </Link>
                        </div>

                        <div className="flex flex-1 items-center justify-center">
                            <div className="w-full max-w-md">
                                <div className="mb-8">
                                    <h1 className="mb-2 text-3xl font-bold text-white">
                                        Sign In
                                    </h1>

                                    <p className="text-sm font-medium text-gray-400">
                                        Enter your email and password to sign in.
                                    </p>
                                </div>

                                {status && (
                                    <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-300">
                                        {status}
                                    </div>
                                )}

                                <form onSubmit={submit} className="space-y-6">
                                    <div>
                                        <Label
                                            htmlFor="email"
                                            className="mb-2 block text-sm font-semibold text-gray-200"
                                        >
                                            Email <span className="text-red-400">*</span>
                                        </Label>

                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="email"
                                            value={data.email}
                                            onChange={(event) =>
                                                setData('email', event.target.value)
                                            }
                                            placeholder="admin@corpski.co.id"
                                            className="h-12 rounded-xl border-gray-700 bg-gray-100 px-4 text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-brand-500"
                                        />

                                        <InputError
                                            message={errors.email}
                                            className="mt-2"
                                        />
                                    </div>

                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <Label
                                                htmlFor="password"
                                                className="block text-sm font-semibold text-gray-200"
                                            >
                                                Password{' '}
                                                <span className="text-red-400">*</span>
                                            </Label>

                                            {canResetPassword && (
                                                <Link
                                                    href={route('password.request')}
                                                    tabIndex={5}
                                                    className="text-sm font-semibold text-brand-400 hover:text-brand-300"
                                                >
                                                    Forgot password?
                                                </Link>
                                            )}
                                        </div>

                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={
                                                    showPassword
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                value={data.password}
                                                onChange={(event) =>
                                                    setData(
                                                        'password',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Enter your password"
                                                className="h-12 rounded-xl border-gray-700 bg-gray-100 px-4 pr-12 text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-brand-500"
                                            />

                                            <button
                                                type="button"
                                                tabIndex={-1}
                                                onClick={() =>
                                                    setShowPassword(
                                                        (current) => !current,
                                                    )
                                                }
                                                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
                                            >
                                                {showPassword ? (
                                                    <Eye className="h-5 w-5" />
                                                ) : (
                                                    <EyeOff className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>

                                        <InputError
                                            message={errors.password}
                                            className="mt-2"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label
                                            htmlFor="remember"
                                            className="flex cursor-pointer select-none items-center gap-3"
                                        >
                                            <input
                                                id="remember"
                                                name="remember"
                                                type="checkbox"
                                                tabIndex={3}
                                                checked={data.remember}
                                                onChange={(event) =>
                                                    setData(
                                                        'remember',
                                                        event.target.checked,
                                                    )
                                                }
                                                className="h-4 w-4 rounded border-gray-500 bg-transparent text-brand-500 accent-brand-500 focus:ring-2 focus:ring-brand-500"
                                            />

                                            <span className="text-sm font-medium text-gray-300">
                                                Keep me logged in
                                            </span>
                                        </label>
                                    </div>

                                    <Button
                                        type="submit"
                                        tabIndex={4}
                                        disabled={processing}
                                        className="h-12 w-full rounded-xl bg-brand-500 text-sm font-bold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {processing && (
                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Sign in
                                    </Button>
                                </form>

                                <div className="mt-6">
                                    <p className="text-sm font-medium text-gray-400">
                                        Don&apos;t have an account?{' '}
                                        <Link
                                            href={route('register')}
                                            tabIndex={6}
                                            className="font-bold text-brand-400 hover:text-brand-300"
                                        >
                                            Sign Up
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="hidden min-h-screen bg-[#0b1020] lg:block">
                        <div className="relative flex h-full items-center justify-center overflow-hidden px-12">
                            <div className="absolute left-[-140px] top-[-140px] h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
                            <div className="absolute bottom-[-160px] right-[-160px] h-96 w-96 rounded-full bg-blue-600/30 blur-3xl" />

                            <div className="relative z-10 max-w-md text-center">
                                <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 p-3 backdrop-blur">
                                    <img
                                        src="/images/logo/csm-icon.svg"
                                        alt="Fleet CSM"
                                        className="h-14 w-14 object-contain"
                                    />
                                </div>

                                <h2 className="mb-4 text-3xl font-bold text-white">
                                    Fleet CSM
                                </h2>

                                <p className="text-base leading-7 text-gray-300">
                                    Control Tower untuk monitoring operation,
                                    purchasing, warehouse, approval, dan master data
                                    PT. Cipta Semangat Maju.
                                </p>

                                <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-left shadow-2xl backdrop-blur">
                                    <p className="text-sm font-bold text-white">
                                        Integrated System
                                    </p>

                                    <p className="mt-2 text-sm leading-6 text-gray-400">
                                        Login menggunakan akun yang sudah terdaftar
                                        pada User Management Fleet CSM.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
