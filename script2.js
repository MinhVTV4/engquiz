// script.js

// --- IMPORTS ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAI, getGenerativeModel, GoogleAIBackend } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-ai.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, getDocs, serverTimestamp, doc, getDoc, setDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Import các hàm từ module quizGenerator.js
import {
    generateQuizContent,
    fetchWordInfoFromAI,
    getPlacementAnalysis,
    getLearningPath,
    getDiagnosticAnalysis,
    getWritingFeedback,
    getReinforcementLesson,
    scrambleWord // Hàm tiện ích cho Word Scramble
} from './quizGenerator.js';


// --- FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyA2818INoMI_LNIi3kTilRMUQXZ9S6yJjE",
    authDomain: "giaoandientu-7782.firebaseapp.com",
    projectId: "giaoandientu-7782",
    storageBucket: "giaoandientu-7782.firebasestorage.app",
    messagingSenderId: "585204135383",
    appId: "1:585204135383:web:78c7566be2083638290792",
    measurementId: "G-4F3MHQT43X"
};

// --- INITIALIZATION ---
let app, auth, db, model, fastModel, analytics;
try {
    app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app); 
    auth = getAuth(app);
    db = getFirestore(app);
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    
    model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });
    fastModel = getGenerativeModel(ai, { model: "gemini-2.0-flash" });

} catch(e) { 
    showError(`Lỗi khởi tạo: ${e.message}. Vui lòng kiểm tra cấu hình Firebase.`); 
}

// DOM Elements
const appContainer = document.getElementById('appContainer');
const welcomeMessage = document.getElementById('welcomeMessage'), emailInput = document.getElementById('emailInput'), passwordInput = document.getElementById('passwordInput'), loginButton = document.getElementById('loginButton'), registerButton = document.getElementById('registerButton'), logoutButton = document.getElementById('logoutButton'), authError = document.getElementById('authError'), quizTypeSelect = document.getElementById('quizTypeSelect'), vocabModeContainer = document.getElementById('vocabModeContainer'), vocabModeSelect = document.getElementById('vocabModeSelect'), topicContainer = document.getElementById('topicContainer'), topicSelect = document.getElementById('topicSelect'), levelSelect = document.getElementById('levelSelect'), questionCountContainer = document.getElementById('questionCountContainer'), questionCountSelect = document.getElementById('questionCountSelect'), startQuizButton = document.getElementById('startQuizButton'), showHistoryButton = document.getElementById('showHistoryButton'), showNotebookButton = document.getElementById('showNotebookButton'), showLibraryButton = document.getElementById('showLibraryButton'), libraryList = document.getElementById('libraryList'), backToSetupFromLibrary = document.getElementById('backToSetupFromLibrary'), notebookList = document.getElementById('notebookList'), backToSetupFromNotebook = document.getElementById('backToNotebookFromNotebook'), historyDashboard = document.getElementById('historyDashboard'), recommendationsContainer = document.getElementById('recommendationsContainer'), historyFilters = document.getElementById('historyFilters'), filterSkill = document.getElementById('filterSkill'), filterLevel = document.getElementById('filterLevel'), historyList = document.getElementById('historyList'), backToSetupFromHistory = document.getElementById('backToSetupFromHistory'), loadingTopic = document.getElementById('loadingTopic'), loadingTitle = document.getElementById('loadingTitle'), loadingMessage = document.getElementById('loadingMessage'), quizTitle = document.getElementById('quizTitle'), quizSubtitle = document.getElementById('quizSubtitle'), progress = document.getElementById('progress'), scoreEl = document.getElementById('score'), progressBar = document.getElementById('progressBar'), audioPlayerContainer = document.getElementById('audioPlayerContainer'), playAudioBtn = document.getElementById('playAudioBtn'), playIcon = document.getElementById('playIcon'), pauseIcon = document.getElementById('pauseIcon'), audioStatus = document.getElementById('audioStatus'), transcriptControls = document.getElementById('transcriptControls'), showTranscriptBtn = document.getElementById('showTranscriptBtn'), transcriptContainer = document.getElementById('transcriptContainer'), passageContainer = document.getElementById('passageContainer'), passageText = document.getElementById('passageText'), questionContainer = document.getElementById('questionContainer'), questionText = document.getElementById('questionText'), translateQuestionBtn = document.getElementById('translateQuestionBtn'), optionsContainer = document.getElementById('optionsContainer'), feedbackContainer = document.getElementById('feedbackContainer'), nextQuestionButton = document.getElementById('nextQuestionButton'), playAgainButton = document.getElementById('playAgainButton'), reviewAnswersButton = document.getElementById('reviewAnswersButton'), reviewList = document.getElementById('reviewList'), backToPreviousViewButton = document.getElementById('backToPreviousViewButton'), viewHistoryFromResultButton = document.getElementById('viewHistoryFromResultButton'), finalScore = document.getElementById('finalScore'), resultMessage = document.getElementById('resultMessage'), resultScoreContainer = document.getElementById('resultScoreContainer'), errorMessage = document.getElementById('errorMessage'), backToSetupButton = document.getElementById('backToSetupButton'), streakCount = document.getElementById('streakCount'), translationModal = document.getElementById('translationModal'), translationResult = document.getElementById('translationResult'), closeTranslationModal = document.getElementById('closeTranslationModal'), confirmModal = document.getElementById('confirmModal'), confirmTitle = document.getElementById('confirmTitle'), confirmMessage = document.getElementById('confirmMessage'), confirmCancelBtn = document.getElementById('confirmCancelBtn'), confirmOkBtn = document.getElementById('confirmOkBtn'), vocabModal = document.getElementById('vocabModal'), vocabList = document.getElementById('vocabList'), closeVocabModal = document.getElementById('closeVocabModal');
const backToSetupFromWriting = document.getElementById('backToSetupFromWriting'), writingTopic = document.getElementById('writingTopic'), writingInput = document.getElementById('writingInput'), wordCount = document.getElementById('wordCount'), getFeedbackButton = document.getElementById('getFeedbackButton'), writingFeedbackContainer = document.getElementById('writingFeedbackContainer');
const reinforceModal = document.getElementById('reinforceModal'), reinforceTitle = document.getElementById('reinforceTitle'), reinforceContent = document.getElementById('reinforceContent'), closeReinforceModal = document.getElementById('closeReinforceModal');
const quickStartButton = document.getElementById('quickStartButton');
const autoAdvanceCheckbox = document.getElementById('autoAdvanceCheckbox');
const startPlacementTestButton = document.getElementById('startPlacementTestButton');
const placementResultContainer = document.getElementById('placementResultContainer');
const createPathButton = document.getElementById('createPathButton');
const backToSetupFromPlacement = document.getElementById('backToSetupFromPlacement');
const placementTestContainer = document.getElementById('placementTestContainer');
const learningPathCTA = document.getElementById('learningPathCTA');
const continuePathButton = document.getElementById('continuePathButton');
const goalOptionsContainer = document.getElementById('goalOptionsContainer');
const learningPathContainer = document.getElementById('learningPathContainer');
const backToSetupFromPath = document.getElementById('backToPathFromPath'), reinforcementReviewList = document.getElementById('reinforcementReviewList');
const backToPathFromReinforcement = document.getElementById('backToPathFromReinforcement');
const retryPathStepFromReinforcement = document.getElementById('retryPathStepFromReinforcement');
const assessmentChoiceView = document.getElementById('assessment-choice-view');
const startTraditionalTestButton = document.getElementById('startTraditionalTestButton');
const startDiagnosticConversationButton = document.getElementById('startDiagnosticConversationButton');
const backToSetupFromChoice = document.getElementById('backToSetupFromChoice');
const conversationLog = document.getElementById('conversationLog');
const conversationInputArea = document.getElementById('conversationInputArea');
const micButton = document.getElementById('micButton');
const conversationTextInput = document.getElementById('conversationTextInput');
const sendTextButton = document.getElementById('sendTextButton');
const endDiagnosticConversationButton = document.getElementById('endDiagnosticConversationButton');
const diagnosticChartContainer = document.getElementById('diagnosticChartContainer');
const diagnosticChartCanvas = document.getElementById('diagnosticChart');
const customTopicContainer = document.getElementById('customTopicContainer');
const customTopicInput = document.getElementById('customTopicInput');
// NEW/UPDATED: Word Info Modal Elements
const wordInfoModal = document.getElementById('wordInfoModal');
const wordInfoTitle = document.getElementById('wordInfoTitle');
const wordInfoSpeakBtn = document.getElementById('wordInfoSpeakBtn');
const wordInfoContent = document.getElementById('wordInfoContent');
const saveWordFromInfoBtn = document.getElementById('saveWordFromInfoBtn');
const closeWordInfoModal = document.getElementById('closeWordInfoModal');


// App State
let quizData = {};
let currentQuestionIndex = 0;
let score = 0;
let userHistoryCache = []; 
let sessionResults = [];
let reviewCameFrom = 'result-view'; 
let matchingState = { selectedWordEl: null, correctPairs: 0 };
let autoAdvanceTimer = null;
let currentQuizType = 'standard'; // 'standard', 'placement', 'path', 'diagnostic'
let currentUserPath = null;
let diagnosticConversationState = {};
let recognition;
let chartInstance;
let notebookWords = new Set(); // NEW: To track all saved words for highlighting

// --- Audio State & Setup ---
const synth = window.speechSynthesis;
let audioState = 'idle'; 
let lastSpokenCharIndex = 0;
let isPausedByUser = false;
let soundEffects;

function setupAudio() {
    if (soundEffects || typeof Tone === 'undefined') return;
    soundEffects = {
        correct: new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 } }).toDestination(),
        incorrect: new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.4 } }).toDestination(),
        click: new Tone.MembraneSynth({ pitchDecay: 0.008, octaves: 2, envelope: { attack: 0.0006, decay: 0.2, sustain: 0 } }).toDestination()
    };
}
document.body.addEventListener('click', setupAudio, { once: true });

function playSound(type) {
    if (!soundEffects) return;
    try {
        if (Tone.context.state !== 'running') { Tone.context.resume(); }
        switch(type) {
            case 'correct': soundEffects.correct.triggerAttackRelease("C5", "8n"); break;
            case 'incorrect': soundEffects.incorrect.triggerAttackRelease("C3", "8n"); break;
            case 'click': soundEffects.click.triggerAttackRelease("C2", "8n", Tone.now()); break;
        }
    } catch (e) { console.error("Sound effect error:", e); }
}

// --- Core Functions ---
function showView(viewId) { 
    if (synth.speaking) { synth.cancel(); }
    clearTimeout(autoAdvanceTimer);
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active')); 
    document.getElementById(viewId).classList.add('active'); 
}

function showError(msg) { 
    errorMessage.textContent = msg; 
    showView('error-view'); 
}

// --- Improved Modal Functions ---
function showModal(modalElement) {
    playSound('click');
    modalElement.classList.add('active');
}

function hideModal(modalElement) {
    modalElement.classList.remove('active');
}

function showConfirmModal(message, onConfirm) {
    confirmMessage.textContent = message;
    showModal(confirmModal);

    const handleConfirm = () => {
        playSound('click');
        onConfirm();
        hideModal(confirmModal);
        confirmOkBtn.removeEventListener('click', handleConfirm);
        confirmCancelBtn.removeEventListener('click', hideConfirmModal);
    };

    confirmCancelBtn.addEventListener('click', () => hideModal(confirmModal), { once: true });
    confirmOkBtn.addEventListener('click', handleConfirm, { once: true });
}

// --- Auth & User State ---
async function fetchUserNotebook() {
    if (!auth.currentUser) return;
    const notebookRef = collection(db, "users", auth.currentUser.uid, "vocabulary");
    const querySnapshot = await getDocs(query(notebookRef));
    notebookWords = new Set(querySnapshot.docs.map(doc => doc.data().word.toLowerCase()));
}

