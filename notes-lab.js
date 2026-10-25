const fileInput = document.getElementById("pdf-file");
const dropzone = document.getElementById("dropzone");
const selectedFileBox = document.getElementById("selected-file");
const fileName = document.getElementById("file-name");
const fileSize = document.getElementById("file-size");
const removeFileBtn = document.getElementById("remove-file");
const extractBtn = document.getElementById("extract-btn");
const statusText = document.getElementById("status");
const progressTrack = document.getElementById("progress-track");
const progressFill = document.getElementById("progress-fill");
const extractedText = document.getElementById("extracted-text");
const highlightedText = document.getElementById("highlighted-text");
const wordCount = document.getElementById("word-count");
const pageCount = document.getElementById("page-count");
const searchInput = document.getElementById("search-input");
const searchStatus = document.getElementById("search-status");
const copyBtn = document.getElementById("copy-btn");
const downloadBtn = document.getElementById("download-btn");
const clearBtn = document.getElementById("clear-btn");

const fontDecreaseBtn = document.getElementById("font-decrease");
const fontIncreaseBtn = document.getElementById("font-increase");

const saveHighlightBtn = document.getElementById("save-highlight");
const downloadHighlightsBtn = document.getElementById("download-highlights");
const bookmarkMessage = document.getElementById("bookmark-message");
const savedHighlightsContainer = document.getElementById("saved-highlights");

let savedHighlights = [];
let notesFontSize = 14;
let selectedFile = null;
let extractedPages = 0;
let currentMatchIndex = 0;
let extractionInProgress = false;

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
} else {
  statusText.textContent =
    "PDF library could not load. Check your internet connection and refresh.";
}

function formatFileSize(bytes) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function updateCounts() {
  const text = extractedText.value.trim();
  const words = text ? text.split(/\s+/).length : 0;

  wordCount.textContent = `${words} words`;
  pageCount.textContent = `${extractedPages} pages`;

  const hasText = text.length > 0;
  searchInput.disabled = !hasText;
  copyBtn.disabled = !hasText;
  clearBtn.disabled = !hasText;
  downloadBtn.disabled = !hasText;
  
fontDecreaseBtn.disabled = !hasText || notesFontSize <= 10;
fontIncreaseBtn.disabled = !hasText || notesFontSize >= 24;


  updateSearch();
}

function updateSearch() {
  const query = searchInput.value.trim();
  const text = extractedText.value;

  highlightedText.replaceChildren();

  if (!text) {
    highlightedText.textContent =
      "Your extracted PDF text will appear here...";
    searchStatus.textContent = "";
    return;
  }

  if (!query) {
    highlightedText.textContent = text;
    searchStatus.textContent = "";
    currentMatchIndex = 0;
    return;
  }

  const escapedQuery = query.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const regex = new RegExp(escapedQuery, "gi");
  const matches = [...text.matchAll(regex)];

  let lastIndex = 0;

  matches.forEach((match, index) => {
    const start = match.index;
    const end = start + match[0].length;

    highlightedText.append(
      document.createTextNode(text.slice(lastIndex, start))
    );

    const mark = document.createElement("mark");
    mark.textContent = text.slice(start, end);

    if (index === currentMatchIndex) {
      mark.classList.add("current-match");
    }

    highlightedText.append(mark);
    lastIndex = end;
  });

  highlightedText.append(
    document.createTextNode(text.slice(lastIndex))
  );

  if (matches.length) {
    currentMatchIndex = currentMatchIndex % matches.length;
    const marks = highlightedText.querySelectorAll("mark");
    marks[currentMatchIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    searchStatus.textContent =
      `${matches.length} match(es) found. Highlighted in yellow; current match in orange.`;
  } else {
    searchStatus.textContent = "No matches found.";
  }
}

function resetExtractedNotes() {
  extractedText.value = "";
  extractedPages = 0;
  searchInput.value = "";
  updateCounts();
}

function setSelectedFile(file) {
  if (extractionInProgress) {
    statusText.textContent = "Please wait for the current extraction to finish.";
    return;
  }

  if (!file) return;

  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    statusText.textContent = "Please select a PDF file.";
    return;
  }

  if (file.size > 15 * 1024 * 1024) {
    statusText.textContent = "File is too large. Maximum size is 15 MB.";
    return;
  }

  if (file.size === 0) {
    statusText.textContent = "This file is empty. Please choose another PDF.";
    return;
  }

  selectedFile = file;
  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);

  selectedFileBox.hidden = false;
  extractBtn.disabled = false;
  progressTrack.hidden = true;
  progressFill.style.width = "0%";

  resetExtractedNotes();
  statusText.textContent = "PDF selected. Ready to extract text.";
}

