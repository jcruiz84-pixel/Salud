// insights.js

document.addEventListener('DOMContentLoaded', () => {
    const insightsList = document.getElementById('insights-list');

    // Simulate getting current data from a global store or local storage
    // Since we are mocking, we will just use some randomized realistic values
    const currentSteps = Math.floor(Math.random() * 5000) + 3000; // 3000 - 8000
    const currentSpo2 = 94 + Math.floor(Math.random() * 5); // 94 - 98
    const sleepVal = 5 + Math.random() * 3; // 5 - 8

    setTimeout(() => {
        let insightsHTML = '';
        
        // Steps insight
        const goalSteps = 10000;
        if (currentSteps < goalSteps) {
            insightsHTML += `<li><i class="fa-solid fa-shoe-prints"></i> Tienes ${currentSteps.toLocaleString()} pasos. Te faltan ${(goalSteps - currentSteps).toLocaleString()} pasos para tu meta diaria. ¡Sal a caminar!</li>`;
        } else {
            insightsHTML += `<li><i class="fa-solid fa-check"></i> ¡Has logrado tu meta de pasos de hoy! Sigue así.</li>`;
        }

        // Oxygen insight
        if (currentSpo2 < 96) {
            insightsHTML += `<li><i class="fa-solid fa-droplet"></i> Tu oxígeno en sangre está un poco bajo (${currentSpo2}%). Tómate un momento para hacer ejercicios de respiración profunda.</li>`;
        } else {
            insightsHTML += `<li><i class="fa-solid fa-droplet"></i> Tu oxígeno en sangre está en niveles óptimos (${currentSpo2}%).</li>`;
        }

        // Sleep insight
        if (sleepVal < 7) {
            insightsHTML += `<li><i class="fa-solid fa-moon"></i> Has dormido solo ${sleepVal.toFixed(1)} horas. Debes intentar descansar al menos 7-8 horas esta noche para recuperarte adecuadamente.</li>`;
        } else {
            insightsHTML += `<li><i class="fa-solid fa-moon"></i> Tus niveles de sueño son excelentes (${sleepVal.toFixed(1)} horas). Esto favorece mucho tu recuperación.</li>`;
        }

        insightsList.innerHTML = insightsHTML;
    }, 600); // Slight delay to simulate data loading
});
