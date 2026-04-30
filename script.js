const games = [
    { match: "Arsenal vs Fulham", time: "19:30", date: "2026-05-02", day: "Saturday" },
    { match: "Man United vs Liverpool", time: "17:30", date: "2026-05-03", day: "Sunday" },
    { match: "Aston Villa vs Totenham", time: "21:00", date: "2026-05-03", day: "Sunday" },
    { match: "Chelsea vs Nottm Forest", time: "17:00", date: "2026-05-04", day: "Monday" },
    { match: "Everton vs Man City", time: "22:00", date: "2026-05-04", day: "Monday" },
    { match: "Arsenal vs A. Madrid", time: "22:00", date: "2026-05-05", day: "Tuesday" },
    { match: "Bayern vs PSG", time: "22:00", date: "2026-05-06", day: "Wednesday" },
];

const CONFIG = {
    RATE_PER_GAME: 50,
    PAYSTACK_PUBLIC_KEY: 'pk_live_f0ea304b10103570cc216fbe2cd33fcc2b52df3d',
    STORAGE_KEY: 'selected_games_cache'
};

let selectedGames = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY)) || [];

// Step 1: Show available games
function init() {
    const listDiv = document.getElementById('game-list');
    listDiv.innerHTML = games.map((game, index) => {
        const isChecked = selectedGames.includes(game.match) ? 'checked' : '';
        return `
            <label class="game-card" for="game-${index}">
                <input type="checkbox" id="game-${index}" value="${game.match}" onchange="updateSelection()" ${isChecked}>
                <div class="match-info">
                    <span class="match-name">${game.match}</span>
                    <div class="match-details">
                        <span>${game.day}</span> | <span>${game.date}</span> | <span>${game.time}</span>
                    </div>
                </div>
            </label>
        `;
    }).join('');
    updateSelection(); // Initialize total on load
}

function updateSelection() {
    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
    selectedGames = checkboxes.map(cb => cb.value);
    
    // Persistence
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(selectedGames));

    // Dynamic UI feedback (assumes an element with id 'floating-total' exists in HTML)
    const totalDisplay = document.getElementById('floating-total');
    if (totalDisplay) {
        totalDisplay.innerText = `Total: KES ${selectedGames.length * CONFIG.RATE_PER_GAME}`;
    }
}

// Step 3: Show summary
function showBookingSummary() {
    if (selectedGames.length === 0) {
        alert("Please select at least one game to continue!");
        return;
    }

    const total = selectedGames.length * CONFIG.RATE_PER_GAME;
    const summarySection = document.getElementById('summary-section');
    const gameSection = document.getElementById('game-list-section');

    gameSection.style.display = 'none';
    summarySection.style.display = 'block';

    summarySection.innerHTML = `
        <h2>Booking Summary</h2>
        <ul>
            ${selectedGames.map(g => `<li>${g} - KSH ${CONFIG.RATE_PER_GAME}</li>`).join('')}
        </ul>
        <div class="total-highlight">TOTAL COST: KES ${total}</div>
        
        <input type="text" id="customer-name" placeholder="Enter your name" style="width: 100%; padding: 10px; margin-bottom: 10px; box-sizing: border-box;">
        
        <p>Confirm payment method:</p>
        <div class="payment-options">
            <button class="payment-btn" onclick="initiatePayment('PAYSTACK')">PAY WITH CARD/MPESA</button>
            <button class="payment-btn" onclick="initiatePayment('CASH')">CASH</button>
        </div>
        <button style="background: #444; color: white;" onclick="resetBooking()">Go Back</button>
    `;
}

