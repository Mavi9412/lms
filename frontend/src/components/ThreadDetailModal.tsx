import { useEffect, useState } from 'react';
import { X, Send, ThumbsUp, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Reply {
    id: number;
    content: string;
    created_at: string;
    creator_name: string;
    created_by: number;
    upvotes?: number;
}

interface ThreadDetail {
    id: number;
    title: string;
    content: string;
    created_at: string;
    creator_name: string;
    created_by: number;
    replies: Reply[];
}

interface Props {
    threadId: number | null;
    onClose: () => void;
}

export default function ThreadDetailModal({ threadId, onClose }: Props) {
    const { user } = useAuth();
    const [thread, setThread] = useState<ThreadDetail | null>(null);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (threadId) {
            setThread(null);
            fetchThread();
        }
    }, [threadId]);

    const fetchThread = async () => {
        try {
            const res = await api.get(`/discussions/${threadId}`);
            setThread(res.data);
        } catch {
            /* closed or failed */
        }
    };

    const postReply = async () => {
        if (!replyText.trim() || !threadId) return;
        setSending(true);
        try {
            await api.post(`/discussions/${threadId}/replies`, { thread_id: threadId, content: replyText.trim() });
            setReplyText('');
            fetchThread();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to post reply');
        } finally {
            setSending(false);
        }
    };

    const upvote = async (replyId: number) => {
        try {
            await api.post(`/discussions/replies/${replyId}/upvote`);
            fetchThread();
        } catch { /* ignore */ }
    };

    const deleteReply = async (replyId: number) => {
        if (!confirm('Delete this reply?')) return;
        try {
            await api.delete(`/discussions/replies/${replyId}`);
            fetchThread();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to delete reply');
        }
    };

    if (!threadId) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="glass rounded-2xl border border-white/10 w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between p-6 border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-bold">{thread?.title || 'Loading...'}</h2>
                        {thread && <p className="text-sm text-text-secondary mt-1">by {thread.creator_name}</p>}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {thread && (
                        <p className="text-text-secondary whitespace-pre-wrap">{thread.content}</p>
                    )}
                    <div className="border-t border-white/5 pt-4">
                        <h3 className="font-semibold mb-3">Replies ({thread?.replies.length || 0})</h3>
                        <div className="space-y-3">
                            {thread?.replies.map((r) => (
                                <div key={r.id} className="bg-bg-secondary/40 border border-white/5 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-primary">{r.creator_name}</span>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => upvote(r.id)} className="p-1.5 text-text-secondary hover:text-primary rounded" title="Upvote">
                                                <ThumbsUp className="w-4 h-4" />
                                            </button>
                                            {(user?.id === r.created_by || user?.role === 'admin') && (
                                                <button onClick={() => deleteReply(r.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{r.content}</p>
                                </div>
                            ))}
                            {thread && thread.replies.length === 0 && (
                                <p className="text-sm text-text-secondary">No replies yet — be the first.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-white/5 flex gap-2">
                    <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && postReply()}
                        placeholder="Write a reply..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary"
                    />
                    <button onClick={postReply} disabled={sending || !replyText.trim()} className="btn btn-primary px-4 flex items-center gap-2 text-sm disabled:opacity-50">
                        <Send className="w-4 h-4" /> Reply
                    </button>
                </div>
            </div>
        </div>
    );
}
