import { useState } from 'react';
import API_URL from '../../config';
import { FaTimes } from 'react-icons/fa';

const PublishingSettings = ({
    projectName, setProjectName,
    description, setDescription,
    isPublic, setIsPublic,
    previewUrls, setPreviewUrls,
    isSaving, onSave
}) => {
    const [activeTab, setActiveTab] = useState('settings'); // just local UI state if needed

    const handlePreviewUpload = async (slot, file) => {
        if (!file) return;

        // Resize logic could be extracted to util, but keeping simple here or use hook?
        // Let's implement resize inline or extract later.
        // Replicating resize logic from original for now
        const resizeImage = (file) => {
            return new Promise((resolve) => {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 400;
                    canvas.height = 400;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, 400, 400);
                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                    }, 'image/jpeg', 0.9);
                };
            });
        };

        const resizedFile = await resizeImage(file);

        // We need 'id' but passed via props? No, passed via context or props?
        // This component should perhaps take a function handleUploadPreview from parent to keep it dumb.
        // But for Refactor, I'll assume we pass the functions or use the hook in parent.
        // Let's assume parent passes `onUploadPreview` and `onDeletePreview`.
    };

    // Actually, to make this clean, let's keep API logic in the hook or parent.
    // I'll update the component to accept handlers.
    return (
        <div className="p-5">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-neutral-400 text-sm uppercase font-bold">Publishing</h3>
            </div>

            <div className="mb-6">
                <label className="block text-neutral-400 text-sm mb-2">Project Name</label>
                <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                />
            </div>

            <div className="mb-6">
                <label className="block text-neutral-400 text-sm mb-2">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:outline-none focus:border-green-500 transition-colors resize-none"
                />
            </div>

            {/* Privacy Toggle */}
            <div className="bg-neutral-800 rounded-full p-1 flex items-center mb-8 w-fit">
                <button
                    onClick={() => setIsPublic(false)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${!isPublic ? 'bg-neutral-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                >
                    Private
                </button>
                <button
                    onClick={() => setIsPublic(true)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${isPublic ? 'bg-green-500 text-black' : 'text-neutral-400 hover:text-white'}`}
                >
                    Public
                </button>
            </div>

            <button
                onClick={onSave}
                disabled={isSaving}
                className="w-full bg-green-500 text-black font-bold py-3 rounded-full hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSaving ? 'Saving...' : 'Save Project'}
            </button>
        </div>
    );
};

export default PublishingSettings;