fileInput.addEventListener("change", () => {
  setSelectedFile(fileInput.files[0]);
});

removeFileBtn.addEventListener("click", () => {
  if (extractionInProgress) return;

  selectedFile = null;
  fileInput.value = "";
  selectedFileBox.hidden = true;
  extractBtn.disabled = true;
  progressTrack.hidden = true;

  resetExtractedNotes();
  statusText.textContent = "Choose a PDF to get started.";
});

dropzone.addEventListener("dragover", event => {
  event.preventDefault();
  dropzone.classList.add("dragging");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("dragging");
});

dropzone.addEventListener("drop", event => {
  event.preventDefault();
  dropzone.classList.remove("dragging");

  const file = event.dataTransfer.files[0];
  setSelectedFile(file);
});

extractBtn.addEventListener("click", async () => {
  if (!selectedFile || extractionInProgress) return;

  if (!window.pdfjsLib) {
    statusText.textContent = "PDF library unavailable. Refresh the page and try again.";
    return;
  }

  extractionInProgress = true;
  extractBtn.disabled = true;
  removeFileBtn.disabled = true;
  fileInput.disabled = true;
  progressTrack.hidden = false;
  progressFill.style.width = "0%";

  resetExtractedNotes();
  statusText.textContent = "Reading your PDF...";

  let pdfDocument = null;

  try {
    const buffer = await selectedFile.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const signature = String.fromCharCode(...bytes.slice(0, 5));

    if (signature !== "%PDF-") {
      throw new Error("This file does not appear to be a valid PDF.");
    }

    const loadingTask = pdfjsLib.getDocument({ data: bytes });
    pdfDocument = await loadingTask.promise;

    const pageTexts = [];

    for (let pageNumber = 1;
         pageNumber <= pdfDocument.numPages;
         pageNumber++) {

      const page = await pdfDocument.getPage(pageNumber);
      const content = await page.getTextContent();

      const text = content.items
        .filter(item => typeof item.str === "string")
        .map(item => item.str)
        .join(" ");

      pageTexts.push(`--- Page ${pageNumber} ---\n${text}`);

      const progress = Math.round(
        (pageNumber / pdfDocument.numPages) * 100
      );

      progressFill.style.width = `${progress}%`;
      statusText.textContent =
        `Extracting page ${pageNumber} of ${pdfDocument.numPages}...`;
    }

    extractedPages = pdfDocument.numPages;
    extractedText.value = pageTexts.join("\n\n");
    updateCounts();

    statusText.textContent = extractedText.value.trim()
      ? "Extraction complete! Your notes are ready."
      : "No selectable text found. This may be a scanned PDF; OCR support can be added later.";

  } catch (error) {
    console.error("PDF extraction error:", error);
    statusText.textContent =
      error.message || "Could not read this PDF. Try another file.";
    resetExtractedNotes();

  } finally {
    if (pdfDocument) {
      try {
        await pdfDocument.destroy();
      } catch (error) {
        console.warn("PDF cleanup issue:", error);
      }
    }

    extractionInProgress = false;
    extractBtn.disabled = !selectedFile;
    removeFileBtn.disabled = false;
    fileInput.disabled = false;
  }
});

searchInput.addEventListener("input", updateSearch);

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(extractedText.value);
    statusText.textContent = "Notes copied to clipboard!";
  } catch {
    extractedText.focus();
    extractedText.select();

    const copied = document.execCommand("copy");
    statusText.textContent = copied
      ? "Notes copied to clipboard!"
      : "Copy failed. Select the text and copy it manually.";
  }
});

clearBtn.addEventListener("click", () => {
  if (extractionInProgress) return;

  resetExtractedNotes();
  statusText.textContent = "Extracted notes cleared.";
});

// ======================================
// STUDYFORGE REVISION LAB
// Flashcards + Quiz Mode (no AI API)
// ======================================

const flashcardsTab = document.getElementById("flashcards-tab");
const quizTab = document.getElementById("quiz-tab");
const flashcardsPanel = document.getElementById("flashcards-panel");
const quizPanel = document.getElementById("quiz-panel");
const revisionMessage = document.getElementById("revision-message");

