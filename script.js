// --- 1. GLOBAL VARIABLES ---
let globalPDFBlob = null; // PDF ka data yahan store hoga

// --- 2. THEME TOGGLE FUNCTION ---
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    document.querySelector('.theme-btn i').className = isDark ? 'fas fa-moon' : 'fas fa-sun';
}

// --- 3. FILE HANDLING ---
// Drag and Drop Logic
const dropZone = document.getElementById('drop-zone');
const dropText = document.getElementById('drop-text');
const fileCountLabel = document.getElementById('file-count');
const imageInput = document.getElementById('imageInput');

dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.querySelector('.upload-label').classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => { dropZone.querySelector('.upload-label').classList.remove('drag-over'); });
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.querySelector('.upload-label').classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
        imageInput.files = e.dataTransfer.files;
        updateUI(imageInput.files.length);
    }
});

// Jab click karke select karein
function handleFileSelect(input) {
    updateUI(input.files.length);
}

function updateUI(count) {
    if (count > 0) {
        dropText.innerText = `${count} Images Selected`;
        fileCountLabel.innerText = "Ready to Generate";
        fileCountLabel.style.color = "#4facfe"; // Blue color
        fileCountLabel.style.fontWeight = "bold";
    }
}

// --- 4. RESET / DELETE FUNCTION (Fix) ---
function resetApp() {
    // Inputs khali karo
    document.getElementById('imageInput').value = "";
    document.getElementById('fileNameInput').value = "";
    
    // UI wapis default karo
    dropText.innerText = "Click or Drop Images Here";
    fileCountLabel.innerText = "Supports JPG, PNG, WEBP";
    fileCountLabel.style.color = "#666";
    fileCountLabel.style.fontWeight = "normal";
    
    // Buttons aur Preview chupao
    document.getElementById('preview-container').classList.add('hidden');
    document.getElementById('downloadBtn').classList.add('hidden');
    document.getElementById('progress-container').classList.add('hidden');
    
    // Generate button reset
    const convertBtn = document.getElementById('convertBtn');
    convertBtn.disabled = false;
    convertBtn.innerHTML = '<i class="fas fa-magic"></i> Generate PDF';
    
    // Memory clear
    globalPDFBlob = null;
    document.getElementById('pdf-preview-frame').src = "";
}

// --- 5. GENERATE PDF FUNCTION ---
async function generatePDF() {
    const files = document.getElementById('imageInput').files;
    if (files.length === 0) { alert("Please select images first!"); return; }

    // UI Lock
    const convertBtn = document.getElementById('convertBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('status-text');

    convertBtn.disabled = true;
    convertBtn.innerHTML = "Processing...";
    downloadBtn.classList.add('hidden');
    document.getElementById('preview-container').classList.add('hidden');
    progressContainer.classList.remove('hidden');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const quality = parseFloat(document.getElementById('qualitySelect').value);

    for (let i = 0; i < files.length; i++) {
        const percent = Math.round(((i + 1) / files.length) * 100);
        progressBar.style.width = percent + "%";
        statusText.innerText = `Converting Image ${i + 1} of ${files.length}`;

        try {
            const imgData = await compressImage(files[i], quality);
            const imgProps = await getImageProperties(imgData);

            // A4 Logic
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

    // Finish
    statusText.innerText = "Finalizing...";
    globalPDFBlob = doc.output('bloburl'); // Blob URL create karo

    // Preview Show
    document.getElementById('pdf-preview-frame').src = globalPDFBlob;
    document.getElementById('mobile-preview-btn').href = globalPDFBlob;
    
    document.getElementById('preview-container').classList.remove('hidden');
    downloadBtn.classList.remove('hidden');
    
    convertBtn.disabled = false;
    convertBtn.innerHTML = '<i class="fas fa-redo"></i> Generate Again';
    progressContainer.classList.add('hidden');
}

// --- 6. DOWNLOAD FUNCTION (Name Fix) ---
function downloadPDF() {
    if (!globalPDFBlob) { alert("Generate PDF first!"); return; }
    
    // Input se naam uthao
    const nameInput = document.getElementById('fileNameInput');
    let fileName = nameInput.value.trim();
    
    // Agar naam khali hai to default use karo
    if (!fileName) {
        fileName = "My-Document.pdf";
    } else {
        // Agar user ne .pdf nahi lagaya to laga do
        if (!fileName.toLowerCase().endsWith(".pdf")) {
            fileName += ".pdf";
        }
    }

    // Link bana kar click karwao
    const link = document.createElement('a');
    link.href = globalPDFBlob;
    link.download = fileName; // Yahan variable wala naam use hoga
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- HELPERS ---
function compressImage(file, quality) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxWidth = quality < 0.8 ? 1200 : img.width; 
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