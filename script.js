async function processFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
        alert('请选择一个文件');
        return;
    }

    // 显示加载提示
    const resultDiv = document.getElementById('analysisResult');
    resultDiv.innerHTML = '<div class="alert alert-info">正在处理文件...</div>';

    let textContent = '';
    if (file.type === 'application/pdf') {
        textContent = await extractTextFromPDF(file);
    } else if (file.type === 'text/plain') {
        textContent = await extractTextFromTXT(file);
    } else {
        resultDiv.innerHTML = '<div class="alert alert-danger">不支持的文件格式</div>';
        return;
    }

    const analysisResult = analyzeText(textContent);
    displayResult(analysisResult);
}

async function extractTextFromPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const arrayBuffer = event.target.result;
            const loadingTask = pdfjsLib.getDocument(arrayBuffer);
            loadingTask.promise.then(function(pdf) {
                let textContent = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    pdf.getPage(i).then(function(page) {
                        page.getTextContent().then(function(text) {
                            textContent += text.items.map(item => item.str).join(' ');
                            if (i === pdf.numPages) {
                                resolve(textContent);
                            }
                        });
                    });
                }
            }, function(reason) {
                reject(reason);
            });
        };
        reader.readAsArrayBuffer(file);
    });
}

async function extractTextFromTXT(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            resolve(event.target.result);
        };
        reader.onerror = function(event) {
            reject(event.target.error);
        };
        reader.readAsText(file);
    });
}

function analyzeText(text) {
    const words = text.split(/\s+/);
    const wordFrequency = {};
    words.forEach(word => {
        const lowerWord = word.toLowerCase();
        if (!wordFrequency[lowerWord]) {
            wordFrequency[lowerWord] = 0;
        }
        wordFrequency[lowerWord]++;
    });

    const sortedWords = Object.keys(wordFrequency).sort((a, b) => wordFrequency[b] - wordFrequency[a]);
    const keywords = sortedWords.slice(0, 10);

    const sentences = text.split(/\.|\?|\!/);
    const summary = sentences.slice(0, 3).join('. ') + '.';

    return {
        keywords: keywords.join(', '),
        summary: summary
    };
}

function displayResult(result) {
    const resultDiv = document.getElementById('analysisResult');
    resultDiv.innerHTML = `
        <h2 class="mb-3">分析结果</h2>
        <div class="mb-3">
            <strong>关键词：</strong> ${result.keywords}
        </div>
        <div class="mb-3">
            <strong>文本摘要：</strong> ${result.summary}
        </div>
    `;
}