const generateFlashcardsBtn = document.getElementById("generate-flashcards");
const flashcardArea = document.getElementById("flashcard-area");
const flashcard = document.getElementById("flashcard");
const flashcardLabel = document.getElementById("flashcard-label");
const flashcardContent = document.getElementById("flashcard-content");
const flashcardHint = document.getElementById("flashcard-hint");
const cardCounter = document.getElementById("card-counter");
const previousCardBtn = document.getElementById("previous-card");
const nextCardBtn = document.getElementById("next-card");
const flipCardBtn = document.getElementById("flip-card");

const generateQuizBtn = document.getElementById("generate-quiz");
const quizArea = document.getElementById("quiz-area");
const quizProgress = document.getElementById("quiz-progress");
const quizScore = document.getElementById("quiz-score");
const quizQuestion = document.getElementById("quiz-question");
const quizOptions = document.getElementById("quiz-options");
const quizFeedback = document.getElementById("quiz-feedback");
const nextQuestionBtn = document.getElementById("next-question");

let flashcards = [];
let flashcardIndex = 0;
let showingAnswer = false;

let quizQuestions = [];
let quizIndex = 0;
let score = 0;
let answeredCurrentQuestion = false;

// Common words are ignored when choosing a word for revision.
const ignoredWords = new Set([
  "about", "above", "after", "again", "against", "along",
  "also", "among", "another", "because", "before", "being",
  "between", "both", "could", "does", "during", "each",
  "education", "every", "first", "from", "further", "have",
  "having", "here", "into", "itself", "just", "learn",
  "learning", "lesson", "material", "more", "most", "other",
  "our", "over", "page", "pages", "same", "should", "since",
  "some", "such", "than", "that", "their", "them", "there",
  "these", "they", "this", "those", "through", "under",
  "until", "very", "what", "when", "where", "which", "while",
  "with", "within", "without", "would", "your"
]);

function getRevisionSentences() {
  const rawText = extractedText.value.trim();

  if (!rawText) {
    return [];
  }

  return rawText
    .replace(/---\s*Page\s+\d+\s*---/gi, " ")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(sentence => {
      const words = sentence.split(/\s+/);
      return words.length >= 6 && sentence.length >= 35;
    });
}

