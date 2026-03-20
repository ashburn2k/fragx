import { useRef, useState } from 'react';
import { Camera, X, Upload, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFile(file: File) {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB');
      return;
    }

    setUploading(true);
    setError(null);

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('trade-images')
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setError('Upload failed. Please try again.');
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('trade-images').getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) uploadFile(file);
  }

  async function handleRemove() {
    if (!value) return;
    const path = value.split('/trade-images/')[1];
    if (path) {
      await supabase.storage.from('trade-images').remove([path]);
    }
    onChange(null);
  }

  if (value) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
        <img
          src={value}
          alt="Upload preview"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
          <button
            type="button"
            onClick={handleRemove}
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        disabled={uploading}
        className={[
          'w-full flex flex-col items-center justify-center gap-2 h-36 rounded-xl border-2 border-dashed transition-all cursor-pointer',
          dragOver
            ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
            : 'border-slate-300 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-600 bg-slate-50 dark:bg-slate-800/50',
          uploading ? 'opacity-60 cursor-not-allowed' : '',
        ].join(' ')}
      >
        {uploading ? (
          <>
            <Loader2 size={22} className="text-cyan-500 animate-spin" />
            <span className="text-slate-500 dark:text-slate-400 text-xs">Uploading...</span>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700">
              {dragOver ? <Upload size={18} className="text-cyan-500" /> : <Camera size={18} className="text-slate-500 dark:text-slate-400" />}
            </div>
            <div className="text-center">
              <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">
                {dragOver ? 'Drop to upload' : 'Add a photo'}
              </span>
              <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5">JPG, PNG, WebP · max 5 MB</p>
            </div>
          </>
        )}
      </button>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
