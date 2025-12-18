import html2pdf from 'html2pdf.js';

export interface PDFGeneratorOptions {
    filename?: string;
    margin?: number;
    imageQuality?: number;
    scale?: number;
}

/**
 * Generates a professional PDF from an HTML element.
 * Applies dark mode styling, adds a branded header with logo, and a footer with date.
 */
export const generatePDF = async (element: HTMLElement, options: PDFGeneratorOptions = {}) => {
    const {
        filename = 'b5tools-report.pdf',
        margin = 10,
        imageQuality = 0.98,
        scale = 2,
    } = options;

    // Clone the element to manipulate it without affecting the live UI
    const content = element.cloneNode(true) as HTMLElement;

    // Create a wrapper to apply specific print styling and structure
    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-export-wrapper bg-white text-black p-8 font-sans'; // White Background
    wrapper.style.width = '100%';
    wrapper.style.minHeight = '100vh';

    // --- 1. HEADER (Logo + Brand) ---
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between border-b-2 border-black pb-4 mb-6';
    header.innerHTML = `
    <div class="flex items-center gap-4">
      <img src="/logo.png" alt="B5Tools" class="h-12 w-12 object-contain" />
      <div>
        <h1 class="text-2xl font-black text-black tracking-wide">B5Tools</h1>
        <p class="text-sm text-gray-500 uppercase tracking-widest font-bold">Score Professional</p>
      </div>
    </div>
    <div class="text-right">
      <p class="text-xs text-gray-400 font-bold">Reporte Oficial</p>
    </div>
  `;

    // --- 2. FOOTER (Branding + Date) ---
    const footer = document.createElement('div');
    footer.className = 'flex items-center justify-between border-t border-gray-200 pt-4 mt-8';
    const date = new Date().toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    footer.innerHTML = `
    <p class="text-xs text-gray-400">Generado con B5Tools • 2025 • All rights reserved</p>
    <p class="text-xs text-gray-400 font-mono">${date}</p>
  `;

    // --- 3. ASSEMBLE & MOUNT ---
    // Apply fix for dark mode text colors in the cloned content
    // We force text colors to ensure readability on the dark PDF background
    // Apply fix for dark mode text colors in the cloned content
    const fixStyles = (el: HTMLElement) => {
        // 1. Force Visibility
        el.classList.remove('hidden');
        el.style.display = 'block';
        el.style.visibility = 'visible';

        // CRITICAL: Reset positioning since the source is off-screen
        el.style.position = 'static';
        el.style.top = 'auto';
        el.style.left = 'auto';
        el.style.transform = 'none';
        el.style.margin = '0 auto';

        // 2. Fix Text Colors - REMOVED AGGRESSIVE OVERRIDE
        // We rely on the classes provided in the JSX (text-white, etc)
        // rather than forcing everything here.

        // Fix Borders (Optional, keep if useful, else remove)
        /*
        const allElements = el.querySelectorAll('*');
        allElements.forEach((node) => {
             const element = node as HTMLElement;
             const style = window.getComputedStyle(element);
             if (style.borderColor.includes('rgba(255, 255, 255')) {
                 element.style.borderColor = 'rgba(255, 255, 255, 0.2)';
             }
        });
        */
    };
    fixStyles(content);


    wrapper.appendChild(header);
    wrapper.appendChild(content);
    wrapper.appendChild(footer);

    // CRITICAL FIX: Append to body so html2canvas can calculate layout!
    // We place it off-screen fixed or absolute to ensure it renders but doesn't mess up scroll
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.zIndex = '-9999'; // Behind everything
    document.body.appendChild(wrapper);

    // Opt configuration
    const opt = {
        margin: margin,
        filename: filename,
        image: { type: 'jpeg', quality: imageQuality },
        html2canvas: { scale: scale, useCORS: true, backgroundColor: '#ffffff', scrollY: 0 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    try {
        await html2pdf().set(opt).from(wrapper).save();
    } finally {
        document.body.removeChild(wrapper);
    }
};
