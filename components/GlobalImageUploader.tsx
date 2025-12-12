import React, { useState, useRef } from 'react';
import { Upload, Camera, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface GlobalImageUploaderProps {
    currentUrl?: string;
    onUpload: (url: string) => void;
    label?: string;
    bucketName?: 'team-logos' | 'player-photos';
    basePath?: string;
    className?: string;
    rounded?: boolean;
    localMode?: boolean;
}

export const GlobalImageUploader: React.FC<GlobalImageUploaderProps> = ({
    currentUrl,
    onUpload,
    label = 'Subir Imagen',
    bucketName = 'team-logos',
    basePath = 'uploads',
    className = '',
    rounded = false,
    localMode = false
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];

        try {
            setIsUploading(true);

            if (localMode) {
                // Local Mode: Convert to Base64 and return
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        onUpload(reader.result);
                    }
                    setIsUploading(false);
                };
                reader.readAsDataURL(file);
                return;
            }

            // Direct Mode: Upload to Supabase
            const fileExt = file.name.split('.').pop();
            const fileName = `${basePath}/${crypto.randomUUID()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from(bucketName)
                .getPublicUrl(fileName);

            if (data) {
                onUpload(data.publicUrl);
            }
        } catch (error: any) {
            console.error('Error uploading image:', error);
            alert('Error al subir imagen. ' + (error.message || ''));
        } finally {
            if (!localMode) setIsUploading(false);
        }
    };

    return (
        <div
            className={`relative group cursor-pointer border border-dashed border-white/20 hover:border-blue-500/50 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center justify-center overflow-hidden ${rounded ? 'rounded-full aspect-square' : 'rounded-xl aspect-video'} ${className}`}
            onClick={() => !isUploading && fileInputRef.current?.click()}
        >
            {currentUrl ? (
                <img
                    src={currentUrl}
                    alt="Preview"
                    className={`w-full h-full object-cover absolute inset-0 transition-opacity ${isUploading ? 'opacity-50' : 'opacity-100 group-hover:opacity-70'}`}
                />
            ) : (
                <div className="text-white/20 group-hover:text-blue-400 transition-colors flex flex-col items-center justify-center">
                    <Camera size={className.includes('w-10') ? 16 : 24} className="mb-2" />
                    {!className.includes('w-10') && <span className="text-[10px] uppercase font-bold text-center px-2">{label}</span>}
                </div>
            )}

            {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <Loader2 className="animate-spin text-white" size={24} />
                </div>
            )}

            {!isUploading && currentUrl && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-black/40">
                    <Upload className="text-white" size={20} />
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
            />
        </div>
    );
};
