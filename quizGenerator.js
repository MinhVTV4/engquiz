// quizGenerator.js

// Hàm tiện ích để trích xuất và parse JSON từ phản hồi của AI
function extractAndParseJson(rawText) {
    const regex = /```json\s*([\s\S]*?)\s*```/;
    const match = rawText.match(regex);
    let jsonString = (match && match[1]) ? match[1] : rawText;
    // Loại bỏ các ký tự điều khiển không hợp lệ trong JSON
    jsonString = jsonString.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Lỗi parse JSON:", error, "Chuỗi JSON thô:", jsonString);
        return null;
    }
}

// Hàm tạo prompt cho thông tin từ vựng
export function getWordInfoPrompt(word) {
    return `Provide a simple Vietnamese definition, a simple English example sentence, and the IPA transcription for the word "${word}". You MUST wrap your entire response in a 'json' markdown code block.
            Example:
            \`\`\`json
            {
              "definition": "một thiết bị điện tử để lưu trữ và xử lý dữ liệu",
              "example": "I use my computer for work and study.",
              "ipa": "/kəmˈpjuːtər/"
            }
            \`\`\``;
}

// Hàm tạo prompt cho bài kiểm tra trình độ
export function getPlacementTestPrompt() {
    return `You are an expert English assessment creator. Create a comprehensive placement test with exactly 12 multiple-choice questions to determine a user's CEFR level (from A2 to B2).
            The test MUST include:
            - 4 Grammar questions, with increasing difficulty (A2, B1, B1, B2).
            - 4 Vocabulary questions, with increasing difficulty (A2, B1, B1, B2) covering common topics.
            - 1 short reading passage (around 80-100 words, at a B1 level).
            - 4 multiple-choice questions based on the reading passage.

            For each question, provide one correct answer and three plausible distractors. The "answer" field MUST be the full text of the correct option.
            You MUST wrap your entire response in a 'json' markdown code block. The structure MUST be a valid JSON object with a "passage" key (which can be an empty string for non-reading questions) and a "questions" key containing an array of 12 question objects.
            Example structure:
            \`\`\`json
            {
              "passage": "...",
              "questions": [
                { "question": "...", "options": ["..."], "answer": "..." },
                { "question": "...", "options": ["..."], "answer": "..." }
              ]
            }
            \`\`\``;
}

// Hàm tạo prompt để phân tích kết quả bài kiểm tra trình độ
export function getPlacementAnalysisPrompt(results) {
    const userAnswers = results.map(r => ({ question: r.question.question, userAnswer: r.userAnswer, correctAnswer: r.question.answer }));
    return `An English learner has just completed a placement test. Here are their results: ${JSON.stringify(userAnswers)}.
            Based on these answers, please perform the following tasks:
            1.  Determine the user's approximate CEFR level (e.g., "A2", "B1", "B2").
            2.  Write a short, friendly analysis (2-3 sentences in Vietnamese) of their performance, highlighting one strength and one area for improvement.
            
            You MUST wrap your entire response in a 'json' markdown code block. The structure MUST be a valid JSON object with "level" and "analysis" keys.
            Example:
            \`\`\`json
            {
              "level": "B1",
              "analysis": "Bạn có nền tảng ngữ pháp khá tốt và xử lý tốt các câu hỏi ở trình độ A2. Tuy nhiên, bạn cần cải thiện thêm vốn từ vựng ở các chủ đề chuyên sâu hơn để đạt trình độ B2."
            }
            \`\`\``;
}

// Hàm tạo prompt cho lộ trình học tập cá nhân hóa
export function getLearningPathPrompt(placementResult, goal) {
    return `An English learner has the following profile:
            - CEFR Level determined by placement test: ${placementResult.level}
            - Placement test analysis: "${placementResult.analysis}"
            - Stated learning goal: "${goal}"

            Based on this profile, create a personalized learning path consisting of 10-15 sequential steps. Each step should be a specific, actionable learning unit.
            For each step, define its "type" ('vocabulary', 'grammar', 'reading', 'listening', 'writing', or 'review'), a "topic", a "level" (CEFR), and a short "description" in Vietnamese.
            The path should start with foundational topics based on the user's weaknesses and progressively build up towards their goal. Include 'review' steps periodically to reinforce learning.

            You MUST wrap your entire response in a 'json' markdown code block. The structure MUST be a valid JSON array of step objects.
            Example:
            \`\`\`json
            [
              {
                "type": "grammar",
                "topic": "Present Perfect Tense",
                "level": "B1",
                "description": "Ôn tập cách dùng thì Hiện tại Hoàn thành"
              },
              {
                "type": "vocabulary",
                "topic": "Work & Business",
                "level": "B1",
                "description": "Học 10 từ vựng cốt lõi về chủ đề Công việc"
              },
              {
                "type": "review",
                "topic": "Mixed",
                "level": "B1",
                "description": "Làm bài quiz ngắn ôn tập kiến thức vừa học"
              }
            ]
            \`\`\``;
}

