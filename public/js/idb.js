let db;
// the 1 in the second argument is the version(default) of the database
const request = indexedDB.open('track_budgets', 1);

// event listener to create and update table
request.onupgradeneeded = function(event) {
    const db = event.target.result;
    // create object store (table)
    db.createObjectStore('new_budget', { autoIncrement: true });
};

request.onsuccess = function(event) {
    db = event.target.result;

    if (navigator.onLine) {
        uploadBudget();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// executed when trying to save new budget without internet connection
// executes on sendTransaction{fetch().catch()} called in index.js
function saveRecord(record) {
    // a transaction is a temporary connection to the database
    const transaction = db.transaction(['new_budget'], 'readwrite');

    const budgetObjectStore = transaction.objectStore('new_budget');

    budgetObjectStore.add(record);
}

function uploadBudget() {
    const transaction = db.transaction(['new_budget'], 'readwrite');

    const budgetObjectStore = transaction.objectStore('new_budget');

    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        // if indexedDB data, send to api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                const transaction = db.transaction(['new_budget'], 'readwrite');

                const budgetObjectStore = transaction.objectStore('new_budget');

                budgetObjectStore.clear();

                alert('Budget has been submitted!')
            })
            .catch(err => {
                console.error(err);
            });
        }
    };
}

window.addEventListener('online', uploadBudget);