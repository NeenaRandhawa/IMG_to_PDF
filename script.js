// --- DOM ELEMENTS ---
const imageInput = document.getElementById('imageInput');
const dropZone = document.getElementById('drop-zone');
const fileCountLabel = document.getElementById('file-count');
const dropText = document.getElementById('drop-text');
const fileNameInput = document.getElementById('fileNameInput');
const qualitySelect = document.getElementById('qualitySelect');

let globalPDFBlob = null; // Store final PDF URL

// --- 1. HANDLE UPLOADS ---
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.querySelector('.upload-label').classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => { dropZone.querySelector('.upload-label').classList.remove('drag-over'); });
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.querySelector('.upload-label').classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
});
imageInput.addEventListener('change', () => handleFiles(imageInput.files));

function handleFiles(files) {
    imageInput.files = files; // Sync input
    dropText.innerText = `${files.length} Images Selected`;
    fileCountLabel.innerText = "Ready to Generate";
    fileCountLabel.style.color = "var(--primary-color)";
    fileCountLabel.style.fontWeight = "bold";
}

// --- 2. GENERATE PDF ---
async function generatePDF() {
    const files = imageInput.files;
    if (files.length === 0) { alert("Please upload images first!"); return; }

    // Lock UI
    const convertBtn = document.getElementById('convertBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('status-text');
    const progressContainer = document.getElementById('progress-container');
    const previewContainer = document.getElementById('preview-container');

    convertBtn.disabled = true;
    downloadBtn.classList.add('hidden');
    previewContainer.classList.add('hidden');
    progressContainer.classList.remove('hidden');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const quality = parseFloat(qualitySelect.value); // Get selected quality (0.3 - 0.9)

    for (let i = 0; i < files.length; i++) {
        // Update Progress
        const percent = Math.round(((i + 1) / files.length) * 100);
        progressBar.style.width = percent + "%";
        statusText.innerText = `Processing: ${i + 1} / ${files.length}`;

        try {
            // Image Compress & Read
            const imgData = await compressImage(files[i], quality);
            const imgProps = await getImageProperties(imgData);

            // Aspect Ratio Logic (Fit to A4)
            const pageWidth = 210; 
            const pageHeight = 297; 
            const imgRatio = imgProps.width / imgProps.height;
            let finalWidth = pageWidth - 20; 
            let finalHeight = finalWidth / imgRatio;

            if (finalHeight > (pageHeight - 20)) {
                finalHeight = pageHeight - 20;
                finalWidth = finalHeight * imgRatio;
            }

            if (i > 0) doc.addPage();
            doc.addImage(imgData, 'JPEG', 10, 10, finalWidth, finalHeight);

        } catch (err) { console.error("Error:", err); }
    }

    // Finalize
    statusText.innerText = "Creating Preview...";
    globalPDFBlob = doc.output('bloburl');

    // Show Preview
    document.getElementById('pdf-preview-frame').src = globalPDFBlob;
    const mobileBtn = document.getElementById('mobile-preview-btn');
    mobileBtn.href = globalPDFBlob;

    previewContainer.classList.remove('hidden');
    downloadBtn.classList.remove('hidden');
    convertBtn.disabled = false;
    convertBtn.innerHTML = '<i class="fas fa-redo"></i> Again';
    progressContainer.classList.add('hidden');
}

// --- 3. DOWNLOAD FUNCTION ---
function downloadPDF() {
    if (!globalPDFBlob) return;
    
    // User ka diya hua naam ya Default
    let name = fileNameInput.value.trim();
    if (!name) name = "My-Document";
    if (!name.endsWith(".pdf")) name += ".pdf";

    // Download Trigger
    const { jsPDF } = window.jspdf; // Re-access for save method if needed, but blob link is better
    const link = document.createElement('a');
    link.href = globalPDFBlob;
    link.download = name;
    link.click();
}

// --- 4. RESET / CLEAR FUNCTION ---
function resetApp() {
    imageInput.value = ""; // Clear file input
    fileNameInput.value = ""; // Clear name
    dropText.innerText = "Click or Drop Images Here";
    fileCountLabel.innerText = "Supports JPG, PNG, WEBP";
    fileCountLabel.style.color = "#666";
    fileCountLabel.style.fontWeight = "normal";
    
    document.getElementById('preview-container').classList.add('hidden');
    document.getElementById('downloadBtn').classList.add('hidden');
    document.getElementById('convertBtn').innerHTML = '<i class="fas fa-magic"></i> Generate PDF';
    globalPDFBlob = null;
}

// --- 5. HELPERS (Compression & Reading) ---
function compressImage(file, quality) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Limit max width to 1000px for performance if quality is Low/Medium
                const maxWidth = quality < 0.8 ? 1000 : img.width; 
                const scaleSize = maxWidth / img.width;
                
                canvas.width = maxWidth;
                canvas.height = img.height * scaleSize;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Return compressed Data URL
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
        };
    });
}

function getImageProperties(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.src = url;
    });
}

// --- THEME TOGGLE ---
document.getElementById('theme-toggle').addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    document.querySelector('.theme-btn i').className = isDark ? 'fas fa-moon' : 'fas fa-sun';
});