// Hàm tạo prompt để phân tích hội thoại chẩn đoán
export function getDiagnosticAnalysisPrompt(conversationData) {
    const dataString = JSON.stringify(conversationData, null, 2);
    return `You are a master English language assessor AI. A user has just completed a diagnostic conversation. Here is the transcript and data collected:
            \`\`\`json
            ${dataString}
            \`\`\`
            Based on ALL the provided data, perform a holistic analysis. Your response MUST be a JSON object wrapped in a 'json' markdown code block with the following structure:
            1.  "overallLevel": A string representing the user's overall CEFR level (e.g., "A2", "B1", "B2").
            2.  "skillsProfile": An object with scores from 0 to 100 for the following five skills:
                - "pronunciation": Assess based on the clarity and accuracy of their spoken responses.
                - "fluency": Assess the smoothness and speed of their speech.
                - "listening": Assess their ability to understand the AI's spoken questions.
                - "vocabulary": Assess the range and appropriateness of words used in both spoken and written tasks.
                - "grammar": Assess the grammatical accuracy of their spoken and written sentences.
            3.  "analysis": A detailed, friendly analysis in VIETNAMESE (3-4 sentences). Start by stating their overall level, then highlight their main strength and pinpoint their biggest area for improvement, giving a specific example from the conversation if possible.
            
            Example of the required JSON output:
            \`\`\`json
            {
              "overallLevel": "B1",
              "skillsProfile": {
                "pronunciation": 75,
                "fluency": 60,
                "listening": 80,
                "vocabulary": 65,
                "grammar": 70
              },
              "analysis": "Trình độ của bạn ở khoảng B1. Bạn có khả năng nghe hiểu tốt và phát âm khá rõ ràng. Tuy nhiên, bạn cần cải thiện sự trôi chảy khi nói và mở rộng vốn từ vựng, ví dụ như trong phần mô tả bức tranh, bạn có thể dùng các tính từ đa dạng hơn."
            }
            \`\`\``;
}

// Hàm tạo prompt cho Flashcard
export function getFlashcardPrompt(level, topic, count) {
    return `You are an expert English teacher. Generate ${count} flashcards for an English learner at the ${level} CEFR level. The topic is "${topic}". For each card, provide the English "word", its IPA transcription in the "ipa" field, its Vietnamese "meaning", and an "example" sentence in English using the word. You MUST wrap your entire response in a 'json' markdown code block. The structure MUST be a valid JSON array of objects: \`\`\`json\n[ { "type": "flashcard", "word": "sustainable", "ipa": "/səˈsteɪnəbl/", "meaning": "bền vững", "example": "We need to find more sustainable sources of energy." } ]\n\`\`\``;
}

// Hàm tạo prompt cho dạng bài Nối từ
export function getMatchingPrompt(level, topic, pairCount) {
    return `You are an expert English teacher. Generate a single 'matching' game question for an English learner at the ${level} CEFR level. The topic is "${topic}". The question object must have a "type" of "matching" and a "pairs" array containing ${pairCount} objects. Each object in the "pairs" array must have an English "word" and its Vietnamese "meaning". You MUST wrap your entire response in a 'json' markdown code block. The structure MUST be a valid JSON object inside a single-element array: \`\`\`json\n[ { "type": "matching", "pairs": [ { "word": "computer", "meaning": "máy vi tính" }, { "word": "keyboard", "meaning": "bàn phím" } ] } ]\n\`\`\``;
}

