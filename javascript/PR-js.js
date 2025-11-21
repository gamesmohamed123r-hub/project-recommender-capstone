/* === PROJECT RECOMMENDER JS - COMPLETE FILE === */

// Wait for the HTML to load before running any scripts
document.addEventListener("DOMContentLoaded", function() {
    
    // --- 1. Initialize WOW.js (Runs on all pages) ---
    // Make sure WOW.js is included in your HTML
    if (typeof WOW === 'function') {
        new WOW().init();
    }

    // --- 2. Search Bar Logic (Runs on Interests & Skills pages) ---
    // (ده الكود بتاع البحث اللي كان شغال)
    const searchbox = document.getElementById("searchbox");
    const labels = document.querySelectorAll("#list label");

    // Check if a searchbox and labels exist on this page
    if (searchbox && labels.length > 0) {
        
        searchbox.addEventListener("input", function() {
            const searchTerm = searchbox.value.toLowerCase();

            labels.forEach(label => {
                const labelText = label.textContent.toLowerCase();
                const isMatch = labelText.includes(searchTerm);
                const isEmpty = searchTerm === "";

                // Show/Hide logic
                if (isMatch || isEmpty) {
                    label.style.display = "flex"; 
                } else {
                    label.style.display = "none";
                }

                // Highlight logic
                if (isMatch && !isEmpty) {
                    label.style.background = "yellow";
                    label.style.width = "fit-content";
                } else {
                    label.style.background = "none";
                    label.style.width = ""; // Reset width
                }
            });
        });
    }

    // --- 3. Save Interests (Runs on Interests page) ---
    const interestsNextBtn = document.getElementById("button2p2");

    if (interestsNextBtn) {
        interestsNextBtn.addEventListener("click", function() {
            // Get all checked interests
            const checkedInterests = [];
            const checkboxes = document.querySelectorAll("#list input[type='checkbox']:checked");
            
            checkboxes.forEach(cb => {
                // .textContent gets the text from the <label>
                checkedInterests.push(cb.parentElement.textContent.trim());
            });
            
            // Save the array to the browser's local storage
            localStorage.setItem("userInterests", JSON.stringify(checkedInterests));
            
            // Manually navigate to the next page
            window.location.href = 'skills.html';
        });
    }

    // --- 4. Save Skills (Runs on Skills page) ---
    const skillsNextBtn = document.getElementById("button2p3");

    if (skillsNextBtn) {
        skillsNextBtn.addEventListener("click", function() {
            // Get all checked skills
            const checkedSkills = [];
            const checkboxes = document.querySelectorAll("#list input[type='checkbox']:checked");
            
            checkboxes.forEach(cb => {
                checkedSkills.push(cb.parentElement.textContent.trim());
            });
            
            // Save the array to local storage
            localStorage.setItem("userSkills", JSON.stringify(checkedSkills));
            
            // Manually navigate to the results page
            window.location.href = 'results.html';
        });
    }

    // --- 5. Display Results (Runs on Results page) ---
    // (ده الكود الجديد اللي بيتصل بالباك إند)
    const resultsContainer = document.querySelector(".resultss");
    
    // This code will only run on results.html
    if (resultsContainer) {
        // Retrieve the saved data from previous steps
        const userInterests = JSON.parse(localStorage.getItem("userInterests")) || [];
        const userSkills = JSON.parse(localStorage.getItem("userSkills")) || [];

        // Show a loading message
        resultsContainer.innerHTML = '<p style="padding: 20px;">Loading recommendations...</p>';
        
        // Call the backend
        fetchRecommendations(userInterests, userSkills, resultsContainer);
    }
});


// (NEW FUNCTION)
// Sends data to the backend and gets results
async function fetchRecommendations(interests, skills, container) {
    try {
        // Connect to the server we created
      const response = await fetch('http://gamesmohamed123rhub.pythonanywhere.com/recommend', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    // Send the interests and skills in the request body
    body: JSON.stringify({ 
        interests: interests, 
        skills: skills 
    })
});
        if (!response.ok) {
            // This will be 'true' if the Python server crashed (like the 500 error)
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get the results from Python
        const recommendedProjects = await response.json();
        
        // Display the results
        displayResultsInPage(recommendedProjects, container);

    } catch (error) {
        console.error("Error fetching recommendations:", error);
        container.innerHTML = `
            <div class="alert alert-danger" role="alert" style="margin: 20px;">
                <strong>Error:</strong> Could not connect to the recommendation server.
                <br> (تأكد أن ملف البايثون يعمل في الـ Terminal)
                <br> (وتأكد أنك أصلحت اسم ملف الـ CSV)
            </div>
        `;
    }
}

// (MODIFIED FUNCTION)
// This function now just displays the results (to match Figma design)
function displayResultsInPage(projects, container) {
    // Clear the "Loading..." message
    container.innerHTML = "";

    if (projects.length === 0) {
        container.innerHTML = `
            <div class="alert alert-warning" role="alert" style="margin: 20px;">
                <strong>No projects found!</strong> Try selecting more interests or skills.
            </div>
        `;
        return;
    }

    // Build the HTML list to match the Figma design
    let htmlContent = '<ul style="list-style-type: none; padding: 25px; font-size: 18px;">';
    
    projects.forEach(project => {
        // Round the decimal number to a whole number
        const score = Math.round(project.score); 
        
        htmlContent += `
            <li style="margin-bottom: 15px;">
                ${project.id}-${project.title} <strong>${score}%</strong>
            </li>
        `;
    });
    
    htmlContent += '</ul>';
    
    container.innerHTML = htmlContent;
}