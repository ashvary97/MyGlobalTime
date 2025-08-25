
document.addEventListener("DOMContentLoaded", function() {
    const headerPlaceholder = document.getElementById('main-header');
    
    if (headerPlaceholder) {
        fetch('header-section.html')
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