// Hàm tạo prompt cho dạng bài Sắp xếp chữ cái
export function getWordScramblePrompt(level, topic, count) {
    return `You are an expert English teacher. Generate ${count} 'word scramble' questions for an English learner at the ${level} CEFR level. The topic is "${topic}". For each question, provide a "clue" which is a helpful hint or definition IN VIETNAMESE, and the "answer" which is the single English word to be scrambled. The answer must not contain spaces. You MUST wrap your entire response in a 'json' markdown code block. The structure MUST be a valid JSON array of objects: \`\`\`json\n[ { "type": "word_scramble", "clue": "Một loại trái cây màu đỏ, thường dùng làm salad.", "answer": "tomato" } ]\n\`\`\``;
}

// Hàm tạo prompt cho bài tập từ vựng trắc nghiệm
export function getVocabularyPrompt(level, topic, count) {
    return `You are an expert English teacher. Generate ${count} multiple-choice vocabulary questions for an English learner at the ${level} CEFR level. The topic is "${topic}". For the "answer" field, you MUST provide the full text of the correct option. Provide one correct answer, three plausible distractors, and a brief, helpful explanation IN VIETNAMESE. You MUST wrap your entire response in a 'json' markdown code block. The structure MUST be a valid JSON array of objects: \`\`\`json\n[ { "question": "...", "options": ["..."], "answer": "...", "explanation": "..." } ]\n\`\`\``;
}

// Hàm tạo prompt cho dạng bài Điền vào chỗ trống
export function getFillInTheBlankPrompt(level, topic, count) {
    return `You are an expert English teacher. Generate ${count} 'fill-in-the-blank' vocabulary questions for an English learner at the ${level} CEFR level. The topic is "${topic}". For each item, provide a sentence with "___" and the correct "answer" word. Provide a brief, helpful explanation IN VIETNAMESE. You MUST wrap your entire response in a 'json' markdown code block. The structure MUST be a valid JSON array of objects: \`\`\`json\n[ { "type": "fill_in_the_blank", "question": "The government plans to ___ a new high-speed railway.", "answer": "construct", "explanation": "Construct có nghĩa là 'xây dựng'." } ]\n\`\`\``;
}

// Hàm tạo prompt cho dạng bài Dạng của từ
export function getWordFormationPrompt(level, topic, count) {
    return `You are an expert English teacher. Generate ${count} 'word-formation' questions for an English learner at the ${level} CEFR level. The topic is "${topic}". For each item, provide a sentence with a blank and a base word in parentheses. The "answer" MUST be the single, correctly formed word. Provide a brief, helpful explanation IN VIETNAMESE. You MUST wrap your entire response in a 'json' markdown code block. The structure MUST be a valid JSON array of objects: \`\`\`json\n[ { "type": "word_formation", "question": "Her ___ to the team was a huge benefit. (contribute)", "answer": "contribution", "explanation": "Cần một danh từ ở đây." } ]\n\`\`\``;
}

// Hàm tạo prompt cho bài tập Đọc hiểu
export function getReadingPrompt(level, topic, count) {
    return `You are an expert English teacher. Create a reading comprehension quiz for a ${level} CEFR level learner on the topic of "${topic}". You MUST adhere to the following language rules STRICTLY: - The "passage" MUST be in ENGLISH. - Each object in the "questions" array MUST have a "question" and an "options" array. Both "question" text and all strings within the "options" array MUST be in ENGLISH. - The "answer" field MUST be the full text of the correct option, in ENGLISH. - The "explanation" field is the ONLY field that MUST be in VIETNAMESE. Generate one short reading passage (100-150 words) and ${count} multiple-choice questions. You MUST wrap your entire response in a 'json' markdown code block. The structure MUST be a valid JSON object: \`\`\`json\n{ "passage": "...", "questions": [ { "question": "...", "options": ["..."], "answer": "...", "explanation": "..." } ] }\n\`\`\``;
}

// Hàm tạo prompt cho bài tập Ngữ pháp
export function getGrammarPrompt(level, topic, count) {
    return `You are an expert English grammar teacher. Generate ${count} multiple-choice grammar questions for a ${level} CEFR level learner. Each question MUST specifically test the grammar point: "${topic}". If the topic is "General", you can test any common grammar point. For the "answer" field, you MUST provide the full text of the correct option. Provide one correct answer, three plausible distractors, and a brief, helpful explanation IN VIETNAMESE. You MUST wrap your entire response in a 'json' markdown code block. The structure MUST be a valid JSON array of objects: \`\`\`json\n[ { "question": "...", "options": ["..."], "answer": "...", "explanation": "..." } ]\n\`\`\``;
}

