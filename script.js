// --- DOM ELEMENTS ---
const dropZone = document.getElementById('drop-zone');
const imageInput = document.getElementById('imageInput');
const fileCountLabel = document.getElementById('file-count');
const dropText = document.getElementById('drop-text');
const themeBtn = document.getElementById('theme-toggle');

let globalPDFBlob = null; 

// --- 1. DRAG & DROP LOGIC ---
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.querySelector('.upload-label').classList.add('drag-over');
    dropText.innerText = "Drop Images Here";
});

dropZone.addEventListener('dragleave', () => {
    dropZone.querySelector('.upload-label').classList.remove('drag-over');
    dropText.innerText = "Click to Upload or Drag & Drop here";
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.querySelector('.upload-label').classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        imageInput.files = files; 
        updateUI(files.length);
    }
});

imageInput.addEventListener('change', function() {
    updateUI(this.files.length);
});

function updateUI(count) {
    if (count > 0) {
        dropText.innerText = `${count} Images Selected`;
        fileCountLabel.innerText = "Ready to Generate";
        fileCountLabel.style.color = "var(--primary-color)";
        fileCountLabel.style.fontWeight = "bold";
    }
}

// --- 2. THEME TOGGLE ---
themeBtn.addEventListener('click', () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const newTheme = current === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    themeBtn.querySelector('i').className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
});

// --- 3. PDF GENERATION LOGIC ---
async function generatePDF() {
    const files = imageInput.files;
    if (files.length === 0) {
        alert("Please select images first!");
        return;
    }

    // UI Setup
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
    const pageWidth = 210;
    const pageHeight = 297;

    for (let i = 0; i < files.length; i++) {
        const percent = Math.round(((i + 1) / files.length) * 100);
        progressBar.style.width = percent + "%";
        statusText.innerText = `Processing Image ${i + 1} / ${files.length}`;

        try {
            const imgData = await readFileAsDataURL(files[i]);
            const imgProps = await getImageProperties(imgData);

            const imgRatio = imgProps.width / imgProps.height;
            let finalWidth = pageWidth - 20; 
            let finalHeight = finalWidth / imgRatio;

            if (finalHeight > (pageHeight - 20)) {
                finalHeight = pageHeight - 20;
                finalWidth = finalHeight * imgRatio;
            }

            if (i > 0) doc.addPage();
            doc.addImage(imgData, 'JPEG', 10, 10, finalWidth, finalHeight);

        } catch (err) {
            console.error("Skipping error image:", err);
        }
    }

    // Preview Generate
    statusText.innerText = "Finalizing Preview...";
    globalPDFBlob = doc.output('bloburl');

    // --- MOBILE PREVIEW FIX ---
    // 1. Desktop ke liye Iframe set karo
    const iframe = document.getElementById('pdf-preview-frame');
    iframe.src = globalPDFBlob;

    // 2. Mobile ke liye Button ka Link set karo
    const mobileBtn = document.getElementById('mobile-preview-btn');
    mobileBtn.href = globalPDFBlob;
    
    // UI Show
    previewContainer.classList.remove('hidden');
    downloadBtn.classList.remove('hidden');

    // Reset UI
    convertBtn.disabled = false;
    convertBtn.innerHTML = '<i class="fas fa-redo"></i> Generate Again';
    progressContainer.classList.add('hidden');
    progressBar.style.width = "0%";
}

function downloadPDF() {
    if (globalPDFBlob) {
        const link = document.createElement('a');
        link.href = globalPDFBlob;
        link.download = "My-Photos.pdf";
        link.click();
    }
}

// Helpers
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function getImageProperties(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        img.src = url;
    });
}