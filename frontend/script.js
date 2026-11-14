
const newsInput = document.getElementById("newsInput");
const charCount = document.getElementById("charCount");

const checkBtn = document.getElementById("checkBtn");
const clearBtn = document.getElementById("clearBtn");
const sampleBtn = document.getElementById("sampleBtn");

const errorMessage = document.getElementById("errorMessage");
const loadingMessage = document.getElementById("loadingMessage");

const resultSection = document.getElementById("resultSection");
const overallResult = document.getElementById("overallResult");
const resultsDiv = document.getElementById("results");

const agreementValue = document.getElementById("agreementValue");
const agreementBar = document.getElementById("agreementBar");
const agreementText = document.getElementById("agreementText");


// Update character count
newsInput.addEventListener("input", function () {
    charCount.textContent =
        `${newsInput.value.length.toLocaleString()} / 20,000 characters`;
});


// Clear article and previous results
clearBtn.addEventListener("click", function () {

    newsInput.value = "";
    charCount.textContent = "0 / 20,000 characters";

    errorMessage.textContent = "";
    resultSection.classList.add("hidden");

    overallResult.innerHTML = "";
    resultsDiv.innerHTML = "";

    newsInput.focus();
});


// Load a sample article
sampleBtn.addEventListener("click", function () {

    newsInput.value = `A news article reports that a new public initiative
has been introduced to improve access to educational resources.
The report describes the announcement, its objectives and the
expected benefits for students and educational institutions.`;

    newsInput.dispatchEvent(new Event("input"));

    errorMessage.textContent = "";
    newsInput.focus();
});


// Analyze the article
async function checkNews() {

    const news = newsInput.value.trim();

    if (news === "") {
        errorMessage.textContent =
            "Please enter a news article before starting the analysis.";

        resultSection.classList.add("hidden");
        return;
    }

    errorMessage.textContent = "";
    resultSection.classList.add("hidden");

    checkBtn.disabled = true;
    checkBtn.innerHTML = "Analyzing...";

    loadingMessage.classList.remove("hidden");

    try {

        // Send article to Flask backend
        const response = await fetch(
            "https://newsguard-ai-57le.onrender.com/predict",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    text: news
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Unable to analyze the article."
            );
        }

        if (
            !data.predictions ||
            typeof data.predictions !== "object"
        ) {
            throw new Error("Invalid prediction response.");
        }

        const predictions = data.predictions;

        let fakeCount = 0;
        let trueCount = 0;

        const modelNames = Object.keys(predictions);

        // Count predictions
        modelNames.forEach(function (model) {

            if (predictions[model] === "Fake News") {
                fakeCount++;
            }

            else if (predictions[model] === "True News") {
                trueCount++;
            }
        });

        const totalModels = fakeCount + trueCount;

        if (totalModels === 0) {
            throw new Error("No valid model predictions received.");
        }

        // Determine overall prediction
        let finalPrediction;
        let finalClass;

        if (fakeCount > trueCount) {
            finalPrediction = "Fake News";
            finalClass = "fake";
        }

        else if (trueCount > fakeCount) {
            finalPrediction = "True News";
            finalClass = "true";
        }

        else {
            finalPrediction = "No Clear Majority";
            finalClass = "tie";
        }

        // Calculate model agreement
        const majorityCount = Math.max(fakeCount, trueCount);

        const agreement = Math.round(
            (majorityCount / totalModels) * 100
        );

        // Display overall prediction
        overallResult.innerHTML = `
            <h3>OVERALL MODEL PREDICTION</h3>

            <h2 class="${finalClass}">
                ${finalPrediction}
            </h2>

            <p>
                ${fakeCount} models predicted Fake News and
                ${trueCount} models predicted True News.
            </p>
        `;

        // Display agreement
        agreementValue.textContent = agreement + "%";

        agreementBar.style.width = agreement + "%";

        agreementText.textContent =
            `${majorityCount} out of ${totalModels} models support the majority prediction.`;

        // Display individual model predictions
        resultsDiv.innerHTML = "";

        modelNames.forEach(function (model) {

            const prediction = predictions[model];

            const predictionClass =
                prediction === "Fake News" ? "fake" : "true";

            const card = document.createElement("div");
            card.className = "result-card";

            const modelHeading = document.createElement("h3");
            modelHeading.textContent = model;

            const predictionLabel = document.createElement("span");
            predictionLabel.className =
                `prediction ${predictionClass}`;

            predictionLabel.textContent = prediction;

            card.appendChild(modelHeading);
            card.appendChild(predictionLabel);

            resultsDiv.appendChild(card);
        });

        // Display results
        resultSection.classList.remove("hidden");

        resultSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

    catch (error) {

        errorMessage.textContent =
            error.message || "Something went wrong.";

    }

    finally {

        checkBtn.disabled = false;
        checkBtn.innerHTML = "✦ Analyze News";

        loadingMessage.classList.add("hidden");
    }
}


// Connect button to prediction function
checkBtn.addEventListener("click", checkNews);