// Hàm tạo prompt cho bài tập Nghe hiểu
export function getListeningPrompt(level, topic, count) {
    return `You are an expert English teacher. Create a listening comprehension quiz. 1. Generate one short monologue or dialogue (50-80 words). The topic is "${topic}" and for a ${level} CEFR level learner. 2. Based on the script, generate ${count} multiple-choice questions. 3. For each question, provide one correct answer, three plausible distractors, and a brief, helpful explanation IN VIETNAMESE. The "answer" field MUST be the full text of the correct option. You MUST wrap your entire response in a 'json' markdown code block. The structure MUST be a valid JSON object: \`\`\`json\n{ "script": "...", "questions": [ { "question": "...", "options": ["..."], "answer": "...", "explanation": "..." } ] }\n\`\`\``;
}

// Hàm tạo prompt cho chủ đề luyện viết
export function getWritingTopicPrompt(level, topic) {
    return `You are an English teacher. Generate a single, engaging writing topic for an English learner at the ${level} CEFR level. The topic should be related to "${topic}". The topic should be a question or a statement to respond to. Provide only the topic text, without any extra labels or quotation marks. Example: "Describe your favorite kind of technology and explain why you like it."`;
}

// Hàm tạo prompt để lấy phản hồi bài viết
export function getWritingFeedbackPrompt(level, topic, userText) {
    return `You are an expert English writing evaluator. A student at the ${level} CEFR level has written the following text about the topic "${topic}". Student's text: """ ${userText} """ Please provide feedback in Vietnamese. You MUST wrap your entire response in a 'json' markdown code block. The JSON object must have the following structure: 1. "overallFeedback": A general comment in Vietnamese (2-3 sentences) on the text's content, clarity, and effort. 2. "score": An integer score from 0 to 100. 3. "correctedTextHTML": The student's original text with corrections. Use "<del>" tags for deleted parts and "<ins>" tags for added parts. This should be a single HTML string. 4. "detailedFeedback": An array of objects, where each object explains a specific mistake. Each object should have: "type", "mistake", "correction", "explanation". Example of the required JSON output: \`\`\`json\n{ "overallFeedback": "...", "score": 75, "correctedTextHTML": "...", "detailedFeedback": [ { "type": "Grammar", "mistake": "...", "correction": "...", "explanation": "..." } ] }\n\`\`\``;
}

// Hàm tạo prompt để củng cố kiến thức
export function getReinforcementPrompt(question, userAnswer, level) {
    const questionText = question.question || question.clue;
    const options = question.options ? JSON.stringify(question.options) : 'N/A';
    return `You are an expert and friendly English tutor AI. A student has made a mistake on a quiz. Your task is to provide a comprehensive, easy-to-understand lesson to help them master the concept they got wrong. The student is at the ${level} CEFR level. Quiz question: - Question: "${questionText}" - Options (if any): ${options} - Correct Answer: "${question.answer}" - Student's Incorrect Answer: "${userAnswer}" Please generate a lesson in Vietnamese. You MUST wrap your entire response in a 'json' markdown code block. The JSON object must have the following structure: 1. "conceptTitle": A short, clear title for the lesson. 2. "mistakeAnalysis": A friendly explanation of why the student's answer was incorrect. 3. "conceptExplanation": A detailed but easy-to-understand explanation of the core concept. 4. "examples": An array of at least 3 distinct objects, each with an "en" and "vi" field. 5. "practiceTip": A final, encouraging tip. Example of the required JSON output: \`\`\`json\n{ "conceptTitle": "...", "mistakeAnalysis": "...", "conceptExplanation": "...", "examples": [ { "en": "...", "vi": "..." } ], "practiceTip": "..." }\n\`\`\``;
}

