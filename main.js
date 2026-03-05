document.addEventListener("DOMContentLoaded", function() {
    const headerPlaceholder = document.getElementById('main-header');
    
    if (headerPlaceholder) {
        fetch('/header.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.text();
            })
            .then(data => {
                headerPlaceholder.innerHTML = data;
            })
            .catch(error => {
                console.error('There has been a problem with your fetch operation:', error);
                headerPlaceholder.innerHTML = '<p>Error loading header. Please try again later.</p>';
            });
    }
});

// AI Smart Meeting Finder Function
async function findMeetingTime() {
    const userInput = document.getElementById('ai-input').value;
    const resultDiv = document.getElementById('ai-result');
    const apiKey = "AIzaSyAIzu9WdqLnYEWsDeSU9FtyeorXOS5c5B8"; // IMPORTANT: Replace with your actual key

    if (!userInput.trim()) {
        resultDiv.innerHTML = "Please enter the cities and your constraints first.";
        return;
    }

    resultDiv.innerHTML = "Searching for the best overlap... ⏳";

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Context: You are a highly efficient global meeting scheduler. 
                        User Request: "${userInput}"
                        Task: Find a common metting window as asked by the user for all mentioned cities. If no perfect overlap exists, find the least painful compromise.
                        Output Constraints: Output ONLY valid HTML. Do NOT wrap the response in markdown blocks (no \`\`\`html). Do NOT include conversational filler like "Here is the schedule".
                        Format strictly like this:
                        <div style="margin-bottom: 12px; font-size: 1.1rem;"><strong>✅ Suggested Time:</strong> [e.g., 30-minute window]</div>
                        <ul style="list-style-type: none; padding-left: 0; margin-bottom: 12px; space-y-2;">
                            <li style="margin-bottom: 6px;">📍 <strong style="color: #a5b4fc;">[City 1]:</strong> [Local Time]</li>
                            <li style="margin-bottom: 6px;">📍 <strong style="color: #a5b4fc;">[City 2]:</strong> [Local Time]</li>
                        </ul>
                        <div style="font-size: 0.85rem; color: #9ca3af; border-top: 1px solid #4b5563; padding-top: 8px;"><em>Note: [Brief 1-sentence explanation of the overlap]</em></div>`
                    }]
                }]
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || "Network response was not ok.");
        }
        
        if (data.candidates && data.candidates.length > 0) {
            // The AI will now return raw, pre-formatted HTML
            let aiResponse = data.candidates[0].content.parts[0].text;
            
            // Cleanup: Sometimes the API ignores the "no markdown block" rule, so we strip it just in case
            aiResponse = aiResponse.replace(/```html/g, '').replace(/```/g, '').trim();
            
            // Inject the clean HTML into the UI
            resultDiv.innerHTML = `
                <div style="background-color: #1f2937; border: 1px solid #4b5563; padding: 20px; border-radius: 8px; text-align: left; color: #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    ${aiResponse}
                </div>`;
        } else {
            resultDiv.innerHTML = "Sorry, I couldn't generate a recommendation right now. Check the console for details.";
        }
        
    } catch (error) {
        resultDiv.innerHTML = `<span class='text-red-400'>Error: ${error.message}</span>`;
        console.error("AI Error Details:", error);
    }
}