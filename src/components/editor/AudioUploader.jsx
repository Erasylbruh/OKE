import { useState } from 'react';
import API_URL from '../../config';
import { useParams } from 'react-router-dom';

const AudioUploader = ({ audioUrl, setAudioUrl, setLyrics }) => {
    const { id } = useParams();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('audio', file);
        const token = localStorage.getItem('token');

        setIsUploading(true);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_URL}/api/projects/${id}/audio`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                setUploadProgress(Math.round((event.loaded / event.total) * 100));
            }
        };

        xhr.onload = () => {
            setIsUploading(false);
            if (xhr.status >= 200 && xhr.status < 300) {
                const data = JSON.parse(xhr.responseText);
                setAudioUrl(data.audio_url);
                if (data.lyrics && data.lyrics.length > 0) {
                    setLyrics(data.lyrics);
                    alert('Audio transcribed!');
                }
            } else {
                alert('Upload failed');
            }
        };

        xhr.send(formData);
    };

    const handleDelete = async () => {
        if (!confirm('Remove audio?')) return;
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/api/projects/${id}/audio`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setAudioUrl(null);
    };

    return (
        <section className="text-center mb-8">
            <div
                onClick={() => document.getElementById('audio-upload').click()}
                className="w-32 h-32 mx-auto mb-4 rounded-full bg-neutral-900 border-2 border-neutral-800 flex items-center justify-center cursor-pointer relative overflow-hidden shadow-xl hover:border-neutral-600 transition-colors group"
            >
                {/* Vinyl Grooves effect */}
                <div className="absolute inset-0 rounded-full opacity-30 bg-[repeating-radial-gradient(#111_0,#111_2px,#222_3px,#222_4px)]" />

                <div className={`w-10 h-10 rounded-full z-10 flex items-center justify-center font-bold text-white ${audioUrl ? 'bg-green-500' : 'bg-neutral-700'}`}>
                    {isUploading ? `${uploadProgress}%` : (audioUrl ? '♫' : '+')}
                </div>
            </div>

            <p className="text-neutral-400 text-sm mb-2">{audioUrl ? 'Change Track' : 'Upload Audio (MP3)'}</p>

            <input id="audio-upload" type="file" accept=".mp3,audio/mpeg" onChange={handleUpload} className="hidden" />

            {audioUrl && (
                <button
                    onClick={handleDelete}
                    className="text-red-500 border border-red-500 px-3 py-1 rounded-full text-xs hover:bg-red-500/10 transition-colors"
                >
                    Remove Audio
                </button>
            )}
        </section>
    );
};

export default AudioUploader;
