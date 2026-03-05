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
    const apiKey = "AIzaSyBDDpC8TXzKZK-mtgkzeCHkRCAgeVAayJU"; // IMPORTANT: Replace with your actual key

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

// ==========================================
// TIME ASSISTANT CHATBOT LOGIC (Manual RAG)
// ==========================================

// 1. The Knowledge Base (Extracted from your blog data)
const siteKnowledge = {
    "india_timezone": "India has a single time zone. This causes practical problems in the eastern states where the sun rises very early, leading to an ongoing debate about creating a second time zone to improve productivity.",
    "utc": "UTC stands for Coordinated Universal Time. It is the master clock that keeps the entire planet in sync, used for everything from global aviation to the internet infrastructure.",
    "dst": "Daylight Saving Time is a twice-yearly ritual of changing our clocks. It has a surprising history and is heavily debated regarding its actual energy savings and health impacts.",
    "first_clocks": "The Sun was our first clock. Ancient cultures learned to tell time by tracking shadows using sundials. Later, they used water (water thieves), sand (sand timers), and fire to master timekeeping.",
    "date_line": "The International Date Line is an imaginary line running through the middle of the Pacific Ocean where a new day officially begins."
};

// 2. Toggle UI function
function toggleAssistant() {
    const chatWindow = document.getElementById('assistant-chat-window');
    const fab = document.getElementById('assistant-fab');
    
    if (chatWindow.classList.contains('hidden')) {
        // Open Chat
        chatWindow.classList.remove('hidden');
        chatWindow.classList.add('flex');
        fab.classList.add('hidden'); // Hide the floating button
        
        // Auto-focus input when opened
        setTimeout(() => document.getElementById('assistant-input').focus(), 100);
    } else {
        // Close Chat
        chatWindow.classList.add('hidden');
        chatWindow.classList.remove('flex');
        fab.classList.remove('hidden'); // Show the floating button
    }
}

// 3. AI Chat function
async function askTimeAssistant() {
    const inputField = document.getElementById('assistant-input');
    const userQuery = inputField.value.trim();
    const resultArea = document.getElementById('assistant-response');
    const apiKey = "AIzaSyBDDpC8TXzKZK-mtgkzeCHkRCAgeVAayJU"; // Replace with your key if needed

    if (!userQuery) return;

    // A. Display User Message (Updated UI)
    resultArea.innerHTML += `
        <div class="text-right">
            <div class="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-sm shadow-sm inline-block max-w-[85%] text-left leading-relaxed">
                ${userQuery}
            </div>
        </div>`;
    inputField.value = '';
    resultArea.scrollTop = resultArea.scrollHeight;

    // B. Display Loading State (Updated UI)
    const loadingId = 'loading-' + Date.now();
    resultArea.innerHTML += `
        <div id="${loadingId}" class="text-left animate-pulse flex items-center gap-2 mt-2">
            <div class="bg-gray-800 border border-gray-700 text-gray-400 p-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                <span class="block w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                <span class="block w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                <span class="block w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></span>
            </div>
        </div>`;
    resultArea.scrollTop = resultArea.scrollHeight;

    const context = Object.values(siteKnowledge).join(" ");

    const systemPrompt = `
        You are the "MyGlobalTime Assistant", a helpful, professional chatbot for a world clock website. 
        Use the following Context derived from our blogs to answer the User Question.
        Context: ${context}
        User Question: ${userQuery}
        Rules: 
        1. Keep it short and conversational (1 to 3 sentences max).
        2. If the answer is in the Context, use it.
        3. If the answer is NOT in the Context, say "I don't have an article on that yet, but here is what I know..." and briefly answer using your general knowledge about time.
        4. Do not use markdown formatting (no asterisks or bolding), just plain text.
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }]
            })
        });

        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error?.message || "API Error");

        const aiResponse = data.candidates[0].content.parts[0].text;
        
        // E. Replace loading spinner with real answer (Updated UI)
        document.getElementById(loadingId).outerHTML = `
            <div class="text-left mt-2">
                <div class="bg-gray-800 border border-gray-700 text-gray-200 p-3 rounded-2xl rounded-tl-sm shadow-sm inline-block max-w-[90%] leading-relaxed">
                    ${aiResponse}
                </div>
            </div>`;
        resultArea.scrollTop = resultArea.scrollHeight;

    } catch (error) {
        document.getElementById(loadingId).outerHTML = `
            <div class="text-left mt-2">
                <div class="bg-red-900/40 border border-red-800 text-red-200 p-3 rounded-2xl rounded-tl-sm shadow-sm inline-block max-w-[90%]">
                    Oops, my connection to the server broke. Please try asking again!
                </div>
            </div>`;
        console.error("Assistant AI Error:", error);
    }
}