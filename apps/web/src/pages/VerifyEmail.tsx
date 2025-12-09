import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') || '';
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resending, setResending] = useState(false);
    const navigate = useNavigate();

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.verifyEmail(email, otp);
            navigate('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        setError('');
        try {
            await api.resendOtp(email);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Verify Your Email</CardTitle>
                    <CardDescription>
                        We sent a 6-digit code to <strong>{email}</strong>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleVerify} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="otp" className="text-sm font-medium">
                                Verification Code
                            </label>
                            <Input
                                id="otp"
                                type="text"
                                placeholder="123456"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                                required
                                className="text-center text-2xl tracking-widest"
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}
                        <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                            {loading ? 'Verifying...' : 'Verify Email'}
                        </Button>
                    </form>
                    <div className="mt-4 text-center">
                        <Button
                            variant="link"
                            onClick={handleResend}
                            disabled={resending}
                            className="text-sm"
                        >
                            {resending ? 'Sending...' : "Didn't receive a code? Resend"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