// Hàm chung để gọi AI và tạo bài kiểm tra dựa trên cài đặt
export async function generateQuizContent(quizSettings, aiModel) {
    const { quizType, vocabMode, level, topic, count } = quizSettings;
    let prompt;

    if (quizType === 'vocabulary' || quizType === 'review') {
        switch(vocabMode) {
            case 'fill_in_the_blank': prompt = getFillInTheBlankPrompt(level, topic, count); break;
            case 'word_formation': prompt = getWordFormationPrompt(level, topic, count); break;
            case 'word_scramble': prompt = getWordScramblePrompt(level, topic, count); break;
            case 'matching': prompt = getMatchingPrompt(level, topic, count); break; 
            case 'flashcard': prompt = getFlashcardPrompt(level, topic, count); break;
            case 'multiple_choice':
            default: prompt = getVocabularyPrompt(level, topic, count);
        }
    } else if (quizType === 'reading') {
        prompt = getReadingPrompt(level, topic, 3); // Reading quizzes typically have 3 questions per passage
    } else if (quizType === 'grammar') {
        prompt = getGrammarPrompt(level, topic, count);
    } else if (quizType === 'listening') {
        prompt = getListeningPrompt(level, topic, 3); // Listening quizzes typically have 3 questions per script
    } else if (quizType === 'placement') {
        prompt = getPlacementTestPrompt();
    } else if (quizType === 'writing_topic') { // Dùng cho việc tạo chủ đề viết
        prompt = getWritingTopicPrompt(level, topic);
    } else {
        throw new Error(`Loại bài tập không xác định: ${quizType}`);
    }
    
    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    const parsedData = extractAndParseJson(response.text());

    if (!parsedData) {
        throw new Error("AI không trả về dữ liệu bài tập hợp lệ.");
    }
    return parsedData;
}

// Hàm để gọi AI và lấy thông tin chi tiết của một từ
export async function fetchWordInfoFromAI(word, aiModel) {
    const prompt = getWordInfoPrompt(word);
    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    const wordInfo = extractAndParseJson(response.text());

    if (!wordInfo || typeof wordInfo.definition !== 'string' || typeof wordInfo.example !== 'string' || typeof wordInfo.ipa !== 'string') {
        console.error("Định dạng không hợp lệ từ AI cho từ:", word, "Phản hồi thô:", response.text());
        throw new Error("AI không trả về định dạng thông tin từ mong muốn.");
    }
    return wordInfo;
}

// Hàm để gọi AI và lấy phân tích kết quả kiểm tra trình độ
export async function getPlacementAnalysis(sessionResults, aiModel) {
    const prompt = getPlacementAnalysisPrompt(sessionResults);
    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    const analysisData = extractAndParseJson(response.text());
    if (!analysisData) throw new Error("AI không trả về phân tích trình độ hợp lệ.");
    return analysisData;
}

// Hàm để gọi AI và lấy lộ trình học tập
export async function getLearningPath(placementResult, goal, aiModel) {
    const prompt = getLearningPathPrompt(placementResult, goal);
    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    const pathData = extractAndParseJson(response.text());
    if (!pathData || !Array.isArray(pathData)) throw new Error("AI không trả về một lộ trình hợp lệ.");
    return pathData;
}

// Hàm để gọi AI và lấy phân tích hội thoại chẩn đoán
export async function getDiagnosticAnalysis(conversationHistory, aiModel) {
    const prompt = getDiagnosticAnalysisPrompt(conversationHistory);
    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    const analysisData = extractAndParseJson(response.text());
    if (!analysisData) throw new Error("AI không trả về phân tích chẩn đoán hợp lệ.");
    return analysisData;
}

// Hàm để gọi AI và lấy phản hồi bài viết
export async function getWritingFeedback(level, topic, userText, aiModel) {
    const prompt = getWritingFeedbackPrompt(level, topic, userText);
    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    const feedbackData = extractAndParseJson(response.text());
    if (!feedbackData) throw new Error("AI không trả về phản hồi bài viết hợp lệ.");
    return feedbackData;
}

// Hàm để gọi AI và lấy bài học củng cố
export async function getReinforcementLesson(question, userAnswer, level, aiModel) {
    const prompt = getReinforcementPrompt(question, userAnswer, level);
    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    const lessonData = extractAndParseJson(response.text());
    if (!lessonData) throw new Error("AI không trả về bài học củng cố hợp lệ.");
    return lessonData;
}

// Hàm logic để xáo trộn chữ cái cho dạng Word Scramble
export function scrambleWord(word) {
    if (word.length < 2) return word;
    let scrambled;
    do {
        scrambled = word.split('').sort(() => 0.5 - Math.random()).join('');
    } while (scrambled === word); // Đảm bảo từ đã xáo trộn không giống từ gốc
    return scrambled;
}
