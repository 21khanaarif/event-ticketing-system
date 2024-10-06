let currentPage = 1;
const eventsPerPage = 6;
let totalPages = 1;
let searchQuery = ""; // Store the search term globally

// Fetch Events from Strapi API with Pagination and Search
const fetchEvents = async (page, query = "") => {
    try {
        const apiUrl = query
            ? `http://localhost:1337/api/events?populate=*&pagination[page]=${page}&pagination[pageSize]=${eventsPerPage}&filters[Event_Name][$contains]=${query}`
            : `http://localhost:1337/api/events?populate=*&pagination[page]=${page}&pagination[pageSize]=${eventsPerPage}`;

        console.log("Fetching events from:", apiUrl); // Debugging log
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched data:", data); // Debugging log
        const events = data.data;
        totalPages = data.meta.pagination.pageCount; // Get total page count from Strapi

        renderEvents(events, page);
    } catch (error) {
        console.error("Error fetching events:", error);
    }
};

// Fetch all event names for suggestions (on each search input)
const fetchEventNames = async () => {
    try {
        const apiUrl = `http://localhost:1337/api/events?fields[0]=Event_Name&_=${new Date().getTime()}`; // Avoid caching by adding timestamp
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data.data.map(event => event.attributes.Event_Name); // Extract event names
    } catch (error) {
        console.error("Error fetching event names:", error);
        return [];
    }
};

// Filter and show suggestions as the user types
const showSuggestions = async () => {
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    const suggestionBox = document.getElementById('event-suggestions');

    // Fetch event names on each input for real-time updates
    const eventNames = await fetchEventNames();

    // Filter event names based on search input
    const filteredNames = eventNames.filter(name =>
        name.toLowerCase().includes(searchInput)
    );

    console.log("Filtered names:", filteredNames); // Debugging log

    // Clear previous suggestions
    suggestionBox.innerHTML = '';

    // Add filtered event names to the datalist
    filteredNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        suggestionBox.appendChild(option);
    });
};

// Render events on the current page
const renderEvents = (events, page) => {
    const eventList = document.getElementById('event-list');
    eventList.innerHTML = ''; // Clear the event list

    if (events.length === 0) {
        eventList.innerHTML = '<p class="text-center">No events found</p>';
        return;
    }

    events.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'col-md-4'; // Bootstrap column for responsive layout

        const imageUrl = event.attributes.Display_Picture ? event.attributes.Display_Picture.data.attributes.url : '';  

        eventCard.innerHTML = `
            <div class="card">
                ${imageUrl ? `<img src="http://localhost:1337${imageUrl}" class="card-img-top" alt="${event.attributes.Event_Name}">` : ''}
                <div class="card-body">
                    <h5 class="card-title">${event.attributes.Event_Name}</h5>
                    <p class="card-text">
                        <strong>Event_Id:</strong> ${event.attributes.Event_Id}<br>
                        <strong>Date:</strong> ${event.attributes.Date_and_Time}<br>
                        <strong>Location:</strong> ${event.attributes.Venue}<br>
                        ${event.attributes.Description ? `<strong>Description:</strong> ${event.attributes.Description}` : ''}
                    </p>
                </div>
            </div>
        `;

        eventList.appendChild(eventCard);
    });

    // Update the page number display
    document.getElementById('current-page').innerText = `Page ${currentPage}`;
};

// Handle Search Functionality
const handleSearch = () => {
    const searchInput = document.getElementById('search-input').value.trim();
    console.log("Search initiated for:", searchInput); // Debugging log
    searchQuery = searchInput;
    currentPage = 1; // Reset to the first page after a new search
    fetchEvents(currentPage, searchQuery); // Fetch events with the search query
};

// Pagination functionality
const goToNextPage = () => {
    if (currentPage < totalPages) {
        currentPage++;
        fetchEvents(currentPage, searchQuery);
    }
};

const goToPreviousPage = () => {
    if (currentPage > 1) {
        currentPage--;
        fetchEvents(currentPage, searchQuery);
    }
};

// Add event listener for real-time suggestions
document.getElementById('search-input').addEventListener('input', showSuggestions);

// Event listeners for pagination buttons and search button
document.getElementById('next-btn').addEventListener('click', goToNextPage);
document.getElementById('prev-btn').addEventListener('click', goToPreviousPage);
document.getElementById('search-btn').addEventListener('click', handleSearch);

// Fetch and render the first page of events on load
fetchEvents(currentPage);
