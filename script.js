/* =====================================================
   STUDYFORGE
   Student Toolkit - V1
   Pure JavaScript
===================================================== */


/* ================= GLOBAL VARIABLES ================= */

let timerInterval = null;

let timerSeconds = 25 * 60;

let timerRunning = false;

let countdownInterval = null;


/* ================= DOM ELEMENTS ================= */

const homePage = document.getElementById("homePage");

const toolPage = document.getElementById("toolPage");

const searchInput = document.getElementById("searchInput");

const themeBtn = document.getElementById("themeBtn");

const mobileMenuBtn =
    document.getElementById("mobileMenuBtn");

const mobileMenu =
    document.getElementById("mobileMenu");


/* =====================================================
   PAGE NAVIGATION
===================================================== */

function openTool(toolName) {

    homePage.classList.add("hidden");

    toolPage.classList.remove("hidden");

    /*
        Hide every tool first.
        Then show only the selected tool.
    */

    const panels =
        document.querySelectorAll(".tool-panel");

    panels.forEach(panel => {
        panel.classList.add("hidden");
    });


    const selectedTool =
        document.getElementById(toolName + "Tool");

    if (selectedTool) {
        selectedTool.classList.remove("hidden");
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function showHome() {

    toolPage.classList.add("hidden");

    homePage.classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =====================================================
   DARK MODE
===================================================== */

function toggleTheme() {

    document.body.classList.toggle("dark-mode");

    const isDark =
        document.body.classList.contains("dark-mode");


    if (isDark) {

        themeBtn.textContent = "☀️";

        localStorage.setItem(
            "studyforge-theme",
            "dark"
        );

    } else {

        themeBtn.textContent = "🌙";

        localStorage.setItem(
            "studyforge-theme",
            "light"
        );
    }
}


/*
    Theme button
*/

themeBtn.addEventListener(
    "click",
    toggleTheme
);


/*
    Load saved theme
*/

const savedTheme =
    localStorage.getItem("studyforge-theme");

if (savedTheme === "dark") {

    document.body.classList.add("dark-mode");

    themeBtn.textContent = "☀️";
}


/* =====================================================
   MOBILE MENU
===================================================== */

mobileMenuBtn.addEventListener(
    "click",
    () => {

        mobileMenu.classList.toggle("active");

    }
);


/*
    Close mobile menu when clicking a link
*/

const mobileLinks =
    mobileMenu.querySelectorAll("a");

mobileLinks.forEach(link => {

    link.addEventListener(
        "click",
        () => {
            mobileMenu.classList.remove("active");
        }
    );

});


/* =====================================================
   SEARCH
===================================================== */

searchInput.addEventListener(
    "input",
    searchTools
);


function searchTools() {

    const searchTerm =
        searchInput.value
            .toLowerCase()
            .trim();


    const cards =
        document.querySelectorAll(".tool-card");


    cards.forEach(card => {

        const toolName =
            card.dataset.name
                .toLowerCase();


        if (
            toolName.includes(searchTerm)
        ) {

            card.style.display = "";

        } else {

            card.style.display = "none";

        }

    });
}


/* =====================================================
   CGPA CALCULATOR
===================================================== */

function addSubject() {

    const container =
        document.getElementById(
            "subjectsContainer"
        );


    const row =
        document.createElement("div");

    row.className = "subject-row";


    row.innerHTML = `

        <input
            type="text"
            placeholder="Subject"
            class="subject-name"
        >

        <input
            type="number"
            placeholder="Grade Point"
            class="grade-point"
            min="0"
            max="10"
            step="0.1"
        >

        <input
            type="number"
            placeholder="Credits"
            class="credit"
            min="0"
            step="0.5"
        >

        <button
            class="remove-btn"
            onclick="removeSubject(this)"
            title="Remove subject"
        >
            ×
        </button>

    `;


    container.appendChild(row);
}


function removeSubject(button) {

    const row =
        button.parentElement;


    const container =
        document.getElementById(
            "subjectsContainer"
        );


    /*
        Don't allow all subjects
        to be removed.
    */

    if (
        container.children.length <= 1
    ) {

        alert(
            "At least one subject is required."
        );

        return;
    }


    row.remove();
}


function calculateCGPA() {

    const rows =
        document.querySelectorAll(
            ".subject-row"
        );


    let totalPoints = 0;

    let totalCredits = 0;


    rows.forEach(row => {

        const gradeInput =
            row.querySelector(
                ".grade-point"
            );

        const creditInput =
            row.querySelector(
                ".credit"
            );


        const grade =
            parseFloat(
                gradeInput.value
            );

        const credit =
            parseFloat(
                creditInput.value
            );


        /*
            Ignore incomplete rows
        */

        if (
            !isNaN(grade) &&
            !isNaN(credit) &&
            grade >= 0 &&
            grade <= 10 &&
            credit > 0
        ) {

            totalPoints +=
                grade * credit;

            totalCredits +=
                credit;
        }

    });


    if (totalCredits === 0) {

        alert(
            "Please enter valid grade points and credits."
        );

        return;
    }


    const cgpa =
        totalPoints / totalCredits;


    document.getElementById(
        "cgpaValue"
    ).textContent =
        cgpa.toFixed(2);


    document.getElementById(
        "cgpaResult"
    ).classList.remove("hidden");
}


/* =====================================================
   POMODORO TIMER
===================================================== */

function updateTimerDisplay() {

    const minutes =
        Math.floor(
            timerSeconds / 60
        );


    const seconds =
        timerSeconds % 60;


    const formattedMinutes =
        String(minutes)
            .padStart(2, "0");


    const formattedSeconds =
        String(seconds)
            .padStart(2, "0");


    document.getElementById(
        "timerDisplay"
    ).textContent =
        `${formattedMinutes}:${formattedSeconds}`;
}


function toggleTimer() {

    if (timerRunning) {

        pauseTimer();

    } else {

        startTimer();

    }
}


function startTimer() {

    timerRunning = true;


    document.getElementById(
        "timerStartBtn"
    ).textContent = "Pause";


    document.getElementById(
        "timerStatus"
    ).textContent =
        "🔥 Stay focused";


    timerInterval =
        setInterval(() => {

            timerSeconds--;

            updateTimerDisplay();


            if (timerSeconds <= 0) {

                clearInterval(
                    timerInterval
                );

                timerRunning = false;

                timerSeconds = 25 * 60;

                updateTimerDisplay();


                document.getElementById(
                    "timerStartBtn"
                ).textContent = "Start";


                document.getElementById(
                    "timerStatus"
                ).textContent =
                    "🎉 Focus session completed!";

                alert(
                    "Pomodoro complete! Take a short break."
                );
            }

        }, 1000);
}


function pauseTimer() {

    clearInterval(
        timerInterval
    );


    timerRunning = false;


    document.getElementById(
        "timerStartBtn"
    ).textContent = "Start";


    document.getElementById(
        "timerStatus"
    ).textContent =
        "Timer paused";
}


function resetTimer() {

    clearInterval(
        timerInterval
    );


    timerRunning = false;

    timerSeconds = 25 * 60;


    updateTimerDisplay();


    document.getElementById(
        "timerStartBtn"
    ).textContent = "Start";


    document.getElementById(
        "timerStatus"
    ).textContent =
        "Ready to focus";
}


/* =====================================================
   EXAM COUNTDOWN
===================================================== */

function startCountdown() {

    const examName =
        document.getElementById(
            "examName"
        ).value.trim();


    const examDate =
        document.getElementById(
            "examDate"
        ).value;


    if (!examDate) {

        alert(
            "Please select your exam date."
        );

        return;
    }


    const targetDate =
        new Date(examDate).getTime();


    const now =
        new Date().getTime();


    if (targetDate <= now) {

        alert(
            "Please select a future date."
        );

        return;
    }


    clearInterval(
        countdownInterval
    );


    document.getElementById(
        "countdownExamName"
    ).textContent =
        examName ||
        "Your Exam";


    document.getElementById(
        "countdownResult"
    ).classList.remove(
        "hidden"
    );


    function updateCountdown() {

        const currentTime =
            new Date().getTime();


        const difference =
            targetDate - currentTime;


        if (difference <= 0) {

            clearInterval(
                countdownInterval
            );


            document.getElementById(
                "countdownDisplay"
            ).textContent =
                "🎉 It's time!";


            return;
        }


        const days =
            Math.floor(
                difference /
                (1000 * 60 * 60 * 24)
            );


        const hours =
            Math.floor(
                (
                    difference /
                    (1000 * 60 * 60)
                ) % 24
            );


        const minutes =
            Math.floor(
                (
                    difference /
                    (1000 * 60)
                ) % 60
            );


        const seconds =
            Math.floor(
                (
                    difference /
                    1000
                ) % 60
            );


        document.getElementById(
            "countdownDisplay"
        ).textContent =
            `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }


    updateCountdown();


    countdownInterval =
        setInterval(
            updateCountdown,
            1000
        );
}


/* =====================================================
   WORD COUNTER
===================================================== */

const textInput =
    document.getElementById(
        "textInput"
    );


textInput.addEventListener(
    "input",
    updateWordStats
);


function updateWordStats() {

    const text =
        textInput.value;


    /*
        Word calculation
    */

    const trimmedText =
        text.trim();


    let words = 0;


    if (trimmedText.length > 0) {

        words =
            trimmedText
                .split(/\s+/)
                .length;
    }


    /*
        Character count
    */

    const characters =
        text.length;


    /*
        Sentence count
    */

    const sentences =
        trimmedText.length === 0
            ? 0
            : trimmedText
                .split(/[.!?]+/)
                .filter(
                    sentence =>
                        sentence.trim().length > 0
                )
                .length;


    document.getElementById(
        "wordCount"
    ).textContent =
        words;


    document.getElementById(
        "characterCount"
    ).textContent =
        characters;


    document.getElementById(
        "sentenceCount"
    ).textContent =
        sentences;
}


/* =====================================================
   INITIALIZATION
===================================================== */

updateTimerDisplay();


async function connectStudyForgeBackend() {
  try {
    const response = await fetch("/api/health");

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    console.log("StudyForge backend connected successfully!", data);
  } catch (error) {
    console.error("StudyForge backend connection failed:", error);
  }
}

connectStudyForgeBackend();

// ========================================
// STUDYFORGE: STUDY PLANNER
// ========================================

const taskForm = document.getElementById("task-form");
const taskList = document.getElementById("task-list");
const plannerMessage = document.getElementById("planner-message");

const totalTasksElement = document.getElementById("total-tasks");
const pendingTasksElement = document.getElementById("pending-tasks");
const completedTasksElement = document.getElementById("completed-tasks");

// Load tasks from the SQLite database
 
async function loadStudyTasks() {
  try {
    const response = await fetch("/api/tasks");

    if (!response.ok) {
      throw new Error("Could not load tasks.");
    }

    const tasks = await response.json();

    // Dashboard always uses every task.
    updateStudyDashboard(tasks);

    // Task list displays only matching tasks.
    renderStudyTasks(tasks);

    plannerMessage.textContent = "";
  } catch (error) {
    console.error(error);
    plannerMessage.textContent =
      "Unable to load tasks. Check that the backend is running.";
  }
}

// Display tasks on the page

function renderStudyTasks(tasks) {
  taskList.replaceChildren();

  // Keep these counts based on ALL tasks.
  const completedCount = tasks.filter(
    task => Number(task.completed) === 1
  ).length;

  totalTasksElement.textContent = tasks.length;
  completedTasksElement.textContent = completedCount;
  pendingTasksElement.textContent = tasks.length - completedCount;

  // Read filter values.
  const subjectFilter = document
    .getElementById("filter-subject")
    .value.trim().toLowerCase();

  const deadlineFilter = document
    .getElementById("filter-deadline")
    .value;

  const statusFilter = document
    .getElementById("filter-status")
    .value;

  // Filter only the visible task list.
  const filteredTasks = tasks.filter(task => {
    const matchesSubject = String(task.subject || "")
      .toLowerCase()
      .includes(subjectFilter);

    const matchesDeadline =
      !deadlineFilter || task.deadline === deadlineFilter;

    const isCompleted = Number(task.completed) === 1;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "completed" && isCompleted) ||
      (statusFilter === "pending" && !isCompleted);

    return matchesSubject && matchesDeadline && matchesStatus;
  });

  if (filteredTasks.length === 0) {
    const emptyMessage = document.createElement("p");

    emptyMessage.textContent = tasks.length === 0
      ? "No tasks yet. Add your first study task above!"
      : "No tasks match these filters. Try changing or clearing them.";

    taskList.appendChild(emptyMessage);
    return;
  }

  filteredTasks.forEach(task => {
    const isCompleted = Number(task.completed) === 1;

    const card = document.createElement("article");
    card.className = "task-card";

    if (isCompleted) {
      card.classList.add("is-completed");
    }

    const details = document.createElement("div");

    const title = document.createElement("h3");
    title.textContent = task.title;

    const subject = document.createElement("p");
    subject.textContent = `Subject: ${task.subject}`;

    const deadline = document.createElement("p");
    deadline.textContent = task.deadline
      ? `Deadline: ${task.deadline}`
      : "No deadline";

    const priority = document.createElement("p");
    priority.textContent = `Priority: ${String(task.priority || "").toUpperCase()}`;

    details.append(title, subject, deadline, priority);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const completeButton = document.createElement("button");
    completeButton.type = "button";
    completeButton.textContent = isCompleted
      ? "Mark Pending"
      : "Mark Complete";

    completeButton.addEventListener("click", async () => {
      await updateStudyTask(task.id, {
        completed: !isCompleted
      });
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", async () => {
      const confirmed = window.confirm(`Delete "${task.title}"?`);

      if (confirmed) {
        await deleteStudyTask(task.id);
      }
    });

    actions.append(completeButton, deleteButton);
    card.append(details, actions);
    taskList.appendChild(card);
  });
}

const subjectFilterInput = document.getElementById("filter-subject");
const deadlineFilterInput = document.getElementById("filter-deadline");
const statusFilterInput = document.getElementById("filter-status");
const clearFiltersButton = document.getElementById("clear-filters");

subjectFilterInput.addEventListener("input", () => {
  loadStudyTasks();
});

deadlineFilterInput.addEventListener("change", () => {
  loadStudyTasks();
});

statusFilterInput.addEventListener("change", () => {
  loadStudyTasks();
});

clearFiltersButton.addEventListener("click", () => {
  subjectFilterInput.value = "";
  deadlineFilterInput.value = "";
  statusFilterInput.value = "all";

  loadStudyTasks();
});

// Add a new task
taskForm.addEventListener("submit", async event => {
  event.preventDefault();

  const subject = document
    .getElementById("task-subject").value.trim();

  const title = document
    .getElementById("task-title").value.trim();

  const deadline = document
    .getElementById("task-deadline").value;

  const priority = document
    .getElementById("task-priority").value;

  try {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        subject,
        title,
        deadline: deadline || null,
        priority
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Could not add task.");
    }

    taskForm.reset();
    plannerMessage.textContent = "Task added successfully!";
    await loadStudyTasks();
  } catch (error) {
    console.error(error);
    plannerMessage.textContent = error.message;
  }
});

// Update task completion status
async function updateStudyTask(id, changes) {
  try {
    const response = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(changes)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Could not update task.");
    }

    plannerMessage.textContent = "Task updated!";
    await loadStudyTasks();
  } catch (error) {
    console.error(error);
    plannerMessage.textContent = error.message;
  }
}

// Delete a task
async function deleteStudyTask(id) {
  try {
    const response = await fetch(`/api/tasks/${id}`, {
      method: "DELETE"
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Could not delete task.");
    }

    plannerMessage.textContent = "Task deleted.";
    await loadStudyTasks();
  } catch (error) {
    console.error(error);
    plannerMessage.textContent = error.message;
  }
}

// Load saved tasks when the page opens
loadStudyTasks();

// ========================================
// STUDYFORGE DASHBOARD ANALYTICS
// ========================================

function updateStudyDashboard(tasks) {
  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  const completedTasks = tasks.filter(
    task => Number(task.completed) === 1
  );

  const pendingTasks = tasks.filter(
    task => Number(task.completed) !== 1
  );

  const todayTasks = tasks.filter(
    task => task.deadline === todayString
  );

  const completionRate = tasks.length
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;

  // Update overview cards
  document.getElementById("dashboard-date").textContent =
    today.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });

  document.getElementById("dashboard-today").textContent =
    todayTasks.length;

  document.getElementById("dashboard-pending").textContent =
    pendingTasks.length;

  document.getElementById("dashboard-completion").textContent =
    `${completionRate}%`;

  document.getElementById("dashboard-total").textContent =
    tasks.length;

  document.getElementById("dashboard-progress-fill").style.width =
    `${completionRate}%`;

  renderCompletionChart(completedTasks.length, pendingTasks.length);
  renderSubjectChart(tasks);
}

// Completed vs pending donut chart
function renderCompletionChart(completed, pending) {
  const chart = document.getElementById("completion-chart");
  const total = completed + pending;

  chart.replaceChildren();

  if (total === 0) {
    const message = document.createElement("p");
    message.textContent = "Add tasks to see your progress.";
    chart.appendChild(message);
    return;
  }

  const percentage = Math.round((completed / total) * 100);

  const donut = document.createElement("div");
  donut.className = "completion-donut";

  const degrees = (completed / total) * 360;
  donut.style.background =
    `conic-gradient(#6366f1 0deg ${degrees}deg, #e5e7eb ${degrees}deg 360deg)`;

  const center = document.createElement("div");
  center.className = "completion-donut-center";

  const percent = document.createElement("strong");
  percent.textContent = `${percentage}%`;

  const label = document.createElement("span");
  label.textContent = "Completed";

  center.append(percent, label);
  donut.appendChild(center);

  const legend = document.createElement("div");
  legend.className = "chart-legend";

  [
    { label: "Completed", count: completed, color: "#6366f1" },
    { label: "Pending", count: pending, color: "#e5e7eb" }
  ].forEach(item => {
    const entry = document.createElement("span");
    entry.className = "legend-item";

    const dot = document.createElement("span");
    dot.className = "legend-dot";
    dot.style.background = item.color;

    const text = document.createElement("span");
    text.textContent = `${item.label}: ${item.count}`;

    entry.append(dot, text);
    legend.appendChild(entry);
  });

  chart.append(donut, legend);
}

// Subject-wise completion chart
function renderSubjectChart(tasks) {
  const chart = document.getElementById("subject-chart");
  chart.replaceChildren();

  const subjects = {};

  tasks.forEach(task => {
    const subject = task.subject || "Other";

    if (!subjects[subject]) {
      subjects[subject] = { total: 0, completed: 0 };
    }

    subjects[subject].total++;

    if (Number(task.completed) === 1) {
      subjects[subject].completed++;
    }
  });

  const subjectNames = Object.keys(subjects);

  if (subjectNames.length === 0) {
    const message = document.createElement("p");
    message.textContent = "Add tasks to see subject statistics.";
    chart.appendChild(message);
    return;
  }

  subjectNames.sort((a, b) => a.localeCompare(b));

  subjectNames.forEach(subject => {
    const data = subjects[subject];
    const rate = Math.round(
      (data.completed / data.total) * 100
    );

    const row = document.createElement("div");

    const header = document.createElement("div");
    header.className = "subject-progress-header";

    const name = document.createElement("strong");
    name.textContent = subject;

    const count = document.createElement("span");
    count.textContent = `${data.completed}/${data.total} · ${rate}%`;

    header.append(name, count);

    const track = document.createElement("div");
    track.className = "subject-progress-track";

    const fill = document.createElement("div");
    fill.className = "subject-progress-fill";
    fill.style.width = `${rate}%`;

    track.appendChild(fill);
    row.append(header, track);
    chart.appendChild(row);
  });
}

