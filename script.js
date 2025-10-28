document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('receiptForm');
    const receiptsList = document.getElementById('receipts');
    const receiptsSection = document.getElementById('receipts-list');
    const fileInput = document.getElementById('receiptImage');
    const imagePreview = document.getElementById('imagePreview');

    // Check if admin mode
    const isAdmin = location.search.includes('admin=1');

    // Load receipts from localStorage
    let receipts = JSON.parse(localStorage.getItem('receipts')) || [];

    // Display receipts
    function displayReceipts() {
        receiptsList.innerHTML = '';
        if (isAdmin) {
            // Dashboard view: table
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            const headers = ['Room', 'Level', 'Student ID', 'Amount', 'Date', 'Image'];
            const thead = document.createElement('thead');
            const trh = document.createElement('tr');
            headers.forEach(h => {
                const th = document.createElement('th');
                th.textContent = h;
                th.style.border = '1px solid #ddd';
                th.style.padding = '8px';
                trh.appendChild(th);
            });
            thead.appendChild(trh);
            table.appendChild(thead);
            const tbody = document.createElement('tbody');
            receipts.forEach(receipt => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="border:1px solid #ddd; padding:8px;">${receipt.roomNumber}</td>
                    <td style="border:1px solid #ddd; padding:8px;">${receipt.studyLevel}</td>
                    <td style="border:1px solid #ddd; padding:8px;">${receipt.studentId}</td>
                    <td style="border:1px solid #ddd; padding:8px;">฿${receipt.amount}</td>
                    <td style="border:1px solid #ddd; padding:8px;">${receipt.transferDate}</td>
                `;
                const td = document.createElement('td');
                td.style.border = '1px solid #ddd';
                td.style.padding = '8px';
                const img = document.createElement('img');
                img.src = receipt.imageData;
                img.style.maxWidth = '100px';
                img.style.maxHeight = '100px';
                td.appendChild(img);
                tr.appendChild(td);
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            receiptsList.appendChild(table);
        } else {
            // Mobile list view
            receipts.forEach(receipt => {
                const li = document.createElement('li');
                const img = document.createElement('img');
                img.src = receipt.imageData;
                img.style.maxWidth = '100px';
                img.style.maxHeight = '100px';
                li.innerHTML = `
                    <strong>Room: ${receipt.roomNumber}</strong><br>
                    <strong>Level: ${receipt.studyLevel}</strong><br>
                    <strong>Student ID: ${receipt.studentId}</strong><br>
                    Amount: ฿${receipt.amount}<br>
                    Date: ${receipt.transferDate}<br>
                `;
                li.appendChild(img);
                receiptsList.appendChild(li);
            });
        }
    }

    if (isAdmin) {
        // Dashboard mode
        document.getElementById('receipt-form').style.display = 'none';
        receiptsSection.querySelector('h2').textContent = 'Receipt Dashboard';
        document.title = 'Receipt Dashboard';
    }

    // Initial display
    displayReceipts();

    // Handle image preview
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const roomNumber = document.getElementById('roomSelect').value;
        const studyLevel = document.getElementById('studyLevel').value;
        const studentId = document.getElementById('studentId').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const transferDate = document.getElementById('transferDate').value;
        const notes = document.getElementById('notes').value;
        const file = fileInput.files[0];

        if (!file) {
            alert('Please select a receipt image.');
            return;
        }

        // Convert image to base64
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageData = e.target.result;

            // Create new receipt
            const newReceipt = {
                id: Date.now(),
                roomNumber,
                studyLevel,
                studentId,
                amount,
                transferDate,
                notes,
                imageData
            };

            // Add to receipts array
            receipts.push(newReceipt);

            // Save to localStorage (simulating server upload)
            localStorage.setItem('receipts', JSON.stringify(receipts));

            // Update display
            displayReceipts();

            // Clear form
            form.reset();
            imagePreview.src = '';
        };
        reader.readAsDataURL(file);
    });
});
