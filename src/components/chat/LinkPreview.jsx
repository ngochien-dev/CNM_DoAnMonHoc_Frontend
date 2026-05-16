import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const LinkPreview = ({ url, darkMode }) => {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchPreview = async () => {
            try {
                const res = await api.get(`/utils/link-preview?url=${encodeURIComponent(url)}`);
                if (isMounted) {
                    setPreview(res.data);
                    setLoading(false);
                }
            } catch (err) {
                if (isMounted) setLoading(false);
            }
        };

        fetchPreview();
        return () => { isMounted = false; };
    }, [url]);

    if (loading) return (
        <div className={`mt-2 p-3 rounded-xl border animate-pulse ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-gray-100'}`}>
            <div className="h-4 bg-gray-500/20 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-500/10 rounded w-1/2"></div>
        </div>
    );

    if (!preview) return null;

    return (
        <a 
            href={preview.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`mt-2 flex flex-col sm:flex-row gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01] active:scale-100 shadow-sm ${darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-gray-200 hover:bg-white'}`}
        >
            {preview.image && (
                <div className="w-full sm:w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-black/20">
                    <img src={preview.image} alt={preview.title} className="w-full h-full object-cover" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-bold truncate ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{preview.title}</h4>
                {preview.description && <p className={`text-xs mt-1 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{preview.description}</p>}
                <p className={`text-[10px] mt-2 opacity-50 truncate uppercase tracking-tighter`}>
                    {(() => {
                        try {
                            return new URL(preview.url).hostname;
                        } catch (e) {
                            return preview.url;
                        }
                    })()}
                </p>
            </div>
        </a>
    );
};

export default LinkPreview;
