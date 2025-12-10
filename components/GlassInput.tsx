import React from 'react';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  containerClassName?: string;
}

export const GlassInput: React.FC<GlassInputProps> = ({ 
  label, 
  className = "", 
  containerClassName = "",
  ...props 
}) => {
  return (
    <div className={`flex flex-col gap-1 w-full ${containerClassName}`}>
      {label && (
        <label className="text-xs font-semibold text-purple-200/70 uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 focus:bg-white/10 transition-all duration-200 text-sm ${className}`}
        {...props}
      />
    </div>
  );
};

export const GlassTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <h2 className={`text-lg font-bold text-white uppercase tracking-wide border-b border-white/10 pb-2 mb-4 ${className}`}>
    {children}
  </h2>
);

export const LogoPlaceholder: React.FC<{ text: string }> = ({ text }) => (
  <div className="h-16 w-32 bg-white/5 border border-white/10 rounded flex items-center justify-center text-center p-2">
    <span className="text-xs font-bold text-white/40 uppercase leading-tight">{text}</span>
  </div>
);