onAuthStateChanged(auth, async (user) => {
    if (user) { 
        welcomeMessage.textContent = `Chào mừng, ${user.email}!`; 
        await updateUserStreak(user.uid); 
        await checkUserLearningPath(user.uid);
        await fetchUserNotebook(); // Fetch notebook on login
        showView('setup-view'); 
    } else { 
        showView('auth-view'); 
        userHistoryCache = []; 
        currentUserPath = null;
        notebookWords.clear();
    }
});

// Other auth functions remain the same...
async function checkUserLearningPath(userId) {
    const pathRef = doc(db, "learningPaths", userId);
    const docSnap = await getDoc(pathRef);
    if (docSnap.exists() && docSnap.data().status === 'active') {
        currentUserPath = { id: docSnap.id, ...docSnap.data() };
        placementTestContainer.classList.add('hidden');
        learningPathCTA.classList.remove('hidden');
    } else {
        currentUserPath = null;
        placementTestContainer.classList.remove('hidden');
        learningPathCTA.classList.add('hidden');
    }
}

async function updateUserStreak(userId) {
    const userRef = doc(db, "users", userId);
    const today = new Date().toISOString().slice(0, 10);
    try {
        const userDoc = await getDoc(userRef);
        let currentStreak = 0; let lastActivityDate = '';
        if (userDoc.exists()) { const userData = userDoc.data(); currentStreak = userData.currentStreak || 0; lastActivityDate = userData.lastActivityDate || ''; }
        if (lastActivityDate === today) { streakCount.textContent = currentStreak; return; }
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        if (lastActivityDate === yesterdayStr) { currentStreak++; } else { currentStreak = 1; }
        await setDoc(userRef, { lastActivityDate: today, currentStreak: currentStreak }, { merge: true });
        streakCount.textContent = currentStreak;
    } catch (error) { console.error("Error updating streak:", error); }
}

const handleAuthAction = async (action) => {
    playSound('click');
    const email = emailInput.value;
    const password = passwordInput.value; 
    authError.textContent = '';
    if (!email || !password) { 
        authError.textContent = 'Vui lòng nhập đủ email và mật khẩu.'; 
        return; 
    }
    const button = action === 'login' ? loginButton : registerButton;
    const otherButton = action === 'login' ? registerButton : loginButton;
    const buttonText = button.querySelector('.btn-text');
    const spinner = button.querySelector('.spinner');
    
    buttonText.textContent = action === 'login' ? 'Đang đăng nhập...' : 'Đang đăng ký...';
    spinner.classList.remove('hidden'); 
    button.disabled = true; 
    otherButton.disabled = true;
    
    try {
        if (action === 'login') { 
            await signInWithEmailAndPassword(auth, email, password); 
        } else {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "users", userCredential.user.uid), { 
                email: userCredential.user.email, 
                createdAt: serverTimestamp(), 
                currentStreak: 0, 
                lastActivityDate: '' 
            });
        }
    } catch (error) { 
        authError.textContent = getFriendlyAuthError(error.code); 
    } finally {
        buttonText.textContent = action === 'login' ? 'Đăng nhập' : 'Đăng ký';
        spinner.classList.add('hidden'); 
        button.disabled = false; 
        otherButton.disabled = false;
    }
};

const handleLogout = async () => { 
    playSound('click');
    try { 
        await signOut(auth); 
    } catch (error) { 
        showError("Đăng xuất thất bại."); 
    }
};

function getFriendlyAuthError(c) { 
    switch (c) { 
        case 'auth/invalid-email': return 'Email không hợp lệ.'; 
        case 'auth/user-not-found': 
        case 'auth/wrong-password': return 'Email hoặc mật khẩu không đúng.'; 
        case 'auth/email-already-in-use': return 'Email đã được sử dụng.'; 
        case 'auth/weak-password': return 'Mật khẩu quá yếu.'; 
        default: return 'Lỗi xác thực.'; 
    } 
}

// --- AI & Quiz Generation ---
async function getTranslation(text) {
    try {
        const prompt = `Translate the following English text to Vietnamese. Provide only the Vietnamese translation, without any extra text or quotation marks: "${text}"`;
        const result = await fastModel.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) { console.error("Translation error:", error); return "Không thể dịch được."; }
}

function showTranslationModal(textPromise) {
    showModal(translationModal);
    translationResult.innerHTML = '<div class="spinner mx-auto"></div>';
    textPromise.then(translatedText => { translationResult.innerHTML = `<p class="text-lg">${translatedText}</p>`; });
}
        