// Step 4: Initiate Payment and Wait for Confirmation
function initiatePayment(method) {
    const summarySection = document.getElementById('summary-section');
    const name = document.getElementById('customer-name').value.trim();

    if (!name) {
        alert("Please enter your name to proceed.");
        return;
    }

    const statusSection = document.getElementById('payment-status-section');
    summarySection.style.display = 'none';
    statusSection.style.display = 'block';

    const total = selectedGames.length * CONFIG.RATE_PER_GAME;

    if (method === 'PAYSTACK') {
        let handler = PaystackPop.setup({
            key: CONFIG.PAYSTACK_PUBLIC_KEY,
            email: 'customer@amosalah.biz', // Placeholder email required by Paystack SDK
            amount: total * 100, // Paystack expects amount in subunits (KES cents)
            currency: 'KES',
            callback: function(response) {
                generateReceipt('PAYSTACK', name);
            },
            onClose: function() {
                alert('Window closed. Payment not completed.');
                resetBooking();
            }
        });
        handler.openIframe();
    } else {
        statusSection.innerHTML = `
            <h2>Awaiting Cash</h2>
            <p class="status-msg">Please hand over KSH ${total} to the attendant.</p>
            <button onclick="confirmCashPayment('${name}', ${total})">Attendant: Confirm Cash Received</button>
            <button style="background: #444; margin-top:10px;" onclick="resetBooking()">Cancel</button>
        `;
    }
}

// Step 5: Generate Receipt
function generateReceipt(method, customerName) {
    // Basic validation to prevent generating receipt without a confirmed name
    if (!customerName || customerName.trim() === '') {
        alert("Error: Customer name is missing for receipt generation.");
        resetBooking();
        return;
    }

    // Ensure selectedGames is not empty, though this should be caught earlier
    if (selectedGames.length === 0) {
        alert("Error: No games selected for receipt generation.");
        resetBooking();
        return;
    }

    const statusSection = document.getElementById('payment-status-section');
    const receiptSection = document.getElementById('receipt-section');

    statusSection.style.display = 'none';
    receiptSection.style.display = 'block';

    const total = selectedGames.length * CONFIG.RATE_PER_GAME;
    const date = new Date();
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString();
    const receiptNo = 'AWW-' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');

    let gamesListText = selectedGames.map((game, i) => 
        `  ${i + 1}. ${game.padEnd(20, '.')} KSH ${CONFIG.RATE_PER_GAME}`
    ).join('\n');

    const receiptContent = `
===============================
   NEYMAR'S DSTV SHOW BIZ
       OLOIKA CENTER
       SHARP BOYZ AT WORK
===============================
Date: ${dateStr}
Time: ${timeStr}
Customer: ${customerName || 'Guest'}
-------------------------------
GAMES BOOKED:
${gamesListText}
-------------------------------
TOTAL PAID:        KSH ${total}
Payment Method:    ${method}
Receipt No:        ${receiptNo}
===============================
   Thank you for visiting!
   Come back for more fun!
===============================`;

    receiptSection.innerHTML = `
        <div class="receipt">${receiptContent}</div>
        <div class="actions">
            <button onclick="window.print()">Print Receipt</button>
            <button onclick="clearAndRestart()">New Booking</button>
        </div>
    `;

    // Clear cache after successful booking
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    
    console.log("Booking Confirmed via " + method);
}

// New function for the intermediate cash confirmation step
function confirmCashPayment(customerName, totalAmount) {
    const statusSection = document.getElementById('payment-status-section');
    statusSection.innerHTML = `
        <h2>Cash Payment Confirmed</h2>
        <p class="status-msg">Cash of KSH ${totalAmount} received from <strong>${customerName}</strong>.</p>
        <p>Click below to finalize the booking and generate the receipt.</p>
        <div class="actions">
            <button onclick="generateReceipt('CASH', '${customerName}')">Generate Receipt</button>
            <button style="background: #444; margin-top:10px;" onclick="resetBooking()">Cancel</button>
        </div>
    `;
}

function resetBooking() {
    document.getElementById('summary-section').style.display = 'none';
    document.getElementById('payment-status-section').style.display = 'none';
    document.getElementById('game-list-section').style.display = 'block';
}

function clearAndRestart() {
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    location.reload();
}

window.onload = init;