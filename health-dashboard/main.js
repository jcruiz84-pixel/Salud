// Mock Smartwatch Connectivity
document.addEventListener('DOMContentLoaded', () => {
    
    const elements = {
        hr: document.getElementById('hr-value'),
        steps: document.getElementById('steps-value'),
        score: document.getElementById('daily-score'),
        spo2: document.getElementById('spo2-value')
    };

    // Helper to animate value changes
    function updateValue(element, newValue, format = false) {
        if (!element) return;
        
        let finalValue = newValue;
        if (format) {
             finalValue = newValue.toLocaleString();
        }

        if (element.innerText !== finalValue.toString()) {
            element.innerText = finalValue;
            element.classList.remove('value-update');
            // Trigger reflow
            void element.offsetWidth;
            element.classList.add('value-update');
        }
    }

    // Mock Data Generators
    let currentHR = 72;
    let currentSteps = 8432;

    // Simulate Real-time Heart Rate (every 2-4 seconds)
    setInterval(() => {
        // Fluctuate HR slightly
        const variance = Math.floor(Math.random() * 5) - 2; 
        currentHR = Math.max(60, Math.min(180, currentHR + variance));
        updateValue(elements.hr, currentHR);
    }, 3000);

    // Simulate walking (steps increasing occasionally)
    setInterval(() => {
        if (Math.random() > 0.5) {
            const stepsTaken = Math.floor(Math.random() * 15) + 1;
            currentSteps += stepsTaken;
            updateValue(elements.steps, currentSteps, true);
            
            // Slightly increase daily score as steps increase
            if (currentSteps % 100 === 0) {
                const currentScore = parseInt(elements.score.innerText);
                if (currentScore < 100) {
                     updateValue(elements.score, currentScore + 1);
                }
            }
        }
    }, 5000);

    // SpO2 check (infrequent)
    setInterval(() => {
        if(Math.random() > 0.8) {
           const newSpo2 = 96 + Math.floor(Math.random() * 4); // 96-99
           updateValue(elements.spo2, newSpo2);
        }
    }, 15000);

    // --- Alert System Logic ---
    const alertModal = document.getElementById('alert-modal');
    const alertMessage = document.getElementById('alert-message');
    const alertTitle = document.getElementById('alert-title');
    const closeModalBtn = document.getElementById('close-modal');

    const alertBadges = {
        hr: document.getElementById('alert-hr'),
        steps: document.getElementById('alert-steps'),
        sleep: document.getElementById('alert-sleep'),
        spo2: document.getElementById('alert-spo2')
    };

    const alertMessages = {
        hr: "Tu frecuencia cardíaca está temporalmente fuera del rango de reposo ideal (60-100 lpm).",
        steps: "Aún no has alcanzado tu meta de 10,000 pasos diarios. ¡Es buen momento para una caminata!",
        sleep: "Tu tiempo de descanso de anoche fue menor a las 8 horas recomendadas.",
        spo2: "Tu nivel de oxígeno en sangre es ligeramente bajo (<96%). Unos ejercicios de respiración ayudarían."
    };

    function evaluateAlerts() {
        // Evaluate HR
        if (currentHR > 100 || currentHR < 50) {
            alertBadges.hr.classList.remove('hidden');
        } else {
            alertBadges.hr.classList.add('hidden');
        }

        // Evaluate Steps
        if (currentSteps < 10000) {
            alertBadges.steps.classList.remove('hidden');
        } else {
            alertBadges.steps.classList.add('hidden');
        }

        // Evaluate Sleep (mock value from DOM)
        const sleepElement = document.getElementById('sleep-value');
        const sleepVal = sleepElement ? parseFloat(sleepElement.innerText) : 7;
        if (sleepVal < 8) {
            alertBadges.sleep.classList.remove('hidden');
        } else {
            alertBadges.sleep.classList.add('hidden');
        }

        // Evaluate SpO2
        const currentSpo2 = parseInt(elements.spo2.innerText);
        if (currentSpo2 < 96) {
            alertBadges.spo2.classList.remove('hidden');
        } else {
            alertBadges.spo2.classList.add('hidden');
        }
    }

    // Evaluate initially and set interval
    evaluateAlerts();
    setInterval(evaluateAlerts, 5000);

    // Alert click handlers
    Object.keys(alertBadges).forEach(metric => {
        if(alertBadges[metric]) {
            alertBadges[metric].addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent opening details view
                
                // Populate modal
                if(metric === 'hr') alertTitle.innerText = "Frecuencia Cardíaca";
                if(metric === 'steps') alertTitle.innerText = "Meta de Pasos";
                if(metric === 'sleep') alertTitle.innerText = "Descanso";
                if(metric === 'spo2') alertTitle.innerText = "Oxígeno";
                
                alertMessage.innerText = alertMessages[metric];
                
                // Show modal
                alertModal.classList.remove('hidden');
            });
        }
    });

    // Close modal handlers
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            alertModal.classList.add('hidden');
        });
    }

    if (alertModal) {
        alertModal.addEventListener('click', (e) => {
            if (e.target === alertModal) {
                alertModal.classList.add('hidden');
            }
        });
    }

    // --- Theme Toggle Logic ---
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const icon = themeToggle.querySelector('i');
            if (document.body.classList.contains('dark-mode')) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        });
    }

    // --- Profile Picture Upload Logic ---
    const profileImg = document.getElementById('profile-img');
    const profileUpload = document.getElementById('profile-upload');
    
    if (profileImg && profileUpload) {
        profileImg.addEventListener('click', () => {
            profileUpload.click();
        });
        
        profileUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    profileImg.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
});
