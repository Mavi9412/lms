import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import api from '../services/api';

export default function VerifyCertificate() {
    const { code } = useParams();
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get(`/certificates/verify/${code}`);
                setResult(res.data);
            } catch {
                setError('Certificate not found. Check the code and try again.');
            } finally {
                setLoading(false);
            }
        })();
    }, [code]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="glass rounded-2xl border border-white/10 p-10 max-w-lg w-full text-center">
                <Award className="w-16 h-16 text-primary mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-6">Certificate Verification</h1>
                {loading && <p className="text-text-secondary">Verifying...</p>}
                {error && (
                    <>
                        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                        <p className="text-red-400">{error}</p>
                    </>
                )}
                {result && (
                    <>
                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                        <p className="text-green-400 font-semibold mb-4">Valid Certificate</p>
                        <div className="text-left space-y-2 bg-white/5 rounded-xl p-5">
                            <p><span className="text-text-secondary">Student: </span><span className="font-semibold">{result.student_name}</span></p>
                            <p><span className="text-text-secondary">Course: </span><span className="font-semibold">{result.course_title}</span></p>
                            {result.grade && <p><span className="text-text-secondary">Grade: </span><span className="font-semibold">{result.grade}</span></p>}
                            <p><span className="text-text-secondary">Issued: </span>{new Date(result.issued_at).toLocaleDateString()}</p>
                            <p className="text-sm font-mono text-text-secondary">Code: {result.verification_code}</p>
                        </div>
                    </>
                )}
                <Link to="/" className="inline-flex items-center gap-2 mt-6 text-primary hover:underline text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to home
                </Link>
            </div>
        </div>
    );
}