function getKeyword(sentence) {
  const words = sentence.match(/[A-Za-z][A-Za-z'-]*/g) || [];

  const candidates = words.filter(word => {
    const lower = word.toLowerCase();

    return (
      lower.length >= 5 &&
      !ignoredWords.has(lower) &&
      !/^\d+$/.test(lower)
    );
  });

  if (!candidates.length) {
    return null;
  }

  // Prefer longer, more specific words.
  candidates.sort((a, b) => b.length - a.length);

  return candidates[0];
}

function createRevisionItems() {
  const sentences = getRevisionSentences();
  const seen = new Set();
  const items = [];

  sentences.forEach(sentence => {
    const answer = getKeyword(sentence);

    if (!answer) return;

    const key = sentence.toLowerCase();

    if (seen.has(key)) return;
    seen.add(key);

    const blankedSentence = sentence.replace(
      new RegExp(answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
      "________"
    );

    items.push({
      sentence,
      question: `Complete the sentence:\n${blankedSentence}`,
      answer
    });
  });

  return items;
}

// ---------- Tabs ----------

flashcardsTab.addEventListener("click", () => {
  flashcardsTab.classList.add("active");
  quizTab.classList.remove("active");

  flashcardsPanel.hidden = false;
  quizPanel.hidden = true;
});

quizTab.addEventListener("click", () => {
  quizTab.classList.add("active");
  flashcardsTab.classList.remove("active");

  quizPanel.hidden = false;
  flashcardsPanel.hidden = true;
});

// ---------- Flashcards ----------

function renderFlashcard() {
  if (!flashcards.length) return;

  const card = flashcards[flashcardIndex];

  flashcardLabel.textContent = showingAnswer ? "ANSWER" : "QUESTION";
  flashcardContent.textContent = showingAnswer
    ? card.answer
    : card.question;

  flashcardHint.textContent = showingAnswer
    ? "Click to see the question again"
    : "Click to reveal answer";

  cardCounter.textContent =
    `Card ${flashcardIndex + 1} of ${flashcards.length}`;

  previousCardBtn.disabled = flashcardIndex === 0;
  nextCardBtn.disabled = flashcardIndex === flashcards.length - 1;

  flipCardBtn.textContent = showingAnswer
    ? "Show Question"
    : "Reveal Answer";
}

function flipFlashcard() {
  showingAnswer = !showingAnswer;
  renderFlashcard();
}

flashcard.addEventListener("click", flipFlashcard);
flipCardBtn.addEventListener("click", flipFlashcard);

previousCardBtn.addEventListener("click", () => {
  if (flashcardIndex > 0) {
    flashcardIndex--;
    showingAnswer = false;
    renderFlashcard();
  }
});

nextCardBtn.addEventListener("click", () => {
  if (flashcardIndex < flashcards.length - 1) {
    flashcardIndex++;
    showingAnswer = false;
    renderFlashcard();
  }
});

generateFlashcardsBtn.addEventListener("click", () => {
  flashcards = createRevisionItems();
  flashcardIndex = 0;
  showingAnswer = false;

  if (!flashcards.length) {
    revisionMessage.textContent =
      "Not enough readable text found. Extract a text-based PDF with complete sentences.";
    flashcardArea.hidden = true;
    return;
  }

  revisionMessage.textContent =
    `${flashcards.length} flashcards generated from your extracted notes. Check the questions and answers as you revise.`;

  flashcardArea.hidden = false;
  renderFlashcard();
});

// ---------- Quiz ----------

function shuffleArray(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function buildQuiz() {
  const items = createRevisionItems();
  const uniqueAnswers = [...new Set(
    items.map(item => item.answer.toLowerCase())
  )];

  if (items.length < 2 || uniqueAnswers.length < 2) {
    return [];
  }

  return shuffleArray(items).map(item => {
    const otherAnswers = uniqueAnswers.filter(
      answer => answer !== item.answer.toLowerCase()
    );

    const distractors = shuffleArray(otherAnswers).slice(0, 3);

    const options = shuffleArray([
      item.answer,
      ...distractors
    ]);

    return {
      question: item.question,
      answer: item.answer,
      options
    };
  });
}

function renderQuizQuestion() {
  const question = quizQuestions[quizIndex];

  if (!question) return;

  answeredCurrentQuestion = false;
  quizProgress.textContent =
    `Question ${quizIndex + 1} of ${quizQuestions.length}`;
  quizScore.textContent = `Score: ${score}/${quizQuestions.length}`;

  quizQuestion.textContent = question.question;
  quizFeedback.textContent = "";
  quizOptions.replaceChildren();

  nextQuestionBtn.disabled = true;
  nextQuestionBtn.textContent =
    quizIndex === quizQuestions.length - 1
      ? "View Results"
      : "Next Question →";

  question.options.forEach(option => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-option";
    button.textContent = option;

    button.addEventListener("click", () => {
      if (answeredCurrentQuestion) return;

      answeredCurrentQuestion = true;

      const correct =
        option.toLowerCase() === question.answer.toLowerCase();

      if (correct) {
        score++;
        quizFeedback.textContent = "Correct! Nice work.";
      } else {
        quizFeedback.textContent =
          `Not quite. The answer from your notes is: ${question.answer}`;
      }

      [...quizOptions.children].forEach(optionButton => {
        optionButton.disabled = true;

        if (
          optionButton.textContent.toLowerCase() ===
          question.answer.toLowerCase()
        ) {
          optionButton.classList.add("correct");
        } else if (optionButton === button && !correct) {
          optionButton.classList.add("incorrect");
        }
      });

      quizScore.textContent = `Score: ${score}/${quizQuestions.length}`;
      nextQuestionBtn.disabled = false;
    });

    quizOptions.append(button);
  });
}

generateQuizBtn.addEventListener("click", () => {
  quizQuestions = buildQuiz();
  quizIndex = 0;
  score = 0;

  if (!quizQuestions.length) {
    revisionMessage.textContent =
      "Not enough text to create a quiz. Try a PDF with more complete sentences.";
    quizArea.hidden = true;
    return;
  }

  revisionMessage.textContent =
    `${quizQuestions.length} quiz questions generated from your notes.`;

  quizArea.hidden = false;
  renderQuizQuestion();
});

nextQuestionBtn.addEventListener("click", () => {
  if (!answeredCurrentQuestion) return;

  if (quizIndex < quizQuestions.length - 1) {
    quizIndex++;
    renderQuizQuestion();
    return;
  }

  const percentage = Math.round(
    (score / quizQuestions.length) * 100
  );

  quizQuestion.textContent = "Quiz completed! 🎉";
  quizOptions.replaceChildren();

  quizFeedback.textContent =
    `Your final score: ${score}/${quizQuestions.length} (${percentage}%).`;

  quizProgress.textContent = "Completed";
  nextQuestionBtn.disabled = true;
  nextQuestionBtn.textContent = "Generate New Quiz";
});

// Allow the last button to start a fresh quiz after results.
nextQuestionBtn.addEventListener("click", () => {
  if (
    quizQuestions.length &&
    quizIndex === quizQuestions.length - 1 &&
    answeredCurrentQuestion
  ) {
    // Results are shown after the final answer; a new quiz
    // can always be started with Generate Quiz.
  }
});

downloadBtn.addEventListener("click", () => {
  const text = extractedText.value.trim();

  if (!text) {
    statusText.textContent = "Extract notes before downloading.";
    return;
  }

  const blob = new Blob([text], {
    type: "text/plain;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const originalName = selectedFile
    ? selectedFile.name.replace(/\.pdf$/i, "")
    : "StudyForge-Notes";

  link.href = url;
  link.download = `${originalName}-notes.txt`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  statusText.textContent = "Your notes download has started!";
});


function updateNotesFontSize() {
  highlightedText.style.fontSize = `${notesFontSize}px`;
}

fontIncreaseBtn.addEventListener("click", () => {
  notesFontSize = Math.min(notesFontSize + 2, 24);
  updateNotesFontSize();
});

fontDecreaseBtn.addEventListener("click", () => {
  notesFontSize = Math.max(notesFontSize - 2, 10);
  updateNotesFontSize();
});



function renderSavedHighlights() {
  savedHighlightsContainer.replaceChildren();

  if (savedHighlights.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "muted";
    emptyMessage.textContent = "No saved highlights yet.";
    savedHighlightsContainer.appendChild(emptyMessage);
  }

  savedHighlights.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "saved-highlight-card";

    const heading = document.createElement("strong");
    heading.textContent = item.subject;

    const content = document.createElement("p");
    content.textContent = item.text;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "secondary-button";
    removeButton.textContent = "Remove";

    removeButton.addEventListener("click", () => {
      savedHighlights.splice(index, 1);
      localStorage.setItem(
        "studyforge-highlights",
        JSON.stringify(savedHighlights)
      );
      renderSavedHighlights();
    });

    card.append(heading, content, removeButton);
    savedHighlightsContainer.appendChild(card);
  });

  downloadHighlightsBtn.disabled = savedHighlights.length === 0;
}

function updateHighlightButtons() {
  const hasText = extractedText.value.trim().length > 0;
  saveHighlightBtn.disabled = !hasText;
}

saveHighlightBtn.addEventListener("click", () => {
  const selection = window.getSelection()?.toString().trim();

  if (!selection) {
    bookmarkMessage.textContent =
      "First select an important line in your extracted notes.";
    return;
  }

  const existing = savedHighlights.some(item => item.text === selection);

  if (existing) {
    bookmarkMessage.textContent = "This line is already saved.";
    return;
  }

  savedHighlights.push({
    subject: selectedFile
      ? selectedFile.name.replace(/\.pdf$/i, "")
      : "My Notes",
    text: selection
  });

  localStorage.setItem(
    "studyforge-highlights",
    JSON.stringify(savedHighlights)
  );

  bookmarkMessage.textContent = "Important line saved! ⚡";
  renderSavedHighlights();
});

downloadHighlightsBtn.addEventListener("click", () => {
  if (savedHighlights.length === 0) return;

  const escapeHTML = value =>
    value.replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  const cards = savedHighlights.map(item => `
    <article class="highlight">
      <h2>${escapeHTML(item.subject)}</h2>
      <p>${escapeHTML(item.text)}</p>
    </article>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>StudyForge Revision Notes</title>
<style>
body{font-family:Arial,sans-serif;max-width:850px;margin:40px auto;padding:20px;line-height:1.8;color:#172033}
h1{color:#4338ca}
.highlight{background:#fff3a3;border-left:5px solid #eab308;padding:12px 18px;margin:18px 0;border-radius:6px}
@media print{body{margin:0}.highlight{break-inside:avoid}}
</style>
</head>
<body>
<h1>StudyForge — Revision Notes</h1>
<p>Your saved important lines</p>
${cards}
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "StudyForge-Highlighted-Notes.html";
  link.click();

  URL.revokeObjectURL(url);
});

try {
  const storedHighlights = JSON.parse(
    localStorage.getItem("studyforge-highlights") || "[]"
  );

  if (Array.isArray(storedHighlights)) {
    savedHighlights = storedHighlights.filter(
      item =>
        item &&
        typeof item.subject === "string" &&
        typeof item.text === "string"
    );
  }
} catch {
  savedHighlights = [];
}

renderSavedHighlights();
updateHighlightButtons();