// --- NEW: Word Lookup & Rendering ---
function renderTextWithClickableWords(container, text) {
    container.innerHTML = '';
    const words = text.split(/(\s+|[.,?!;:()])/); // Split by spaces and punctuation
    words.forEach(word => {
        const cleanedWord = word.trim().toLowerCase().replace(/[^a-z'-]/g, '');
        if (cleanedWord.length > 1) { // Only make actual words clickable
            const span = document.createElement('span');
            span.textContent = word;
            span.className = 'lookup-word';
            if (notebookWords.has(cleanedWord)) {
                span.classList.add('saved-word-highlight');
            }
            container.appendChild(span);
        } else {
            container.appendChild(document.createTextNode(word));
        }
    });
}

// UPDATED FUNCTION
async function showWordInfo(word) {
    const cleanedWord = word.trim().toLowerCase().replace(/[^a-z'-]/g, '');
    if (!cleanedWord) return;

    showModal(wordInfoModal);
    wordInfoTitle.textContent = cleanedWord;
    wordInfoContent.innerHTML = '<div class="spinner mx-auto"></div>';
    saveWordFromInfoBtn.disabled = true;
    wordInfoSpeakBtn.onclick = () => playSpeech(cleanedWord);


    const isSaved = notebookWords.has(cleanedWord);
    if (isSaved) {
        saveWordFromInfoBtn.textContent = 'Đã lưu trong sổ tay';
    } else {
        saveWordFromInfoBtn.textContent = 'Lưu vào sổ tay';
        saveWordFromInfoBtn.disabled = false;
    }

    try {
        // Gọi hàm từ quizGenerator.js
        const wordInfo = await fetchWordInfoFromAI(cleanedWord, fastModel);

        wordInfoContent.innerHTML = `
            <p class="text-lg text-slate-500">${wordInfo.ipa}</p>
            <p><b class="font-semibold text-slate-700">Nghĩa:</b> ${wordInfo.definition}</p>
            <p class="mt-2"><b class="font-semibold text-slate-700">Ví dụ:</b> <i class="text-slate-600">"${wordInfo.example}"</i></p>
        `;
        
        // Re-enable save button if not already saved
        if (!isSaved) {
            saveWordFromInfoBtn.onclick = () => {
                saveWordToNotebook(cleanedWord, wordInfo.definition, wordInfo.example, wordInfo.ipa);
                saveWordFromInfoBtn.textContent = 'Đã lưu thành công!';
                saveWordFromInfoBtn.disabled = true;
                notebookWords.add(cleanedWord);
                // Highlight the word in the UI
                document.querySelectorAll('.lookup-word').forEach(span => {
                    if (span.textContent.trim().toLowerCase().replace(/[^a-z'-]/g, '') === cleanedWord) {
                        span.classList.add('saved-word-highlight');
                    }
                });
            };
        }

    } catch (error) {
        console.error("Lỗi tra cứu từ:", error);
        wordInfoContent.innerHTML = `<p class="text-red-500">Rất tiếc, không thể tra cứu từ này vào lúc này. Vui lòng thử lại sau.</p>`;
    }
}


// --- Quiz & Writing Lifecycle ---
async function startPractice() {
    playSound('click');
    const quizType = quizTypeSelect.value;
    if (quizType === 'writing') {
        await startWritingPractice();
    } else {
        await startQuiz();
    }
}

async function quickStartPractice() {
    playSound('click');
    const quickStartSettings = {
        type: 'vocabulary',
        topic: 'Daily Life',
        level: levelSelect.value,
        count: 5,
        isRetry: false
    };
    await startQuiz(quickStartSettings);
}

async function startWritingPractice(settings = null) {
    currentQuizType = settings ? 'path' : 'standard';
    const level = settings ? settings.level : levelSelect.value;
    let topic;
    if (settings) {
        topic = settings.topic;
    } else {
        if (topicSelect.value === 'custom') {
            topic = customTopicInput.value.trim();
            if (!topic) {
                alert("Vui lòng nhập chủ đề tùy chỉnh của bạn.");
                return;
            }
        } else {
            topic = topicSelect.value;
        }
    }
    
    quizData = { topic, level, quizType: 'writing' };

    showView('loading-view');
    loadingTitle.textContent = 'Đang tạo chủ đề...';
    loadingMessage.textContent = `AI đang nghĩ ra một chủ đề Luyện Viết thú vị về "${topic}" cho bạn.`;
    try {
        // Gọi hàm từ quizGenerator.js để lấy chủ đề viết
        const topicText = await generateQuizContent({ quizType: 'writing_topic', level, topic }, model);

        writingTopic.textContent = topicText;
        writingInput.value = '';
        wordCount.textContent = '0 từ';
        writingFeedbackContainer.classList.add('hidden');
        writingFeedbackContainer.innerHTML = '';
        getFeedbackButton.disabled = false;
        writingInput.disabled = false;
        
        showView('writing-view');
    } catch (error) {
        showError(`Không thể tạo chủ đề luyện viết. Lỗi: ${error.message}.`);
    }
}

async function getWritingFeedback() {
    playSound('click');
    const userText = writingInput.value;
    if (userText.trim().split(/\s+/).length < 10) {
        alert("Vui lòng viết ít nhất 10 từ để nhận được phản hồi chất lượng.");
        return;
    }

    const button = getFeedbackButton;
    const buttonText = button.querySelector('.btn-text');
    const spinner = button.querySelector('.spinner');
    
    buttonText.textContent = 'AI đang phân tích...';
    spinner.classList.remove('hidden'); 
    button.disabled = true; 
    writingInput.disabled = true;

    try {
        // Gọi hàm từ quizGenerator.js để lấy phản hồi bài viết
        const feedbackData = await getWritingFeedback(quizData.level, quizData.topic, userText, model);

        displayWritingFeedback(feedbackData);
        writingFeedbackContainer.classList.remove('hidden');

        if (auth.currentUser) {
            if (currentQuizType === 'path') {
                await handlePathStepCompletion(feedbackData.score, 100);
            } else {
                 await saveWritingResult(userText, feedbackData);
            }
        }

    } catch (error) {
        showError(`Không thể nhận phản hồi. Lỗi: ${error.message}.`);
    } finally {
        buttonText.textContent = 'Nhận phản hồi từ AI';
        spinner.classList.add('hidden'); 
    }
}

function displayWritingFeedback(data) {
    writingFeedbackContainer.innerHTML = `
        <div class="bg-sky-100 border-2 border-sky-300 rounded-xl p-6 text-center">
            <p class="text-2xl font-semibold mb-2">Điểm của bạn</p>
            <p class="text-6xl font-bold text-sky-600">${data.score} / 100</p>
        </div>
        <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 class="text-lg font-bold text-slate-800 mb-2">Nhận xét chung</h4>
            <p class="text-slate-700">${data.overallFeedback}</p>
        </div>
        <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 class="text-lg font-bold text-slate-800 mb-2">Bài viết đã sửa</h4>
            <p class="text-lg leading-relaxed">${data.correctedTextHTML}</p>
        </div>
        <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 class="text-lg font-bold text-slate-800 mb-3">Phân tích chi tiết</h4>
            <div class="space-y-3">
                ${data.detailedFeedback.map(item => `
                    <div class="p-3 rounded-md bg-white border">
                        <p class="font-semibold text-slate-700"><span class="text-sm font-bold py-0.5 px-2 rounded-full bg-${getFeedbackColor(item.type)}-200 text-${getFeedbackColor(item.type)}-800">${item.type}</span></p>
                        <p class="text-red-600 mt-2">Lỗi: <span class="font-mono bg-red-100 p-1 rounded text-sm">"${item.mistake}"</span></p>
                        <p class="text-green-600">Sửa thành: <span class="font-mono bg-green-100 p-1 rounded text-sm">"${item.correction}"</span></p>
                        <p class="text-slate-600 mt-2 text-sm"><i>${item.explanation}</i></p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function getFeedbackColor(type) {
    switch(type.toLowerCase()) {
        case 'grammar': return 'sky';
        case 'spelling': return 'amber';
        case 'punctuation': return 'violet';
        case 'vocabulary choice': return 'emerald';
        case 'style': return 'rose';
        default: return 'slate';
    }
}

// --- Learning Path & Quiz Lifecycle ---
async function startPlacementTest() {
    currentQuizType = 'placement';
    sessionResults = []; 
    quizData = { topic: "Placement Test", level: "Mixed", quizType: "placement", count: 12 };
    loadingTitle.textContent = 'Đang tạo bài kiểm tra...';
    loadingMessage.textContent = `AI đang chuẩn bị Bài kiểm tra trình độ cho bạn.`;
    showView('loading-view');
    try {
        // Gọi hàm từ quizGenerator.js
        quizData.raw = await generateQuizContent(quizData, model);
        
        currentQuestionIndex = 0; score = 0;
        
        renderQuiz();
        showView('quiz-view');
    } catch (error) {
        showError(`Không thể tạo bài kiểm tra trình độ. Lỗi: ${error.message}.`);
    }
}

async function startQuiz(settings = null) {
    if (!settings) currentQuizType = 'standard';
    sessionResults = [];
    const quizType = settings ? settings.type : quizTypeSelect.value;
    const vocabMode = vocabModeSelect.value;
    const level = settings ? settings.level : levelSelect.value;
    const count = settings ? (settings.count || 5) : questionCountSelect.value;

    let topic;
    if (settings) {
        topic = settings.topic;
    } else {
        const isTopicBased = quizType === 'vocabulary' || quizType === 'reading' || quizType === 'listening' || quizType === 'writing';
        if (isTopicBased) {
            if (topicSelect.value === 'custom') {
                topic = customTopicInput.value.trim();
                if (!topic) {
                    alert("Vui lòng nhập chủ đề tùy chỉnh của bạn.");
                    return;
                }
            } else {
                topic = topicSelect.value;
            }
        } else {
            topic = 'General';
        }
    }
    
    quizData = { topic, level, quizType, vocabMode, count };
    loadingTitle.textContent = 'Đang tạo bài kiểm tra...';
    loadingMessage.textContent = `AI đang chuẩn bị các câu hỏi về chủ đề ${topic} cho bạn. Vui lòng chờ!`;
    showView('loading-view');
    try {
        // Gọi hàm từ quizGenerator.js để tạo nội dung quiz
        quizData.raw = await generateQuizContent(quizData, model);
        
        currentQuestionIndex = 0; score = 0;
        
        if (currentQuizType === 'standard' && !settings?.isRetry) { saveQuizToLibrary(quizData); }

        renderQuiz();
        showView('quiz-view');
    } catch (error) {
        showError(`Không thể tạo bài kiểm tra. Lỗi: ${error.message}.`);
    }
}

function renderQuiz() {
    const isReading = quizData.quizType === 'reading' || (currentQuizType === 'placement' && quizData.raw.passage);
    const isListening = quizData.quizType === 'listening';
    const questions = quizData.raw.questions || (Array.isArray(quizData.raw) ? quizData.raw : []);
    const total = questions.length;
    
    if (currentQuizType === 'placement') {
        quizTitle.textContent = "Bài kiểm tra trình độ";
        quizSubtitle.textContent = "Hoàn thành tất cả câu hỏi để xác định năng lực của bạn.";
    } else if (currentQuizType === 'path') {
        const step = currentUserPath.path[currentUserPath.currentStep];
        quizTitle.textContent = `Lộ trình: ${step.description}`;
        quizSubtitle.textContent = `Bước ${currentUserPath.currentStep + 1} / ${currentUserPath.path.length}`;
    }
    else {
        const typeMap = { vocabulary: 'Luyện tập Từ vựng', reading: 'Luyện tập Đọc hiểu', grammar: 'Luyện tập Ngữ pháp', listening: 'Luyện tập Nghe hiểu', writing: 'Luyện Viết' };
        const modeMap = { multiple_choice: 'Trắc nghiệm', fill_in_the_blank: 'Điền từ', word_formation: 'Dạng của từ', word_scramble: 'Sắp xếp chữ cái', matching: 'Nối từ', flashcard: 'Flashcards' };
        quizTitle.textContent = typeMap[quizData.quizType];
        let subtitleParts = [];
        if (quizData.quizType === 'vocabulary') { subtitleParts.push(modeMap[quizData.vocabMode]); }
        if (quizData.quizType !== 'grammar') { subtitleParts.push(`Chủ đề: ${quizData.topic}`); }
        subtitleParts.push(`Trình độ: ${quizData.level.toUpperCase()}`);
        quizSubtitle.textContent = subtitleParts.join(' - ');
    }
    
    scoreEl.style.display = quizData.vocabMode === 'flashcard' ? 'none' : 'block';
    progress.textContent = `Câu ${currentQuestionIndex + 1} / ${total}`;
    progressBar.style.width = `${((currentQuestionIndex + 1) / total) * 100}%`;
    
    passageContainer.classList.toggle('hidden', !isReading);
    if (isReading) renderTextWithClickableWords(passageText, quizData.raw.passage);
    audioPlayerContainer.classList.toggle('hidden', !isListening);
    transcriptControls.classList.toggle('hidden', !isListening);
    transcriptContainer.classList.add('hidden'); 
    if (isListening) setupAudioPlayer();
    renderQuestion();
}

function renderQuestion() {
    feedbackContainer.innerHTML = '';
    feedbackContainer.className = 'mt-6 p-4 rounded-lg min-h-[100px]';
    nextQuestionButton.classList.add('hidden');
    const questions = quizData.raw.questions || (Array.isArray(quizData.raw) ? quizData.raw : []);
    const currentQuestion = questions[currentQuestionIndex];
    
    optionsContainer.innerHTML = '';
    translateQuestionBtn.style.display = 'inline-block';

    const questionType = currentQuestion.type || 'multiple_choice';

    switch (questionType) {
        case 'flashcard':
            translateQuestionBtn.style.display = 'none';
            questionText.textContent = 'Nhấn vào thẻ để lật và xem nghĩa.';
            optionsContainer.className = 'flex flex-col items-center gap-4';
            
            const cardContainer = document.createElement('div');
            cardContainer.className = 'flashcard-container w-full';
            const card = document.createElement('div');
            card.className = 'flashcard';
            card.onclick = () => card.classList.toggle('flipped');

            const front = document.createElement('div');
            front.className = 'flashcard-face flashcard-front';
            front.innerHTML = `
                <div>
                    <div class="flex items-center justify-center">
                        <h3 class="text-4xl font-bold">${currentQuestion.word}</h3>
                        <button class="speak-btn ml-3" onclick="event.stopPropagation(); window.playSpeech('${currentQuestion.word}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-sky-600 hover:text-sky-800"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                        </button>
                    </div>
                    <p class="text-xl text-slate-500 mt-2">${currentQuestion.ipa || ''}</p>
                </div>
            `;

            const back = document.createElement('div');
            back.className = 'flashcard-face flashcard-back';
            back.innerHTML = `
                <h4 class="text-3xl font-semibold">${currentQuestion.meaning}</h4>
                <p class="mt-4 text-lg italic">"${currentQuestion.example}"</p>
            `;
            
            card.appendChild(front);
            card.appendChild(back);
            cardContainer.appendChild(card);
            optionsContainer.appendChild(cardContainer);
            
            handleAnswer(null, true); 
            break;

        case 'matching':
            translateQuestionBtn.style.display = 'none';
            renderTextWithClickableWords(questionText, 'Nối từ tiếng Anh với nghĩa tương ứng.');
            optionsContainer.className = 'grid grid-cols-2 gap-4';

            const wordsCol = document.createElement('div');
            wordsCol.className = 'space-y-3';
            const meaningsCol = document.createElement('div');
            meaningsCol.className = 'space-y-3';

            const pairs = currentQuestion.pairs;
             if (!Array.isArray(pairs)) {
                showError("Lỗi câu hỏi nối từ: Dữ liệu không hợp lệ.");
                return;
            }
            const shuffledMeanings = [...pairs].sort(() => Math.random() - 0.5);
            
            matchingState.correctPairs = 0;

            pairs.forEach(pair => {
                const wordEl = document.createElement('div');
                wordEl.className = 'matching-item p-3 border-2 rounded-lg text-center';
                wordEl.textContent = pair.word;
                wordEl.dataset.word = pair.word;
                wordEl.onclick = () => handleMatchingSelection(wordEl, 'word');
                wordsCol.appendChild(wordEl);
            });

            shuffledMeanings.forEach(pair => {
                const meaningEl = document.createElement('div');
                meaningEl.className = 'matching-item p-3 border-2 rounded-lg text-center';
                meaningEl.textContent = pair.meaning;
                meaningEl.dataset.word = pair.word;
                meaningEl.onclick = () => handleMatchingSelection(meaningEl, 'meaning');
                meaningsCol.appendChild(meaningEl);
            });
            
            optionsContainer.appendChild(wordsCol);
            optionsContainer.appendChild(meaningsCol);
            break;

        case 'word_scramble':
            translateQuestionBtn.style.display = 'none'; 
            renderTextWithClickableWords(questionText, currentQuestion.clue);
            optionsContainer.className = 'flex flex-col items-center gap-4';
            
            const scrambleContainer = document.createElement('div');
            scrambleContainer.className = 'flex justify-center gap-2 my-4 flex-wrap';
            
            // Sử dụng hàm scrambleWord từ quizGenerator.js
            const scrambled = scrambleWord(currentQuestion.answer);
            scrambled.split('').forEach(char => {
                const letterBox = document.createElement('div');
                letterBox.className = 'w-12 h-12 bg-sky-100 border-2 border-sky-300 rounded-lg flex items-center justify-center text-2xl font-bold text-sky-800 uppercase';
                letterBox.textContent = char;
                scrambleContainer.appendChild(letterBox);
            });
            optionsContainer.appendChild(scrambleContainer);
            
            const textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.className = 'w-full md:w-3/4 p-3 border border-slate-400 rounded-lg text-lg text-center focus:ring-2 focus:ring-sky-500 tracking-widest';
            textInput.placeholder = 'Nhập đáp án của bạn';
            textInput.onkeydown = (e) => { if (e.key === 'Enter') checkBtn.click(); };
            
            const checkBtn = document.createElement('button');
            checkBtn.textContent = 'Kiểm tra';
            checkBtn.className = 'w-full md:w-3/4 bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-lg text-lg';
            checkBtn.onclick = () => {
                handleAnswer(textInput.value);
                textInput.disabled = true;
                checkBtn.disabled = true;
                checkBtn.classList.add('opacity-70');
            };
            
            optionsContainer.appendChild(textInput);
            optionsContainer.appendChild(checkBtn);
            break;

        case 'multiple_choice':
            renderTextWithClickableWords(questionText, currentQuestion.question);
            optionsContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
            const shuffledOptions = [...currentQuestion.options].sort(() => Math.random() - 0.5);
            shuffledOptions.forEach(option => {
                const button = document.createElement('button');
                button.className = "option-btn w-full text-left p-4 border-2 border-slate-300 rounded-lg hover:bg-slate-100 hover:border-sky-400 transition text-lg flex items-center justify-between";
                const optionText = document.createElement('span');
                renderTextWithClickableWords(optionText, option); // Make words in options clickable
                button.appendChild(optionText);
                button.onclick = () => handleAnswer(option);
                if (quizData.quizType === 'listening') { button.disabled = true; button.classList.add('opacity-50', 'cursor-not-allowed'); }
                optionsContainer.appendChild(button);
            });
            break;

        case 'fill_in_the_blank':
        case 'word_formation':
            renderTextWithClickableWords(questionText, currentQuestion.question);
            optionsContainer.className = 'flex flex-col items-center gap-4';
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'w-full md:w-3/4 p-3 border border-slate-400 rounded-lg text-lg text-center focus:ring-2 focus:ring-sky-500';
            input.placeholder = 'Nhập câu trả lời của bạn...';
            input.onkeydown = (e) => { if (e.key === 'Enter') checkAnswerBtn.click(); };
            
            const checkAnswerBtn = document.createElement('button');
            checkAnswerBtn.textContent = 'Kiểm tra';
            checkAnswerBtn.className = 'w-full md:w-3/4 bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-lg text-lg';
            checkAnswerBtn.onclick = () => {
                handleAnswer(input.value);
                input.disabled = true;
                checkAnswerBtn.disabled = true;
                checkAnswerBtn.classList.add('opacity-70');
            };
            optionsContainer.appendChild(input);
            optionsContainer.appendChild(checkAnswerBtn);
            break;
    }
}

function handleMatchingSelection(selectedEl, type) {
    if (selectedEl.classList.contains('correct')) return;

    if (type === 'word') {
        if (matchingState.selectedWordEl) {
            matchingState.selectedWordEl.classList.remove('selected');
        }
        matchingState.selectedWordEl = selectedEl;
        selectedEl.classList.add('selected');
    } 
    else if (type === 'meaning' && matchingState.selectedWordEl) {
        const wordData = matchingState.selectedWordEl.dataset.word;
        const meaningData = selectedEl.dataset.word;

        if (wordData === meaningData) {
            playSound('correct');
            matchingState.selectedWordEl.className = 'matching-item p-3 border-2 rounded-lg text-center correct';
            selectedEl.className = 'matching-item p-3 border-2 rounded-lg text-center correct';
            matchingState.selectedWordEl = null;
            matchingState.correctPairs++;
            
            const totalPairs = quizData.raw[currentQuestionIndex].pairs.length;
            if (matchingState.correctPairs === totalPairs) {
                handleAnswer(true);
            }
        } else {
            playSound('incorrect');
            const wordEl = matchingState.selectedWordEl;
            wordEl.classList.add('incorrect');
            selectedEl.classList.add('incorrect');
            matchingState.selectedWordEl = null;

            setTimeout(() => {
                wordEl.classList.remove('incorrect', 'selected');
                selectedEl.classList.remove('incorrect');
            }, 400);
        }
    }
}


function handleAnswer(selectedOption, isFlashcard = false) {
    clearTimeout(autoAdvanceTimer);
    if (isFlashcard) {
        if (autoAdvanceCheckbox.checked) {
            autoAdvanceTimer = setTimeout(moveToNextQuestion, 3000);
        } else {
            nextQuestionButton.classList.remove('hidden');
        }
        return;
    }

    const questions = quizData.raw.questions || (Array.isArray(quizData.raw) ? quizData.raw : []);
    const currentQuestion = questions[currentQuestionIndex];
    const questionType = currentQuestion.type || 'multiple_choice';
    
    let isCorrect;

    if (questionType === 'matching') {
        isCorrect = true; 
        score++;
        feedbackContainer.className = 'mt-6 p-4 rounded-lg bg-green-100 text-green-800';
        feedbackContainer.innerHTML = `<b class="font-bold">Chính xác!</b><p>Bạn đã nối đúng tất cả các cặp.</p>`;
    } else if (questionType === 'multiple_choice') {
        isCorrect = selectedOption === currentQuestion.answer;
        Array.from(optionsContainer.children).forEach(button => {
            button.disabled = true; button.classList.add('opacity-70');
            if (button.querySelector('span').textContent === currentQuestion.answer) {
                button.className = "option-btn correct w-full text-left p-4 border-2 border-green-500 bg-green-100 rounded-lg text-lg flex items-center justify-between font-semibold";
            } else if (button.querySelector('span').textContent === selectedOption) {
                button.className = "option-btn incorrect w-full text-left p-4 border-2 border-red-500 bg-red-100 rounded-lg text-lg flex items-center justify-between";
            }
        });
    } else {
        isCorrect = selectedOption.trim().toLowerCase() === currentQuestion.answer.toLowerCase();
    }

    if (questionType !== 'matching') {
         if (isCorrect) {
            playSound('correct');
            score++;
            feedbackContainer.className = 'mt-6 p-4 rounded-lg bg-green-100 text-green-800';
            let feedbackHTML = `<b class="font-bold">Chính xác!</b>`;
            if(currentQuestion.explanation && currentQuizType === 'standard') { feedbackHTML += `<p>${currentQuestion.explanation}</p>`; }
            feedbackContainer.innerHTML = feedbackHTML;
        } else {
            playSound('incorrect');
            feedbackContainer.className = 'mt-6 p-4 rounded-lg bg-red-100 text-red-800';
            const displayAnswer = `Đáp án đúng là <b>"${currentQuestion.answer}"</b>.`;
            let feedbackHTML = `<b class="font-bold">Chưa đúng.</b> ${displayAnswer}`;
            if(currentQuestion.explanation && currentQuizType === 'standard') { feedbackHTML += `<p>${currentQuestion.explanation}</p>`; }
            feedbackContainer.innerHTML = feedbackHTML;

            if (currentQuizType === 'standard') {
                const reinforceBtn = document.createElement('button');
                reinforceBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline-block mr-2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
                    Củng cố kiến thức
                `;
                reinforceBtn.className = 'mt-4 w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-bold py-2 px-4 rounded-lg text-md transition';
                reinforceBtn.onclick = () => requestReinforcement(currentQuestion, selectedOption);
                feedbackContainer.appendChild(reinforceBtn);
            }
        }
    }
    
    scoreEl.textContent = `Điểm: ${score}`;
    
    if (autoAdvanceCheckbox.checked && currentQuizType === 'standard') {
        autoAdvanceTimer = setTimeout(moveToNextQuestion, 3000);
    } else {
        nextQuestionButton.classList.remove('hidden');
    }

    sessionResults.push({
        question: currentQuestion,
        userAnswer: selectedOption,
        isCorrect: isCorrect
    });
}

async function requestReinforcement(question, userAnswer) {
    showModal(reinforceModal);
    reinforceContent.innerHTML = '<div class="spinner mx-auto"></div>';
    reinforceTitle.textContent = "Bài học từ AI";

    try {
        // Gọi hàm từ quizGenerator.js để lấy bài học củng cố
        const lessonData = await getReinforcementLesson(question, userAnswer, quizData.level, model);

        displayReinforcement(lessonData);

    } catch (error) {
        reinforceContent.innerHTML = `<p class="text-center text-red-500">Rất tiếc, không thể tạo bài học ngay lúc này. Lỗi: ${error.message}</p>`;
    }
}

function displayReinforcement(data) {
    reinforceTitle.textContent = data.conceptTitle;
    reinforceContent.innerHTML = `
        <div class="bg-red-50 p-3 rounded-lg border border-red-200">
            <h4 class="text-md font-bold text-red-800 mb-1">Phân tích lỗi sai</h4>
            <div class="text-red-700 prose">${marked.parse(data.mistakeAnalysis)}</div>
        </div>
        <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <h4 class="text-md font-bold text-slate-800 mb-2">Giải thích khái niệm</h4>
            <div class="text-slate-700 space-y-2 prose">${marked.parse(data.conceptExplanation)}</div>
        </div>
        <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <h4 class="text-md font-bold text-slate-800 mb-2">Ví dụ minh họa</h4>
            <ul class="space-y-2">
                ${data.examples.map(ex => `
                    <li class="p-2 rounded-md bg-white">
                        <p class="font-semibold text-sky-700">"${ex.en}"</p>
                        <p class="text-xs text-slate-500 italic">→ ${ex.vi}</p>
                    </li>
                `).join('')}
            </ul>
        </div>
        <div class="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <h4 class="text-md font-bold text-amber-800 mb-1">💡 Mẹo ghi nhớ</h4>
            <div class="text-amber-700 prose">${marked.parse(data.practiceTip)}</div>
        </div>
    `;
}


function moveToNextQuestion() {
    currentQuestionIndex++;
    const questions = quizData.raw.questions || (Array.isArray(quizData.raw) ? quizData.raw : []);
    const total = questions.length;
    if (currentQuestionIndex < total) {
        renderQuiz();
    } else {
        if (currentQuizType === 'placement' || currentQuizType === 'diagnostic') {
            showPlacementResult();
        } else if (currentQuizType === 'path') {
            handlePathStepCompletion(score, total);
        } else {
            showResult();
        }
    }
}

async function showResult() {
    // Reset result view for standard quizzes
    playAgainButton.textContent = "Làm lại";
    playAgainButton.onclick = () => { playSound('click'); showView('setup-view'); };
    reviewAnswersButton.textContent = "Xem lại bài làm";
    reviewAnswersButton.onclick = () => { playSound('click'); showReviewPage(sessionResults, quizData.raw, 'result-view'); };
    reviewAnswersButton.classList.remove('hidden');
    viewHistoryFromResultButton.classList.remove('hidden');

    const questions = quizData.raw.questions || (Array.isArray(quizData.raw) ? quizData.raw : []);
    const total = questions.length;
    
    resultScoreContainer.style.display = quizData.vocabMode === 'flashcard' ? 'none' : 'block';
    reviewAnswersButton.style.display = quizData.vocabMode === 'flashcard' ? 'none' : 'block';
    
    if (quizData.vocabMode === 'flashcard') {
        resultMessage.textContent = `Tuyệt vời! Bạn đã ôn tập xong ${total} thẻ.`;
    } else {
        if (auth.currentUser) {
            await updateUserStreak(auth.currentUser.uid);
            try {
                const resultsCollectionRef = collection(db, "users", auth.currentUser.uid, "quizResults");
                const newResult = { 
                    level: quizData.level, type: quizData.quizType, score: score, totalQuestions: total, 
                    createdAt: serverTimestamp(), results: sessionResults, 
                    context: { passage: quizData.raw.passage || null, script: quizData.raw.script || null }
                };
                if (quizData.quizType !== 'grammar') { newResult.topic = quizData.topic; }
                if (quizData.quizType === 'vocabulary') { newResult.vocabMode = quizData.vocabMode; }
                await addDoc(resultsCollectionRef, newResult);
                userHistoryCache = []; 
            } catch (e) { console.error("Lỗi khi lưu kết quả: ", e); }
        }
        finalScore.textContent = `${score} / ${total}`;
        const percentage = (score / total) * 100;
        if (percentage === 100) resultMessage.textContent = "Tuyệt vời! Bạn đã trả lời đúng tất cả!";
        else if (percentage >= 70) resultMessage.textContent = "Làm tốt lắm! Kiến thức của bạn rất ổn.";
        else if (percentage >= 40) resultMessage.textContent = "Khá lắm! Tiếp tục luyện tập nhé.";
        else resultMessage.textContent = "Đừng nản lòng! Mỗi lần luyện tập là một bước tiến.";
    }
    showView('result-view');
}

async function showPlacementResult() {
    showView('placement-result-view');
    placementResultContainer.innerHTML = '<div class="spinner mx-auto"></div>';
    diagnosticChartContainer.classList.add('hidden');
    try {
        let analysisData;
        if(currentQuizType === 'diagnostic') {
            // Gọi hàm từ quizGenerator.js để lấy phân tích chẩn đoán
            analysisData = await getDiagnosticAnalysis(diagnosticConversationState.history, model);
            
            renderDiagnosticChart(analysisData.skillsProfile);
            diagnosticChartContainer.classList.remove('hidden');
        } else {
            // Gọi hàm từ quizGenerator.js để lấy phân tích trình độ
            analysisData = await getPlacementAnalysis(sessionResults, model);
        }

        placementResultContainer.innerHTML = `
            <div class="text-center mb-4">
                <p class="text-lg font-semibold text-indigo-800">Trình độ ước tính của bạn</p>
                <p class="text-6xl font-bold text-indigo-600">${analysisData.level || analysisData.overallLevel}</p>
            </div>
            <div>
                <h4 class="text-lg font-bold text-slate-800 mb-2">Phân tích từ AI</h4>
                <p class="text-slate-700 text-base">${analysisData.analysis}</p>
            </div>
        `;
        createPathButton.classList.remove('hidden');

        if (auth.currentUser) {
            const pathRef = doc(db, "learningPaths", auth.currentUser.uid);
            await setDoc(pathRef, {
                userId: auth.currentUser.uid,
                placementTestResult: {
                    level: analysisData.level || analysisData.overallLevel,
                    analysis: analysisData.analysis,
                    score: score,
                    totalQuestions: sessionResults.length,
                    completedAt: serverTimestamp(),
                    type: currentQuizType
                },
                status: 'pending_generation'
            }, { merge: true });
        }

    } catch (error) {
        placementResultContainer.innerHTML = `<p class="text-center text-red-500">Rất tiếc, không thể phân tích kết quả. Lỗi: ${error.message}</p>`;
    }
}

function renderDiagnosticChart(skillsProfile) {
    if (chartInstance) {
        chartInstance.destroy();
    }
    const ctx = diagnosticChartCanvas.getContext('2d');
    const data = {
        labels: ['Phát âm', 'Lưu loát', 'Nghe', 'Từ vựng', 'Ngữ pháp'],
        datasets: [{
            label: 'Điểm kỹ năng',
            data: [
                skillsProfile.pronunciation,
                skillsProfile.fluency,
                skillsProfile.listening,
                skillsProfile.vocabulary,
                skillsProfile.grammar
            ],
            fill: true,
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            borderColor: 'rgb(99, 102, 241)',
            pointBackgroundColor: 'rgb(99, 102, 241)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(99, 102, 241)'
        }]
    };
    const config = {
        type: 'radar',
        data: data,
        options: {
            elements: {
                line: {
                    borderWidth: 3
                }
            },
            scales: {
                r: {
                    angleLines: {
                        display: false
                    },
                    suggestedMin: 0,
                    suggestedMax: 100,
                    pointLabels: {
                        font: {
                            size: 14,
                            family: "'Be Vietnam Pro', sans-serif"
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    };
    chartInstance = new Chart(ctx, config);
}

// --- Learning Path Functions ---
function showGoalSetting() {
    goalOptionsContainer.innerHTML = '';
    const goals = [
        { key: 'travel', text: 'Giao tiếp khi đi du lịch', icon: '✈️' },
        { key: 'work', text: 'Phục vụ công việc', icon: '💼' },
        { key: 'certification', text: 'Luyện thi chứng chỉ', icon: '🎓' },
        { key: 'general', text: 'Cải thiện tổng quát', icon: '🧠' }
    ];

    goals.forEach(goal => {
        const button = document.createElement('button');
        button.className = 'p-6 border-2 border-slate-300 rounded-lg hover:bg-slate-100 hover:border-indigo-400 transition text-lg text-center';
        button.innerHTML = `<div class="text-4xl mb-2">${goal.icon}</div><span class="font-semibold">${goal.text}</span>`;
        button.onclick = () => handleGoalSelection(goal.text);
        goalOptionsContainer.appendChild(button);
    });

    showView('goal-setting-view');
}

async function handleGoalSelection(goal) {
    if (!auth.currentUser) return showError("Vui lòng đăng nhập để tạo lộ trình.");

    loadingTitle.textContent = 'AI đang xây dựng lộ trình...';
    loadingMessage.textContent = `Dựa trên kết quả và mục tiêu "${goal}" của bạn, AI đang tạo ra một kế hoạch học tập độc nhất.`;
    showView('loading-view');

    try {
        const pathRef = doc(db, "learningPaths", auth.currentUser.uid);
        const docSnap = await getDoc(pathRef);

        if (!docSnap.exists() || !docSnap.data().placementTestResult) {
            throw new Error("Không tìm thấy kết quả kiểm tra đầu vào.");
        }
        const placementResult = docSnap.data().placementTestResult;
        
        // Gọi hàm từ quizGenerator.js để lấy lộ trình học tập
        const pathData = await getLearningPath(placementResult, goal, model);

        await setDoc(pathRef, {
            goal: goal,
            path: pathData,
            currentStep: 0,
            status: 'active',
            generatedAt: serverTimestamp()
        }, { merge: true });
        
        await checkUserLearningPath(auth.currentUser.uid);
        showLearningPath();

    } catch (error) {
        showError(`Không thể tạo lộ trình. Lỗi: ${error.message}`);
    }
}

function showLearningPath() {
    if (!currentUserPath) {
        showError("Không tìm thấy lộ trình học tập.");
        return;
    }
    renderLearningPath(currentUserPath.path, currentUserPath.currentStep);
    showView('learning-path-view');
}

function renderLearningPath(path, currentStep) {
    learningPathContainer.innerHTML = '';
    const icons = {
        grammar: '📖', vocabulary: '🧠', reading: '📰',
        listening: '🎧', writing: '✍️', review: '🎯'
    };
    path.forEach((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isLocked = index > currentStep;

        const item = document.createElement('div');
        item.className = `p-4 rounded-lg border-2 flex items-center gap-4 transition-all duration-300 ${isCompleted ? 'bg-green-100 border-green-300 opacity-70' : ''} ${isActive ? 'bg-white border-teal-500 shadow-lg scale-105' : ''} ${isLocked ? 'bg-slate-100 border-slate-300 opacity-60' : ''}`;
        
        item.innerHTML = `
            <div class="text-4xl">${isLocked ? '🔒' : (icons[step.type] || '📚')}</div>
            <div>
                <p class="font-bold text-slate-800">${step.description}</p>
                <p class="text-sm text-slate-500 capitalize">${step.type} - ${step.topic} - Level ${step.level}</p>
            </div>
            ${isActive ? `<button class="start-step-btn ml-auto bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg">Bắt đầu</button>` : ''}
            ${isCompleted ? `<div class="ml-auto text-2xl text-green-500">✅</div>` : ''}
        `;
        learningPathContainer.appendChild(item);
    });
}

async function startPathStep() {
    if (!currentUserPath) return showError("Không tìm thấy lộ trình học tập.");
    
    const step = currentUserPath.path[currentUserPath.currentStep];
    if (!step) return showError("Lỗi: Không tìm thấy bước học hiện tại.");

    currentQuizType = 'path';
    sessionResults = [];
    score = 0;
    currentQuestionIndex = 0;

    const settings = {
        type: step.type,
        topic: step.topic,
        level: step.level,
        count: (step.type === 'review' || step.type === 'reading' || step.type === 'listening') ? 5 : 10,
        isRetry: true
    };
    
    if (step.type === 'writing') {
        startWritingPractice(settings);
    } else {
        startQuiz(settings);
    }
}

async function handlePathStepCompletion(achievedScore, totalScore) {
    if (!auth.currentUser || !currentUserPath) return;

    const step = currentUserPath.path[currentUserPath.currentStep];
    const percentage = totalScore > 0 ? (achievedScore / totalScore) * 100 : 0;
    const passingThreshold = 70; // 70% to pass

    showView('result-view');

    if (percentage >= passingThreshold) {
        // Passed the step
        const newStep = currentUserPath.currentStep + 1;
        const pathRef = doc(db, "learningPaths", auth.currentUser.uid);
        try {
            await updateDoc(pathRef, { currentStep: newStep });
            currentUserPath.currentStep = newStep;

            resultScoreContainer.innerHTML = `<p class="text-2xl font-semibold mb-2 text-teal-700">Hoàn thành bước!</p><p class="text-6xl font-bold text-teal-600">🎉</p>`;
            finalScore.textContent = `${achievedScore} / ${totalScore}`;
            resultMessage.textContent = "Làm tốt lắm! Bạn đã mở khóa bước tiếp theo trong lộ trình của mình.";

            playAgainButton.textContent = "Tiếp tục Lộ trình";
            playAgainButton.onclick = showLearningPath;

            // When passing, allow reviewing answers for quizzes, or feedback for writing
            if (step.type === 'writing') {
                reviewAnswersButton.textContent = "Xem lại Phản hồi";
                reviewAnswersButton.onclick = () => showView('writing-view');
            } else {
                reviewAnswersButton.textContent = "Xem lại Bài làm";
                reviewAnswersButton.onclick = () => showReviewPage(sessionResults, quizData.raw, 'result-view');
            }
            reviewAnswersButton.classList.remove('hidden');
            viewHistoryFromResultButton.classList.add('hidden');

        } catch (error) {
            showError("Không thể cập nhật tiến độ lộ trình. Lỗi: " + error.message);
        }
    } else {
        // Failed the step
        resultScoreContainer.innerHTML = `<p class="text-2xl font-semibold mb-2 text-orange-700">Chưa đạt!</p><p class="text-6xl font-bold text-orange-600">💪</p>`;
        finalScore.textContent = `${achievedScore} / ${totalScore}`;
        resultMessage.textContent = `Bạn cần đạt ít nhất ${passingThreshold}% để qua bước này. Hãy cố gắng ôn tập và làm lại nhé!`;

        playAgainButton.textContent = "Thử lại ngay";
        playAgainButton.onclick = startPathStep;

        // If failed a writing step, review the feedback. If failed a quiz, go to reinforcement.
        if (step.type === 'writing') {
            reviewAnswersButton.textContent = "Xem lại Phản hồi";
            reviewAnswersButton.onclick = () => showView('writing-view');
        } else {
            reviewAnswersButton.textContent = "Xem lại & Ôn tập";
            reviewAnswersButton.onclick = showReinforcementView;
        }
        reviewAnswersButton.classList.remove('hidden');
        viewHistoryFromResultButton.classList.add('hidden');
    }
}

function showReinforcementView() {
    reinforcementReviewList.innerHTML = '';
    const incorrectAnswers = sessionResults.filter(r => !r.isCorrect);

    if (incorrectAnswers.length === 0) {
        reinforcementReviewList.innerHTML = '<p class="text-center text-slate-500">Tuyệt vời, bạn không làm sai câu nào trong lần thử này!</p>';
    } else {
        incorrectAnswers.forEach((result, index) => {
            const item = document.createElement('div');
            const q = result.question;
            item.className = 'p-4 rounded-lg bg-red-50 border border-red-200';
            item.innerHTML = `
                <p class="font-semibold text-slate-800">${index + 1}. ${q.question || q.clue}</p>
                <p class="text-sm text-slate-700 mt-2">Câu trả lời của bạn: <b class="text-red-700 font-semibold">${result.userAnswer || '(Chưa trả lời)'}</b></p>
                <p class="text-sm text-slate-700 mt-1">Đáp án đúng: <b class="text-green-700 font-semibold">${q.answer}</b></p>
                <button class="reinforce-btn mt-3 bg-fuchsia-500 hover:bg-fuchsia-600 text-white text-xs font-bold py-1 px-3 rounded-full" data-question-index="${sessionResults.indexOf(result)}">
                    Bài học từ AI
                </button>
            `;
            reinforcementReviewList.appendChild(item);
        });
    }
    showView('reinforcement-view');
}

// --- Review & History Functions ---
function showReviewPage(results, context, cameFromView) {
    reviewList.innerHTML = '';
    reviewCameFrom = cameFromView; 
    showView('review-view');

    if (context?.passage) {
        const passageEl = document.createElement('div');
        passageEl.className = 'p-4 mb-6 bg-slate-100 rounded-lg border border-slate-200';
        passageEl.innerHTML = `<h3 class="text-lg font-bold mb-2 text-slate-700">Đoạn văn</h3><p>${context.passage}</p>`;
        reviewList.appendChild(passageEl);
    }
    if (context?.script) {
        const scriptEl = document.createElement('div');
        scriptEl.className = 'p-4 mb-6 bg-slate-100 rounded-lg border border-slate-200';
        scriptEl.innerHTML = `<h3 class="text-lg font-bold mb-2 text-slate-700">Lời thoại</h3><p class="italic">"${context.script}"</p>`;
        reviewList.appendChild(scriptEl);
    }

    results.forEach((result, index) => {
        const item = document.createElement('div');
        const q = result.question;
        const userAnswer = result.userAnswer;
        const isCorrect = result.isCorrect;

        item.className = `p-4 rounded-lg border-2 mb-4 ${isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`;
        
        if (q.type === 'matching') {
             item.innerHTML = `<p class="font-semibold text-slate-800">${index + 1}. Nối từ</p><div class="mt-2 text-sm text-slate-600">Bạn đã hoàn thành câu hỏi này.</div><ul class="mt-3 pt-3 border-t border-slate-300 space-y-1">${q.pairs.map(p => `<li class="text-sm"><b>${p.word}</b>: ${p.meaning}</li>`).join('')}</ul>`;
        } else {
            const resultIcon = isCorrect ? '<span class="text-green-600 font-bold">✅ Đúng</span>' : '<span class="text-red-600 font-bold">❌ Sai</span>';
            let answerDetail = '';
            if (!isCorrect) { answerDetail = `<p class="text-sm text-slate-700 mt-2">Đáp án đúng: <b class="text-green-700 font-semibold">${q.answer}</b></p>`; }
            const questionContent = q.question || `Gợi ý: ${q.clue}`;
            const explanationHTML = q.explanation ? `<p class="mt-3 pt-3 border-t border-slate-300 text-sm text-slate-600"><b class="font-semibold">Giải thích:</b> ${q.explanation}</p>` : '';

            item.innerHTML = `<p class="font-semibold text-slate-800">${index + 1}. ${questionContent}</p><p class="text-sm text-slate-700 mt-2">Câu trả lời của bạn: <b class="${isCorrect ? 'text-green-700' : 'text-red-700'} font-semibold">${userAnswer || '(Chưa trả lời)'}</b> ${resultIcon}</p>${answerDetail}${explanationHTML}`;
        }
        reviewList.appendChild(item);
    });
}

async function reviewHistoricQuiz(resultId) {
    if (!auth.currentUser) return;
    historyList.innerHTML = '<div class="spinner mx-auto"></div>'; 
    try {
        const resultDocRef = doc(db, "users", auth.currentUser.uid, "quizResults", resultId);
        const docSnap = await getDoc(resultDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.type === 'writing') {
                quizData = { topic: data.topic, level: data.level, quizType: 'writing' };
                showView('writing-view');
                writingTopic.textContent = data.topic;
                writingInput.value = data.originalText;
                writingInput.disabled = true;
                getFeedbackButton.disabled = true;
                displayWritingFeedback(data.feedback);
                writingFeedbackContainer.classList.remove('hidden');
            } else {
                showReviewPage(data.results, data.context, 'history-view');
            }
        } else {
            showError("Không tìm thấy dữ liệu bài làm này.");
        }
    } catch (error) {
        console.error("Lỗi khi tải bài làm để xem lại:", error);
        showError("Không thể tải bài làm để xem lại.");
    }
}

async function showHistory() {
    if (!auth.currentUser) { showError("Bạn cần đăng nhập để xem lịch sử."); return; }
    showView('history-view');
    historyList.innerHTML = '<div class="spinner mx-auto"></div>';
    historyDashboard.innerHTML = '';
    recommendationsContainer.innerHTML = '';
    try {
        const historyCollectionRef = collection(db, "users", auth.currentUser.uid, "quizResults");
        const q = query(historyCollectionRef);
        const querySnapshot = await getDocs(q);
        userHistoryCache = querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        
        if (userHistoryCache.length === 0) { 
            historyList.innerHTML = '<p class="text-center text-slate-500">Bạn chưa có lịch sử làm bài nào.</p>'; 
            historyDashboard.innerHTML = '';
            recommendationsContainer.innerHTML = '';
            return; 
        }
        const stats = calculateStats(userHistoryCache);
        displayHistoryStats(stats);
        generateRecommendations(stats);
        renderHistoryList();
    } catch (error) {
        console.error("Lỗi khi tải lịch sử: ", error);
        historyList.innerHTML = '<p class="text-center text-red-500">Không thể tải lịch sử.</p>';
    }
}

function renderHistoryList() {
    const skill = filterSkill.value;
    const level = filterLevel.value;
    const filteredResults = userHistoryCache.filter(res => (skill === 'all' || res.type === skill) && (level === 'all' || res.level === level));
    if (filteredResults.length === 0) { historyList.innerHTML = '<p class="text-center text-slate-500">Không tìm thấy kết quả phù hợp.</p>'; return; }
    historyList.innerHTML = '';
    filteredResults.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).forEach(data => {
        const date = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString('vi-VN') : 'N/A';
        const typeMap = { vocabulary: 'Từ vựng', reading: 'Đọc hiểu', grammar: 'Ngữ pháp', listening: 'Nghe hiểu', writing: 'Luyện viết' };
        const typeText = typeMap[data.type] || 'Không xác định';
        
        const topicText = (data.type !== 'grammar') ? `<p class="font-bold text-base text-slate-800 capitalize">${data.topic} <span class="text-sm font-normal text-indigo-600">(${typeText})</span></p>` : `<p class="font-bold text-base text-slate-800 capitalize">${typeText}</p>`;
        
        let scoreText;
        if (data.type === 'writing') {
            scoreText = `<p class="font-bold text-xl text-cyan-600">${data.feedback.score}/100</p>`;
        } else {
            scoreText = `<p class="font-bold text-xl ${data.score / data.totalQuestions >= 0.7 ? 'text-green-600' : 'text-orange-500'}">${data.score}/${data.totalQuestions}</p>`;
        }

        const item = document.createElement('div');
        item.className = 'bg-slate-50 p-3 rounded-lg border border-slate-200';
        item.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    ${topicText}
                    <div class="text-xs text-slate-500 mt-1">
                        <span>Trình độ: ${data.level.toUpperCase()}</span> | <span>${date}</span>
                    </div>
                </div>
                ${scoreText}
            </div>
            <div class="flex justify-end items-center space-x-2 mt-2 pt-2 border-t border-slate-200">
                <button class="review-hist-button bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold py-1 px-3 rounded-full" data-result-id="${data.id}">Xem lại</button>
                <button class="retry-button bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold py-1 px-3 rounded-full" data-type="${data.type}" data-topic="${data.topic || ''}" data-level="${data.level}">Làm lại</button>
            </div>`;
        historyList.appendChild(item);
    });
    
    document.querySelectorAll('.retry-button').forEach(button => {
        button.addEventListener('click', (e) => {
            playSound('click');
            const { type, topic, level } = e.target.dataset;
            if (type === 'writing') {
                startWritingPractice();
            } else {
                startQuiz({ type, topic, level });
            }
        });
    });
    document.querySelectorAll('.review-hist-button').forEach(button => {
        button.addEventListener('click', (e) => {
            playSound('click');
            reviewHistoricQuiz(e.target.dataset.resultId);
        });
    });
}

function calculateStats(results) {
    let totalCorrect = 0, totalQuestions = 0;
    const skillStats = { vocabulary: {c:0, t:0}, reading: {c:0, t:0}, grammar: {c:0, t:0}, listening: {c:0, t:0}, writing: {c:0, t:0} };
    const topicStats = {};
    results.forEach(res => {
        if (res.type === 'writing') {
            skillStats.writing.c += res.feedback.score;
            skillStats.writing.t += 100;
        } else {
            totalCorrect += res.score; totalQuestions += res.totalQuestions;
            if (skillStats[res.type]) { skillStats[res.type].c += res.score; skillStats[res.type].t += res.totalQuestions; }
        }
        if (res.type !== 'grammar') { if (!topicStats[res.topic]) topicStats[res.topic] = {c:0, t:0}; topicStats[res.topic].c += (res.type === 'writing' ? res.feedback.score : res.score); topicStats[res.topic].t += (res.type === 'writing' ? 100 : res.totalQuestions); }
    });
    return { totalCorrect, totalQuestions, skillStats, topicStats };
}

function displayHistoryStats(stats) {
    const { skillStats } = stats;
    const overallQuizCorrect = stats.totalCorrect;
    const overallQuizTotal = stats.totalQuestions;
    const overallWritingScore = skillStats.writing.c;
    const overallWritingAttempts = skillStats.writing.t / 100;

    let overallRate = 0;
    if (overallQuizTotal + skillStats.writing.t > 0) {
        overallRate = Math.round(((overallQuizCorrect + overallWritingScore) / (overallQuizTotal + skillStats.writing.t)) * 100);
    }
    
    const findBest = (s) => Object.entries(s).filter(([, v]) => v.t > 0).reduce((b, [k, v]) => (v.c / v.t > b.rate ? { key: k, rate: v.c / v.t } : b), { key: 'N/A', rate: -1 });
    const bestSkill = findBest(skillStats);
    const bestTopic = findBest(stats.topicStats);
    const typeMap = { vocabulary: 'Từ vựng', reading: 'Đọc hiểu', grammar: 'Ngữ pháp', listening: 'Nghe hiểu', writing: 'Luyện viết' };
    historyDashboard.innerHTML = `
        <div class="bg-blue-100 p-4 rounded-lg"><div class="text-sm text-blue-600 font-semibold">Tỷ lệ đúng</div><div class="text-3xl font-bold text-blue-800">${overallRate}%</div></div>
        <div class="bg-green-100 p-4 rounded-lg"><div class="text-sm text-green-600 font-semibold">Kỹ năng tốt nhất</div><div class="text-2xl font-bold text-green-800 capitalize">${typeMap[bestSkill.key] || 'Chưa có'}</div></div>
        <div class="bg-purple-100 p-4 rounded-lg"><div class="text-sm text-purple-600 font-semibold">Chủ đề tốt nhất</div><div class="text-2xl font-bold text-purple-800 capitalize">${bestTopic.key || 'Chưa có'}</div></div>`;
}

async function generateRecommendations(stats) {
    const { skillStats } = stats;
    const recommendations = [];
    const findWorst = (s) => Object.entries(s).filter(([, v]) => v.t > 0).reduce((w, [k, v]) => (v.c / v.t < w.rate ? { key: k, rate: v.c / v.t } : w), { key: 'N/A', rate: 2 });
    const worstSkill = findWorst(skillStats);
    const typeMap = { vocabulary: 'Từ vựng', reading: 'Đọc hiểu', grammar: 'Ngữ pháp', listening: 'Nghe hiểu', writing: 'Luyện viết' };
    if (worstSkill.key !== 'N/A' && worstSkill.rate < 0.7) {
        recommendations.push({ text: `Có vẻ bạn cần cải thiện kỹ năng <b>${typeMap[worstSkill.key]}</b>. Thử một bài ngay?`, settings: { type: worstSkill.key, level: 'B1', topic: 'General' } });
    }
    const findBest = (s) => Object.entries(s).filter(([, v]) => v.t > 2).reduce((b, [k, v]) => (v.c / v.t > b.rate ? { key: k, rate: v.c / v.t } : b), { key: 'N/A', rate: -1 });
    const bestSkill = findBest(skillStats);
    const levelOrder = ['A2', 'B1', 'B2', 'C1'];
    if (bestSkill.key !== 'N/A' && bestSkill.rate > 0.8) {
        const currentLevelIndex = levelOrder.indexOf('B1');
        if (currentLevelIndex < levelOrder.length - 1) {
            const nextLevel = levelOrder[currentLevelIndex + 1];
            recommendations.push({ text: `Bạn làm rất tốt <b>${typeMap[bestSkill.key]}</b>! Thử sức ở trình độ <b>${nextLevel}</b> nhé?`, settings: { type: bestSkill.key, level: nextLevel, topic: 'General' } });
        }
    }
    if (recommendations.length === 0 && userHistoryCache.length > 0) {
        recommendations.push({ text: "Bạn đang làm rất tốt! Hãy tiếp tục phát huy nhé!", settings: null });
    }
    recommendationsContainer.innerHTML = recommendations.length > 0 ? `<h3 class="text-lg font-bold text-slate-700 mb-2">Gợi ý cho bạn</h3>` : '';
    recommendations.forEach(rec => {
        const recButton = document.createElement('button');
        recButton.innerHTML = rec.text;
        recButton.className = "w-full text-left p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg hover:bg-yellow-200 transition mb-2";
        if (rec.settings) { recButton.onclick = () => startPractice(rec.settings); } 
        else { recButton.disabled = true; }
        recommendationsContainer.appendChild(recButton);
    });
}

// --- Notebook Functions ---
// UPDATED FUNCTION
async function saveWordToNotebook(word, definition, example, ipa) {
    if (!auth.currentUser) return;
    const cleanedWord = word.toLowerCase();
    if (notebookWords.has(cleanedWord)) return; // Don't save duplicates

    const notebookRef = collection(db, "users", auth.currentUser.uid, "vocabulary");
    try {
        await addDoc(notebookRef, {
            word: cleanedWord, 
            definition: definition || 'Chưa có giải thích.',
            example: example || 'Chưa có câu ví dụ.',
            ipa: ipa || '',
            addedAt: serverTimestamp()
        });
        notebookWords.add(cleanedWord); // Update local cache
    } catch (error) { console.error("Error saving word:", error); }
}

// UPDATED FUNCTION
async function showNotebook() {
    if (!auth.currentUser) { showError("Bạn cần đăng nhập để xem sổ tay."); return; }
    showView('notebook-view');
    notebookList.innerHTML = '<div class="spinner mx-auto"></div>';
    try {
        const notebookRef = collection(db, "users", auth.currentUser.uid, "vocabulary");
        const q = query(notebookRef);
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            notebookList.innerHTML = '<p class="text-center text-slate-500">Sổ tay của bạn còn trống. Hãy nhấn vào các từ trong bài tập để lưu nhé!</p>';
            return;
        }
        notebookList.innerHTML = '';
        querySnapshot.docs
            .sort((a,b) => (b.data().addedAt?.seconds || 0) - (a.data().addedAt?.seconds || 0))
            .forEach((docSnapshot) => {
                const wordData = docSnapshot.data();
                const wordId = docSnapshot.id;
                const card = document.createElement('div');
                card.className = 'bg-teal-50 p-4 rounded-lg border border-teal-200';
                card.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="flex items-center gap-3">
                                <h4 class="text-xl font-bold text-teal-800 capitalize">${wordData.word}</h4>
                                <button class="speak-btn" onclick="window.playSpeech('${wordData.word}')">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-teal-600 hover:text-teal-800"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon></svg>
                                </button>
                            </div>
                            <p class="text-slate-500">${wordData.ipa || ''}</p>
                            <p class="text-slate-700 mt-1">${wordData.definition}</p>
                            <p class="text-sm text-slate-500 italic mt-2">"${wordData.example}"</p>
                        </div>
                        <button class="delete-word-btn text-red-400 hover:text-red-600 text-2xl" data-id="${wordId}" data-word="${wordData.word}" title="Xóa từ này">🗑️</button>
                    </div>`;
                notebookList.appendChild(card);
            });
        document.querySelectorAll('.delete-word-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const wordId = e.currentTarget.dataset.id;
                const word = e.currentTarget.dataset.word;
                showConfirmModal('Bạn có chắc muốn xóa từ này?', async () => {
                    const wordDocRef = doc(db, "users", auth.currentUser.uid, "vocabulary", wordId);
                    await deleteDoc(wordDocRef);
                    notebookWords.delete(word); // Remove from local cache
                    e.currentTarget.closest('.bg-teal-50').remove();
                });
            });
        });
    } catch (error) {
        console.error("Error loading notebook:", error);
        notebookList.innerHTML = '<p class="text-center text-red-500">Không thể tải sổ tay.</p>';
    }
}

// --- Audio Functions ---
function playSpeech(text, startIndex = 0) {
    if (synth.speaking) { synth.cancel(); }
    isPausedByUser = false;
    const utterance = new SpeechSynthesisUtterance(text.substring(startIndex));
    const voices = synth.getVoices();
    // Prioritize a native English speaker voice if available
    let selectedVoice = voices.find(voice => voice.name === 'Google US English' || voice.name === 'Microsoft David - English (United States)');
    if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.startsWith('en-')) || voices[0];
    }
    utterance.voice = selectedVoice;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // This part is for highlighting text in the transcript, not needed for single word pronunciation
    if (transcriptContainer.offsetParent !== null) { 
        const words = text.split(/(\s+)/);
        const wordElements = words.map(word => { const span = document.createElement('span'); span.textContent = word; return span; });
        transcriptContainer.innerHTML = '';
        wordElements.forEach(el => transcriptContainer.appendChild(el));
        let charCounter = 0;
        const wordBoundaries = words.map(word => { const start = charCounter; charCounter += word.length; return { word, start, end: charCounter }; });
        utterance.onboundary = (event) => {
            lastSpokenCharIndex = startIndex + event.charIndex;
            wordElements.forEach(el => el.classList.remove('highlight-word'));
            for(let i = 0; i < wordBoundaries.length; i++) {
                if (lastSpokenCharIndex >= wordBoundaries[i].start && lastSpokenCharIndex < wordBoundaries[i].end) {
                    wordElements[i].classList.add('highlight-word');
                    break;
                }
            }
        };
    }
    
    utterance.onstart = () => { audioState = 'playing'; playIcon.classList.add('hidden'); pauseIcon.classList.remove('hidden'); audioStatus.textContent = "Đang phát..."; };
    utterance.onend = () => {
        if (!isPausedByUser) {
            lastSpokenCharIndex = 0; audioState = 'idle';
            playIcon.classList.remove('hidden'); pauseIcon.classList.add('hidden');
            audioStatus.textContent = "Nghe lại";
            if(optionsContainer.offsetParent !== null) {
                Array.from(optionsContainer.children).forEach(button => { button.disabled = false; button.classList.remove('opacity-50', 'cursor-not-allowed'); });
            }
            if (transcriptContainer.offsetParent !== null) {
               transcriptContainer.querySelectorAll('span').forEach(el => el.classList.remove('highlight-word'));
            }
        }
    };
    utterance.onerror = (e) => { audioState = 'idle'; audioStatus.textContent = "Lỗi phát âm thanh"; console.error("SpeechSynthesis Error:", e); };
    synth.speak(utterance);
}
window.playSpeech = playSpeech;

function setupAudioPlayer() {
    audioState = 'idle'; lastSpokenCharIndex = 0;
    playIcon.classList.remove('hidden'); pauseIcon.classList.add('hidden');
    audioStatus.textContent = "Nhấn để nghe"; playAudioBtn.disabled = false;
}

// --- Library & History Saving ---
async function saveWritingResult(originalText, feedback) {
    if (!auth.currentUser) return;
    const resultsCollectionRef = collection(db, "users", auth.currentUser.uid, "quizResults");
    const newResult = {
        level: quizData.level,
        type: 'writing',
        topic: writingTopic.textContent,
        originalText: originalText,
        feedback: feedback,
        createdAt: serverTimestamp()
    };
    try {
        await addDoc(resultsCollectionRef, newResult);
        userHistoryCache = []; // Invalidate cache
    } catch (error) {
        console.error("Lỗi khi lưu kết quả luyện viết: ", error);
    }
}

async function saveQuizToLibrary(quizDataToSave) {
    if (!auth.currentUser) return;
    const libraryRef = collection(db, "quizLibrary");
    const extractVocabulary = (questions) => {
        const vocabulary = [];
        if (!Array.isArray(questions)) return vocabulary;
        questions.forEach(q => {
            if (q.type === 'matching' && Array.isArray(q.pairs)) { q.pairs.forEach(pair => vocabulary.push({ word: pair.word, meaning: pair.meaning, ipa: '' })); } 
            else if (q.type === 'flashcard' && q.word) { vocabulary.push({ word: q.word, meaning: q.meaning, ipa: q.ipa || '' }); } 
            else if (q.answer) { vocabulary.push({ word: q.answer, meaning: q.explanation || q.clue || 'Xem giải thích trong bài.', ipa: q.ipa || '' }); }
        });
        return vocabulary;
    };
    try {
        const quizContent = quizDataToSave.raw;
        const relatedVocabulary = extractVocabulary(Array.isArray(quizContent) ? quizContent : (quizContent?.questions || []));
        const dataToSave = {
            creatorId: auth.currentUser.uid, level: quizDataToSave.level, quizType: quizDataToSave.quizType,
            count: quizDataToSave.count, quizContent: quizContent || {}, createdAt: serverTimestamp(), relatedVocabulary: relatedVocabulary
        };
        if (quizDataToSave.quizType !== 'grammar') { dataToSave.topic = quizDataToSave.topic; }
        if (quizDataToSave.quizType === 'vocabulary') { dataToSave.vocabMode = quizDataToSave.vocabMode; }
        await addDoc(libraryRef, dataToSave);
    } catch (error) { console.error("Error saving quiz to library:", error); }
}

async function showLibrary() {
    if (!auth.currentUser) { showError("Bạn cần đăng nhập để xem thư viện."); return; }
    showView('library-view');
    libraryList.innerHTML = '<div class="spinner mx-auto"></div>';
    const libraryRef = collection(db, "quizLibrary");
    try {
        const querySnapshot = await getDocs(query(libraryRef));
        const quizzes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderLibraryList(quizzes);
    } catch (error) { console.error("Error fetching quiz library:", error); libraryList.innerHTML = '<p class="text-center text-red-500">Không thể tải thư viện.</p>'; }
}

function renderLibraryList(quizzes) {
    if (quizzes.length === 0) { libraryList.innerHTML = '<p class="text-center text-slate-500">Thư viện của bạn còn trống.</p>'; return; }
    libraryList.innerHTML = '';
    quizzes.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).forEach(quiz => {
        const date = quiz.createdAt ? new Date(quiz.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : 'N/A';
        const typeText = quiz.quizType === 'reading' ? 'Đọc hiểu' : (quiz.quizType === 'grammar' ? 'Ngữ pháp' : (quiz.quizType === 'listening' ? 'Nghe hiểu' : 'Từ vựng'));
        const item = document.createElement('div');
        item.className = 'bg-slate-50 p-3 rounded-lg border border-slate-200';
        item.innerHTML = `<p class="font-bold text-base text-slate-800 capitalize">${quiz.topic || 'Ngữ pháp tổng hợp'} <span class="text-sm font-normal text-amber-600">(${typeText})</span></p><div class="text-xs text-slate-500 mt-1"><span>Trình độ: ${quiz.level.toUpperCase()}</span> | <span>${quiz.count || (quiz.quizContent?.questions?.length || quiz.quizContent?.length)} câu</span> | <span>Ngày tạo: ${date}</span></div><div class="flex justify-end items-center space-x-2 mt-2 pt-2 border-t border-slate-200"><button class="view-vocab-btn bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-3 rounded-full" data-quiz-id="${quiz.id}">Xem từ vựng</button><button class="retry-library-btn bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold py-1 px-3 rounded-full" data-quiz-id="${quiz.id}">Làm lại</button></div>`;
        libraryList.appendChild(item);
    });
    document.querySelectorAll('.retry-library-btn').forEach(button => { button.addEventListener('click', (e) => retrySavedQuiz(e.target.dataset.quizId)); });
    document.querySelectorAll('.view-vocab-btn').forEach(button => { button.addEventListener('click', (e) => showRelatedVocabulary(e.target.dataset.quizId)); });
}

async function retrySavedQuiz(quizId) {
    const docRef = doc(db, "quizLibrary", quizId);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const savedQuiz = docSnap.data();
            currentQuizType = 'standard';
            quizData = {
                topic: savedQuiz.topic, level: savedQuiz.level, quizType: savedQuiz.quizType,
                vocabMode: savedQuiz.vocabMode, count: savedQuiz.count, raw: savedQuiz.quizContent, isRetry: true
            };
            sessionResults = []; currentQuestionIndex = 0; score = 0;
            renderQuiz(); showView('quiz-view');
        }
    } catch (error) { showError("Không thể tải lại bài tập này."); }
}

async function showRelatedVocabulary(quizId) {
    const docRef = doc(db, "quizLibrary", quizId);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const vocabData = docSnap.data().relatedVocabulary;
            vocabList.innerHTML = '';
            if (vocabData && vocabData.length > 0) {
                vocabData.forEach(v => {
                    if (!v.word || !v.meaning) return;
                    const item = document.createElement('div');
                    item.className = 'p-3 border-b border-slate-200 last:border-b-0';
                    item.innerHTML = `<div class="flex items-center"><b class="text-lg text-slate-800">${v.word}</b><span class="ml-3 text-slate-500">${v.ipa || ''}</span><button class="speak-btn ml-auto p-1 rounded-full hover:bg-sky-100" onclick="window.playSpeech('${v.word}')"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-sky-600"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg></button></div><p class="text-slate-600">${v.meaning}</p>`;
                    vocabList.appendChild(item);
                });
            } else { vocabList.innerHTML = '<p class="text-center text-slate-500 p-4">Không có từ vựng nào.</p>'; }
            showModal(vocabModal);
        } else { showError("Không tìm thấy bài tập."); }
    } catch (error) { console.error("Error loading related vocabulary:", error); showError("Không thể tải danh sách từ vựng."); }
}
        
// --- Diagnostic Conversation Functions ---
function initSpeechRecognition() {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!window.SpeechRecognition) {
        alert("Rất tiếc, trình duyệt của bạn không hỗ trợ nhận dạng giọng nói. Vui lòng sử dụng Chrome hoặc Edge.");
        micButton.disabled = true;
        return;
    }
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleUserResponse(transcript, 'speech');
    };

    recognition.onspeechend = () => {
        recognition.stop();
    };

    recognition.onend = () => {
        micButton.classList.remove('mic-recording', 'bg-red-400');
        micButton.disabled = false;
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        micButton.classList.remove('mic-recording', 'bg-red-400');
        micButton.disabled = false;
    };
}

function addMessageToLog(sender, text, type = 'text') {
    const messageDiv = document.createElement('div');
    let contentHTML = '';
    if (type === 'speech') {
        contentHTML = `<p class="p-3 rounded-lg bg-indigo-100 text-indigo-800">${text}</p>`;
    } else {
        contentHTML = `<p class="p-3 rounded-lg ${sender === 'ai' ? 'bg-slate-200 text-slate-800' : 'bg-indigo-100 text-indigo-800'}">${text}</p>`;
    }

    messageDiv.innerHTML = `
        <div class="font-bold text-sm mb-1 ${sender === 'ai' ? 'text-slate-600' : 'text-indigo-600'}">${sender === 'ai' ? 'AI' : 'Bạn'}</div>
        ${contentHTML}
    `;
    conversationLog.appendChild(messageDiv);
    conversationLog.scrollTop = conversationLog.scrollHeight;

    if (sender === 'user') {
        diagnosticConversationState.history.push({ role: 'user', text: text, inputType: type });
    } else { // AI
        diagnosticConversationState.history.push({ role: 'ai', text: text });
    }
}

async function handleUserResponse(text, type = 'text') {
    if (!text.trim()) return;

    addMessageToLog('user', text, type);
    conversationTextInput.value = '';
    conversationInputArea.classList.add('hidden'); // Hide input while AI is thinking

    const thinkingDiv = document.createElement('div');
    thinkingDiv.innerHTML = `
        <div class="font-bold text-sm mb-1 text-slate-600">AI</div>
        <div class="p-3 rounded-lg bg-slate-200 text-slate-800">
            <div class="spinner h-5 w-5 border-2 border-left-color-slate-400"></div>
        </div>`;
    conversationLog.appendChild(thinkingDiv);
    conversationLog.scrollTop = conversationLog.scrollHeight;

    try {
        const history = diagnosticConversationState.history.map(h => `${h.role}: ${h.text}`).join('\n');
        const prompt = `This is a diagnostic conversation. The user just said: "${text}". The history is:\n${history}\n\nAsk a follow-up question to gauge their English level. If the conversation has had more than 6 turns, say "Thank Thank you! I have enough information now. I will now analyze your results."`;
        
        const result = await fastModel.generateContent(prompt);
        const response = await result.response;
        const aiResponse = response.text();

        conversationLog.removeChild(thinkingDiv);
        addMessageToLog('ai', aiResponse);
        playSpeech(aiResponse);

        if (aiResponse.includes("analyze your results")) {
            endDiagnosticConversationButton.textContent = "Xem kết quả";
            endDiagnosticConversationButton.onclick = showPlacementResult;
        } else {
            conversationInputArea.classList.remove('hidden');
        }

    } catch (error) {
        console.error("Error in diagnostic conversation:", error);
        conversationLog.removeChild(thinkingDiv);
        addMessageToLog('ai', "I'm sorry, I encountered an error. Let's end the conversation here.");
        endDiagnosticConversationButton.textContent = "Kết thúc";
        endDiagnosticConversationButton.onclick = () => showView('setup-view');
    }
}

async function startDiagnosticConversation() {
    currentQuizType = 'diagnostic';
    sessionResults = [];
    score = 0;
    diagnosticConversationState = {
        history: [],
        startTime: new Date()
    };

    showView('diagnostic-conversation-view');
    conversationLog.innerHTML = '';
    conversationInputArea.classList.remove('hidden');
    endDiagnosticConversationButton.textContent = "Kết thúc";
    endDiagnosticConversationButton.onclick = () => {
        if(recognition) recognition.stop();
        if(synth.speaking) synth.cancel();
        showView('setup-view');
    };

    const initialPrompt = "Let's start with a simple question. What did you do last weekend?";
    addMessageToLog('ai', initialPrompt);
    playSpeech(initialPrompt);
}

// --- Event Listeners & Setup ---
function handleQuizTypeChange() {
    const selectedType = quizTypeSelect.value;
    const isVocab = selectedType === 'vocabulary';
    const isWriting = selectedType === 'writing';
    const isTopicBased = isVocab || selectedType === 'reading' || selectedType === 'listening' || isWriting;
    
    vocabModeContainer.style.maxHeight = isVocab ? '150px' : '0'; 
    vocabModeContainer.style.opacity = isVocab ? '1' : '0';
    vocabModeContainer.style.marginTop = isVocab ? '1.5rem' : '0';
    
    questionCountContainer.style.display = isWriting ? 'none' : 'block';

    if (!isTopicBased) {
        topicContainer.style.maxHeight = '0'; 
        topicContainer.style.opacity = '0';
        topicContainer.style.marginTop = '0';
        customTopicContainer.classList.add('hidden');
    } else {
        topicContainer.style.maxHeight = '150px'; 
        topicContainer.style.opacity = '1';
        topicContainer.style.marginTop = '1.5rem';
        if (topicSelect.value === 'custom') {
            customTopicContainer.classList.remove('hidden');
        } else {
            customTopicContainer.classList.add('hidden');
        }
    }
}

const addSoundToListener = (element, event, callback) => {
    if (!element) return;
    element.addEventListener(event, (e) => {
        playSound('click');
        callback(e);
    });
};

addSoundToListener(loginButton, 'click', () => handleAuthAction('login'));
addSoundToListener(registerButton, 'click', () => handleAuthAction('register'));
addSoundToListener(logoutButton, 'click', handleLogout);
addSoundToListener(startQuizButton, 'click', startPractice);
addSoundToListener(quickStartButton, 'click', quickStartPractice);
addSoundToListener(backToSetupButton, 'click', () => showView('setup-view'));
addSoundToListener(showHistoryButton, 'click', showHistory);
addSoundToListener(showNotebookButton, 'click', showNotebook);
addSoundToListener(showLibraryButton, 'click', showLibrary);
addSoundToListener(backToSetupFromLibrary, 'click', () => showView('setup-view'));
addSoundToListener(backToSetupFromHistory, 'click', () => showView('setup-view'));
addSoundToListener(backToSetupFromNotebook, 'click', () => showView('setup-view'));
addSoundToListener(viewHistoryFromResultButton, 'click', showHistory);
addSoundToListener(nextQuestionButton, 'click', moveToNextQuestion);
addSoundToListener(translateQuestionBtn, 'click', () => showTranslationModal(getTranslation(questionText.textContent)));
addSoundToListener(closeTranslationModal, 'click', () => hideModal(translationModal));
addSoundToListener(closeVocabModal, 'click', () => hideModal(vocabModal));
addSoundToListener(closeReinforceModal, 'click', () => hideModal(reinforceModal));
addSoundToListener(closeWordInfoModal, 'click', () => hideModal(wordInfoModal));
addSoundToListener(backToPreviousViewButton, 'click', () => showView(reviewCameFrom));
addSoundToListener(backToSetupFromWriting, 'click', () => { currentQuizType === 'path' ? showLearningPath() : showView('setup-view'); });
addSoundToListener(getFeedbackButton, 'click', getWritingFeedback);
addSoundToListener(startPlacementTestButton, 'click', () => showView('assessment-choice-view'));
addSoundToListener(backToSetupFromChoice, 'click', () => showView('setup-view'));
addSoundToListener(startTraditionalTestButton, 'click', startPlacementTest);
addSoundToListener(startDiagnosticConversationButton, 'click', startDiagnosticConversation);
addSoundToListener(backToSetupFromPlacement, 'click', () => showView('setup-view'));
addSoundToListener(createPathButton, 'click', showGoalSetting);
addSoundToListener(continuePathButton, 'click', showLearningPath);
addSoundToListener(backToSetupFromPath, 'click', () => showView('setup-view'));
addSoundToListener(backToPathFromReinforcement, 'click', showLearningPath);
addSoundToListener(retryPathStepFromReinforcement, 'click', startPathStep);

quizTypeSelect.addEventListener('change', handleQuizTypeChange);
topicSelect.addEventListener('change', () => {
    if (topicSelect.value === 'custom') {
        customTopicContainer.classList.remove('hidden');
    } else {
        customTopicContainer.classList.add('hidden');
    }
});
filterSkill.addEventListener('change', renderHistoryList);
filterLevel.addEventListener('change', renderHistoryList);

playAudioBtn.addEventListener('click', () => {
    if (audioState === 'playing') {
        isPausedByUser = true; synth.cancel(); audioState = 'paused';
        playIcon.classList.remove('hidden'); pauseIcon.classList.add('hidden');
        audioStatus.textContent = "Đã tạm dừng";
    } else { playSpeech(quizData.raw.script, lastSpokenCharIndex); }
});

showTranscriptBtn.addEventListener('click', () => {
    const isHidden = transcriptContainer.classList.toggle('hidden');
    showTranscriptBtn.textContent = isHidden ? 'Hiện lời thoại' : 'Ẩn lời thoại';
});

reviewAnswersButton.addEventListener('click', () => {
    playSound('click');
    const context = { passage: quizData.raw.passage || null, script: quizData.raw.script || null };
    showReviewPage(sessionResults, context, 'result-view');
});

writingInput.addEventListener('input', () => {
    const text = writingInput.value;
    const count = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    wordCount.textContent = `${count} từ`;
});

// --- Event Delegation for Word Lookup ---
document.getElementById('quiz-view').addEventListener('click', (e) => {
    if (e.target.classList.contains('lookup-word')) {
        showWordInfo(e.target.textContent);
    }
});

appContainer.addEventListener('click', (e) => {
    if (e.target && e.target.closest('.start-step-btn')) {
        playSound('click');
        startPathStep();
    }
    if (e.target && e.target.closest('.reinforce-btn')) {
        playSound('click');
        const resultIndex = parseInt(e.target.closest('.reinforce-btn').dataset.questionIndex, 10);
        const result = sessionResults[resultIndex];
        requestReinforcement(result.question, result.userAnswer);
    }
});

// --- Diagnostic Conversation Event Listeners ---
micButton.addEventListener('click', () => {
    playSound('click');
    if (!recognition) {
        initSpeechRecognition();
        if(!recognition) return;
    }
    micButton.classList.add('mic-recording', 'bg-red-400');
    micButton.disabled = true;
    recognition.start();
});

sendTextButton.addEventListener('click', () => {
    playSound('click');
    handleUserResponse(conversationTextInput.value);
});
conversationTextInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        playSound('click');
        handleUserResponse(conversationTextInput.value);
    }
});

// Initial setup
handleQuizTypeChange();
