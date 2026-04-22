const games = [
    { match: "Chelsea vs Man City", time: "18:30", date: "2024-05-18", day: "Saturday" },
    { match: "Arsenal vs Liverpool", time: "16:00", date: "2024-05-19", day: "Sunday" },
    { match: "Real Madrid vs Barcelona", time: "21:00", date: "2024-05-18", day: "Saturday" },
    { match: "Man United vs Bayern Munich", time: "20:45", date: "2024-05-21", day: "Tuesday" },
    { match: "PSG vs Dortmund", time: "22:00", date: "2024-05-22", day: "Wednesday" },
    { match: "AC Milan vs Inter Milan", time: "19:00", date: "2024-05-20", day: "Monday" }
];
const RATE_PER_GAME = 50;
const PAYSTACK_PUBLIC_KEY = 'pk_live_f0ea304b10103570cc216fbe2cd33fcc2b52df3d'; // Replace with your actual Paystack Public Key
let selectedGames = [];

// Step 1: Show available games
function init() {
    const listDiv = document.getElementById('game-list');
    listDiv.innerHTML = games.map((game, index) => `
        <label class="game-card" for="game-${index}">
            <input type="checkbox" id="game-${index}" value="${game.match}" onchange="updateSelection()">
            <div class="match-info">
                <span class="match-name">${game.match}</span>
                <div class="match-details">
                    <span>${game.day}</span> | <span>${game.date}</span> | <span>${game.time}</span>
                </div>
            </div>
        </label>
    `).join('');
}

function updateSelection() {
    selectedGames = [];
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(cb => selectedGames.push(cb.value));
}

// Step 3: Show summary
function showBookingSummary() {
    if (selectedGames.length === 0) {
        alert("Please select at least one game to continue!");
        return;
    }

    const total = selectedGames.length * RATE_PER_GAME;
    const summarySection = document.getElementById('summary-section');
    const gameSection = document.getElementById('game-list-section');

    gameSection.style.display = 'none';
    summarySection.style.display = 'block';

    summarySection.innerHTML = `
        <h2>Booking Summary</h2>
        <ul>
            ${selectedGames.map(g => `<li>${g} - KSH ${RATE_PER_GAME}</li>`).join('')}
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
    const statusSection = document.getElementById('payment-status-section');

    summarySection.style.display = 'none';
    statusSection.style.display = 'block';

    const name = document.getElementById('customer-name').value;
    const total = selectedGames.length * RATE_PER_GAME;

    if (method === 'PAYSTACK') {
        if (!name) {
            alert("Please enter your name to proceed with the payment.");
            resetBooking();
            return;
        }

        let handler = PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
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
            <p class="status-msg">Please hand over KSH ${selectedGames.length * RATE_PER_GAME} to the attendant.</p>
            <button onclick="generateReceipt('CASH', '${name || 'Guest'}')">Attendant: Confirm Cash Received</button>
            <button style="background: #444; margin-top:10px;" onclick="resetBooking()">Cancel</button>
        `;
    }
}

// Step 5: Generate Receipt
function generateReceipt(method, customerName) {
    const statusSection = document.getElementById('payment-status-section');
    const receiptSection = document.getElementById('receipt-section');

    statusSection.style.display = 'none';
    receiptSection.style.display = 'block';

    const total = selectedGames.length * RATE_PER_GAME;
    const date = new Date();
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString();
    const receiptNo = 'AWW-' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');

    let gamesListText = selectedGames.map((game, i) => 
        `  ${i + 1}. ${game.padEnd(20, '.')} KSH ${RATE_PER_GAME}`
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
        <button onclick="window.print()">Print Receipt</button>
        <button onclick="location.reload()">New Booking</button>
    `;

    console.log("Booking Confirmed via " + method);
}

function resetBooking() {
    document.getElementById('summary-section').style.display = 'none';
    document.getElementById('payment-status-section').style.display = 'none';
    document.getElementById('game-list-section').style.display = 'block';
}

window.onload = init;