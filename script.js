// --- 1. SABHI ELEMENTS KO SELECT KAREIN (Global Scope) ---
const dropZone = document.getElementById('drop-zone');
const imageInput = document.getElementById('imageInput');
const fileCountLabel = document.getElementById('file-count');
const dropText = document.getElementById('drop-text');
const fileNameInput = document.getElementById('fileNameInput');
const qualitySelect = document.getElementById('qualitySelect');

// Buttons
const convertBtn = document.getElementById('convertBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const themeBtn = document.getElementById('theme-toggle');

// Containers
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const statusText = document.getElementById('status-text');
const previewContainer = document.getElementById('preview-container');
const iframe = document.getElementById('pdf-preview-frame');
const mobileBtn = document.getElementById('mobile-preview-btn');

let globalPDFBlob = null; // Generated PDF yahan save hogi

// --- 2. DELETE / RESET BUTTON LOGIC (Fixed) ---
resetBtn.addEventListener('click', () => {
    // 1. Values clear karein
    imageInput.value = ""; 
    fileNameInput.value = "";
    
    // 2. Text wapis default karein
    dropText.innerText = "Click or Drop Images Here";
    fileCountLabel.innerText = "Supports JPG, PNG, WEBP";
    fileCountLabel.style.color = "#666";
    fileCountLabel.style.fontWeight = "normal";

    // 3. Buttons aur Preview chupayein
    previewContainer.classList.add('hidden');
    downloadBtn.classList.add('hidden');
    progressContainer.classList.add('hidden');
    
    // 4. Generate Button reset karein
    convertBtn.disabled = false;
    convertBtn.innerHTML = '<i class="fas fa-magic"></i> Generate PDF';
    
    // 5. Memory clear karein
    globalPDFBlob = null;
    iframe.src = "";
});

// --- 3. DRAG & DROP LOGIC ---
dropZone.addEventListener('dragover', (e) => { 
    e.preventDefault(); 
    dropZone.querySelector('.upload-label').classList.add('drag-over'); 
});

dropZone.addEventListener('dragleave', () => { 
    dropZone.querySelector('.upload-label').classList.remove('drag-over'); 
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.querySelector('.upload-label').classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
});

imageInput.addEventListener('change', () => handleFiles(imageInput.files));

function handleFiles(files) {
    // Input files ko sync karein
    imageInput.files = files; 
    
    // UI update karein
    dropText.innerText = `${files.length} Images Selected`;
    fileCountLabel.innerText = "Ready to Generate";
    fileCountLabel.style.color = "var(--primary-color)";
    fileCountLabel.style.fontWeight = "bold";
}

// --- 4. GENERATE PDF LOGIC ---
convertBtn.addEventListener('click', async () => { // Changed from onclick to Listener
    const files = imageInput.files;
    if (files.length === 0) { 
        alert("Please upload images first!"); 
        return; 
    }

    // UI Lock karein
    convertBtn.disabled = true;
    downloadBtn.classList.add('hidden');
    previewContainer.classList.add('hidden');
    progressContainer.classList.remove('hidden');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const quality = parseFloat(qualitySelect.value);

    for (let i = 0; i < files.length; i++) {
        // Progress Bar Update
        const percent = Math.round(((i + 1) / files.length) * 100);
        progressBar.style.width = percent + "%";
        statusText.innerText = `Processing: ${i + 1} / ${files.length}`;

        try {
            const imgData = await compressImage(files[i], quality);
            const imgProps = await getImageProperties(imgData);

            // A4 Size Math
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

    // Final Setup
    statusText.innerText = "Creating Preview...";
    globalPDFBlob = doc.output('bloburl');

    iframe.src = globalPDFBlob;
    mobileBtn.href = globalPDFBlob;

    previewContainer.classList.remove('hidden');
    downloadBtn.classList.remove('hidden');
    convertBtn.disabled = false;
    convertBtn.innerHTML = '<i class="fas fa-redo"></i> Again';
    progressContainer.classList.add('hidden');
});

// --- 5. DOWNLOAD LOGIC ---
downloadBtn.addEventListener('click', () => {
    if (!globalPDFBlob) return;
    
    let name = fileNameInput.value.trim();
    if (!name) name = "My-Document";
    if (!name.endsWith(".pdf")) name += ".pdf";

    const link = document.createElement('a');
    link.href = globalPDFBlob;
    link.download = name;
    link.click();
});

// --- 6. HELPER FUNCTIONS ---
function compressImage(file, quality) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxWidth = quality < 0.8 ? 1000 : img.width; 
                const scaleSize = maxWidth / img.width;
                canvas.width = maxWidth;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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

// --- 7. THEME TOGGLE ---
themeBtn.addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeBtn.querySelector('i').className = isDark ? 'fas fa-moon' : 'fas fa-sun';
});